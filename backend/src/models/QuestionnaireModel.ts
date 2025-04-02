// D:\new backup latest\career-guide - Copy\backend\src\models\QuestionnaireModel.ts
import mongoose from 'mongoose';

const QuestionnaireSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  age: {
    type: String,
    default: ''
  },
  academicInfo: {
    type: String,
    default: ''
  },
  interests: {
    type: String,
    default: ''
  },
  answers: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  skillScores: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { 
  timestamps: true 
});

export default mongoose.model('Questionnaire', QuestionnaireSchema);