import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  schoolName: string;
  standard: string;
  age: string;
  status: string;
  reportPath?: string;
  createdAt?: string;
}

interface SkillScores {
  [key: string]: number;
}

interface QuestionnaireData {
  _id: string;
  userId: string | User;
  studentName: string;
  age: string;
  academicInfo: string;
  interests: string;
  answers: Record<string, any>;
  skillScores?: SkillScores;
  createdAt: string;
  updatedAt: string;
}

interface Subject {
  subjectName: string;
  marks: number;
  totalMarks: number;
  _id: string;
}

interface MarksData {
  _id: string;
  userId: string;
  standard: number;
  subjects: Subject[];
  createdAt: string;
  __v: number;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  schoolName: string;
  standard: string;
  age: string;
  status: string;
}

const StudentTable: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData[]>([]);
  const [marksData, setMarksData] = useState<MarksData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<Record<string, 'traits' | 'answers' | 'marks'>>({});
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

        const studentsResponse = await fetch('https://api.enhc.tech/api/auth/students-test', { headers });
        if (!studentsResponse.ok) throw new Error('Failed to fetch students');
        const studentsData: Student[] = await studentsResponse.json();
        setStudents(studentsData);

        const questionnaireResponse = await fetch('https://api.enhc.tech/api/auth/questionnaire-data', { headers });
        if (questionnaireResponse.ok) setQuestionnaireData(await questionnaireResponse.json());

        const marksResponse = await fetch('https://api.enhc.tech/api/marks/all-marks', { headers });
        if (!marksResponse.ok) throw new Error('Failed to fetch marks');
        setMarksData(await marksResponse.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownload = async (reportPath: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://api.enhc.tech/api/auth/download-report/${reportPath}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to download report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = reportPath || 'report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to download report.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Report Generated': return 'bg-emerald-100 text-emerald-700 ring-emerald-500';
      case 'Analyzing': return 'bg-amber-100 text-amber-700 ring-amber-500';
      case 'Error': return 'bg-rose-100 text-rose-700 ring-rose-500';
      default: return 'bg-gray-100 text-gray-700 ring-gray-500';
    }
  };

  const toggleRowExpansion = (studentId: string) => {
    setExpandedRows(prev => {
      const newState = { ...prev, [studentId]: !prev[studentId] };
      if (newState[studentId] && !activeTab[studentId]) {
        setActiveTab(prevTabs => ({ ...prevTabs, [studentId]: 'traits' }));
      }
      return newState;
    });
  };

  const handleTabChange = (studentId: string, tab: 'traits' | 'answers' | 'marks') => {
    setActiveTab(prev => ({ ...prev, [studentId]: tab }));
  };

  const getQuestionnaireForUser = (userId: string): QuestionnaireData | undefined => {
    return questionnaireData.find(q => 
      (typeof q.userId === 'string' && q.userId === userId) || 
      (typeof q.userId === 'object' && q.userId._id === userId)
    );
  };

  const getMarksForUser = (userId: string): MarksData[] => {
    return marksData.filter(m => m.userId === userId);
  };

  const renderAnswers = (answers: Record<string, any>) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-inner">
      <h4 className="text-lg font-semibold text-indigo-700 mb-4">Questionnaire Answers</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(answers).map(([key, value]) => (
          <div key={key} className="border-b border-gray-200 pb-3">
            <p className="text-sm font-medium text-gray-800">{key}</p>
            <p className="text-sm text-gray-600 mt-1">{Array.isArray(value) ? value.join(', ') : String(value)}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderSkillScores = (skillScores: SkillScores) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-lg">
      <h4 className="text-lg font-semibold text-indigo-700 mb-6">Skill Assessment Scores</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Object.entries(skillScores)
          .sort(([skillA], [skillB]) => skillA.localeCompare(skillB))
          .map(([skill, score]) => (
            <div key={skill} className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <p className="text-sm font-medium text-gray-800">{skill}</p>
              <div className="flex items-center mt-2">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <span className="ml-3 text-sm font-semibold text-indigo-600">{score.toFixed(1)}</span>
              </div>
            </div>
          ))}
      </div>
    </motion.div>
  );

  const renderMarks = (marks: MarksData) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500"
    >
      <h4 className="text-lg font-semibold text-indigo-700 mb-4">Standard {marks.standard}</h4>
      {marks.subjects && marks.subjects.length > 0 ? (
        <ul className="space-y-3">
          {marks.subjects.map((subject) => (
            <li key={subject._id} className="text-sm text-gray-700 flex items-center">
              <span className="font-medium text-gray-800">{subject.subjectName}:</span>
              <span className="ml-2">{subject.marks}/{subject.totalMarks}</span>
              <span className="ml-2 text-indigo-600">({((subject.marks / subject.totalMarks) * 100).toFixed(1)}%)</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-600">No subjects recorded for this standard.</p>
      )}
    </motion.div>
  );

  const sortedStudents = [...students].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center py-4 text-indigo-600 text-lg font-semibold"
        >
          Loading student data...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center py-4 text-rose-600 text-lg font-semibold"
        >
          {error}
        </motion.div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center py-4 text-gray-600 text-lg font-semibold"
        >
          No students found
        </motion.div>
      </div>
    );
  }

  const columnWidths = ["18%", "20%", "18%", "10%", "7%", "10%", "17%"];

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      {/* Sorting Controls */}
      <div className="flex justify-end mb-6">
        <motion.select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          whileHover={{ scale: 1.02 }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </motion.select>
      </div>

      <motion.table 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="min-w-full divide-y divide-gray-200 bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0 z-10">
          <tr>
            {['Name', 'Email', 'School', 'Standard', 'Age', 'Status', 'Actions'].map((header, index) => (
              <th 
                key={header} 
                style={{ width: columnWidths[index] }} 
                className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedStudents.map((student) => {
            const questionnaire = getQuestionnaireForUser(student._id);
            const marksList = getMarksForUser(student._id);
            const isExpanded = expandedRows[student._id] || false;
            const currentTab = activeTab[student._id] || 'traits';
            const hasData = questionnaire || marksList.length > 0;

            return (
              <React.Fragment key={student._id}>
                <motion.tr 
                  className="hover:bg-indigo-50 transition-colors"
                  whileHover={{ scale: 1.01 }}
                >
                  <td className="px-6 py-4 whitespace-nowrap" style={{ width: columnWidths[0] }}>
                    <div className="text-sm font-semibold text-gray-900">{student.firstName} {student.lastName}</div>
                  </td>
                  <td className="px-6 py-4" style={{ width: columnWidths[1] }}>
                    <div className="text-sm text-gray-600 overflow-hidden text-ellipsis">{student.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ width: columnWidths[2] }}>
                    <div className="text-sm text-gray-900 font-medium">{student.schoolName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ width: columnWidths[3] }}>
                    <div className="text-sm text-gray-900">{student.standard}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ width: columnWidths[4] }}>
                    <div className="text-sm text-gray-900">{student.age}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ width: columnWidths[5] }}>
                    <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusColor(student.status)} ring-1 ring-inset`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ width: columnWidths[6] }}>
                    <div className="flex items-center space-x-3">
                      {student.status === 'Report Generated' && student.reportPath && (
                        <motion.button 
                          onClick={() => handleDownload(student.reportPath!)} 
                          className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Download
                        </motion.button>
                      )}
                      {hasData && (
                        <motion.button 
                          onClick={() => toggleRowExpansion(student._id)} 
                          className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-5 w-5 mr-1" /> Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-5 w-5 mr-1" /> View Details
                            </>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </td>
                </motion.tr>
                <AnimatePresence>
                  {isExpanded && hasData && (
                    <motion.tr
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td colSpan={7} className="px-6 py-6 bg-gray-50">
                        <div className="border rounded-xl p-6 bg-white shadow-lg">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {questionnaire && (
                              <>
                                <div><h4 className="text-sm font-medium text-gray-500">Student Name</h4><p className="text-sm text-gray-900">{questionnaire.studentName}</p></div>
                                <div><h4 className="text-sm font-medium text-gray-500">Age</h4><p className="text-sm text-gray-900">{questionnaire.age}</p></div>
                                <div><h4 className="text-sm font-medium text-gray-500">Academic Info</h4><p className="text-sm text-gray-900">{questionnaire.academicInfo}</p></div>
                                <div><h4 className="text-sm font-medium text-gray-500">Interests</h4><p className="text-sm text-gray-900">{questionnaire.interests}</p></div>
                                <div><h4 className="text-sm font-medium text-gray-500">Submission Date</h4><p className="text-sm text-gray-900">{new Date(questionnaire.createdAt).toLocaleDateString()}</p></div>
                              </>
                            )}
                          </div>
                          <div className="border-b border-gray-200 mb-6">
                            <nav className="flex space-x-4" aria-label="Tabs">
                              {questionnaire && questionnaire.skillScores && (
                                <motion.button
                                  onClick={() => handleTabChange(student._id, 'traits')}
                                  className={`px-4 py-2 font-semibold text-sm rounded-lg ${currentTab === 'traits' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-indigo-600 bg-gray-100'}`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  Trait Scores
                                </motion.button>
                              )}
                              {questionnaire && (
                                <motion.button
                                  onClick={() => handleTabChange(student._id, 'answers')}
                                  className={`px-4 py-2 font-semibold text-sm rounded-lg ${currentTab === 'answers' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-indigo-600 bg-gray-100'}`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  Question Answers
                                </motion.button>
                              )}
                              {marksList.length > 0 && (
                                <motion.button
                                  onClick={() => handleTabChange(student._id, 'marks')}
                                  className={`px-4 py-2 font-semibold text-sm rounded-lg flex items-center ${currentTab === 'marks' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-indigo-600 bg-gray-100'}`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <BookOpen className="h-5 w-5 mr-2" />
                                  Academic Marks ({marksList.length})
                                </motion.button>
                              )}
                            </nav>
                          </div>
                          {currentTab === 'traits' && questionnaire && questionnaire.skillScores && renderSkillScores(questionnaire.skillScores)}
                          {currentTab === 'answers' && questionnaire && renderAnswers(questionnaire.answers)}
                          {currentTab === 'marks' && marksList.length > 0 && (
                            <div className="space-y-6">
                              {marksList
                                .sort((a, b) => a.standard - b.standard)
                                .map((mark) => renderMarks(mark))}
                            </div>
                          )}
                          {currentTab === 'marks' && marksList.length === 0 && (
                            <div className="bg-gray-50 p-6 rounded-xl">
                              <p className="text-sm text-gray-600">No marks recorded for this student.</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </tbody>
      </motion.table>
    </div>
  );
};

export default StudentTable;