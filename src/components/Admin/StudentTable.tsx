import React, { useState, useEffect } from 'react';

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
}

const StudentTable: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Fetching from: https://api.enhc.tech/api/auth/students-test');
        const response = await fetch('https://api.enhc.tech/api/auth/students-test', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          const text = await response.text();
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || `HTTP error ${response.status}`);
          } catch {
            throw new Error(text || `HTTP error ${response.status}`);
          }
        }

        const data: Student[] = await response.json();
        setStudents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleDownload = async (reportPath: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }
      const backendUrl = `https://api.enhc.tech/api/auth/download-report/${reportPath}`;
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

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
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Report Generated':
        return 'bg-green-100 text-green-800';
      case 'Analyzing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-4 text-gray-600">Loading student data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-4 text-red-600">{error}</div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-4 text-gray-600">No students found</div>
      </div>
    );
  }

  // Define the column widths consistently for both header and content
  const columnWidths = [
    "20%",  // Name
    "22%",  // Email (wider to prevent text overlap)
    "20%",  // School
    "10%",  // Standard
    "8%",   // Age
    "10%",  // Status
    "10%"   // Actions
  ];

  return (
    <div className="flex-1 overflow-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {['Name', 'Email', 'School', 'Standard', 'Age', 'Status', 'Actions'].map(
              (header, index) => (
                <th
                  key={header}
                  style={{ width: columnWidths[index] }}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((student) => (
            <tr
              key={student._id}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap" style={{ width: columnWidths[0] }}>
                <div className="text-sm font-medium text-gray-900">
                  {student.firstName} {student.lastName}
                </div>
              </td>
              <td className="px-6 py-4" style={{ width: columnWidths[1] }}>
                <div className="text-sm text-gray-500 overflow-hidden text-ellipsis">
                  {student.email}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap" style={{ width: columnWidths[2] }}>
                <div className="text-sm text-gray-900">{student.schoolName}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap" style={{ width: columnWidths[3] }}>
                <div className="text-sm text-gray-900">{student.standard}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap" style={{ width: columnWidths[4] }}>
                <div className="text-sm text-gray-900">{student.age}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap" style={{ width: columnWidths[5] }}>
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                    student.status
                  )}`}
                >
                  {student.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ width: columnWidths[6] }}>
                {student.status === 'Report Generated' && student.reportPath && (
                  <button
                    onClick={() => handleDownload(student.reportPath!)}
                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                  >
                    Download
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;