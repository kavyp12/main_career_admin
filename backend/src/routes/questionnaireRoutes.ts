import express, { Request, Response } from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import Questionnaire from '../models/QuestionnaireModel';
import User from '../models/User';
import axios from 'axios';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

const router = express.Router();

const asyncHandler = (fn: Function) => (req: Request, res: Response) => {
  Promise.resolve(fn(req, res)).catch((error) => {
    console.error('Route error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  });
};

router.post('/submit-answers', verifyToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: No user ID found' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingQuestionnaire = await Questionnaire.findOne({ userId });
    if (existingQuestionnaire) {
      return res.status(400).json({ message: 'Questionnaire already submitted' });
    }

    await User.findByIdAndUpdate(userId, { status: 'Analyzing' });

    const transformedAnswers = req.body.answers.reduce((acc: Record<string, any>, curr: any) => {
      acc[`question${curr.questionId}`] = curr.answer;
      return acc;
    }, {});

    const newQuestionnaire = new Questionnaire({
      userId: userId,
      studentName: `${user.firstName} ${user.lastName}`,
      age: user.age || '',
      academicInfo: `${user.standard} Grade`,
      interests: user.interests || '',
      answers: transformedAnswers
    });
    await newQuestionnaire.save();

    const aiServiceData = {
      studentName: newQuestionnaire.studentName,
      age: newQuestionnaire.age,
      academicInfo: newQuestionnaire.academicInfo,
      interests: newQuestionnaire.interests,
      answers: transformedAnswers
    };

    const aiResponse = await axios.post('https://p.enhc.tech/api/submit-assessment', aiServiceData);
    if (!aiResponse.data.task_id) {
      throw new Error('No task ID received from AI service');
    }

    // Start polling the task status
    const pollStatus = async (taskId: string) => {
      const maxPollAttempts = 120; // 10 minutes with 5-second intervals
      let attempts = 0;

      const checkStatus = async () => {
        try {
          const statusResponse = await axios.get(`https://p.enhc.tech/api/task-status/${taskId}`);
          const { status, report_url, error } = statusResponse.data;

          if (status === 'completed' && report_url) {
            const reportPath = report_url.split('/').pop();
            await User.findByIdAndUpdate(userId, {
              status: 'Report Generated',
              reportPath: reportPath
            });
          } else if (status === 'error') {
            console.error('Task failed:', error);
            await User.findByIdAndUpdate(userId, { status: 'Error' });
          } else if (attempts < maxPollAttempts) {
            attempts++;
            setTimeout(checkStatus, 5000); // Poll every 5 seconds
          } else {
            console.error('Polling timed out');
            await User.findByIdAndUpdate(userId, { status: 'Error' });
          }
        } catch (err) {
          console.error('Error polling task status:', err);
          if (attempts < maxPollAttempts) {
            attempts++;
            setTimeout(checkStatus, 5000);
          } else {
            await User.findByIdAndUpdate(userId, { status: 'Error' });
          }
        }
      };
      checkStatus();
    };

    pollStatus(aiResponse.data.task_id);
    return res.status(202).json({ message: 'Report generation started' });

  } catch (error) {
    console.error('Submission error:', error);
    await User.findByIdAndUpdate(userId, { status: 'Error' });
    return res.status(500).json({
      message: 'Failed to process submission',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

router.get('/report-status', verifyToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: No user ID found' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({
      status: user.status || 'Pending',
      reportPath: user.reportPath || null
    });
  } catch (error) {
    console.error('Status fetch error:', error);
    return res.status(500).json({
      message: 'Failed to fetch report status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

router.get('/get-answers', verifyToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: No user ID found' });
  }

  try {
    const questionnaire = await Questionnaire.findOne({ userId });
    if (!questionnaire) {
      return res.status(404).json({ message: 'No questionnaire found for this user' });
    }
    return res.status(200).json(questionnaire);
  } catch (error) {
    console.error('Questionnaire fetch error:', error);
    return res.status(500).json({
      message: 'Failed to fetch questionnaire',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;