import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, CheckCircle, AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState('Pending');
  const [reportPath, setReportPath] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/questionnaire/report-status', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch status');

        const data = await response.json();
        setStatus(data.status);
        setReportPath(data.reportPath);
      } catch (error) {
        console.error('Error checking report status:', error);
        setStatus('Error');
      }
    };

    fetchReportStatus();
  }, []);

  const handleDownload = async () => {
    if (!reportPath) {
      alert('No report available to download.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const backendUrl = `https://p.enhc.tech/api/download-report/${reportPath}`;

      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to download report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = reportPath; // Use the reportPath as the filename
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  const isReportAvailable = status === 'Report Generated';

  return (
    <div className="min-h-screen bg-gray-100" style={{ height: '100vh', width: '100vw' }}>
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Career Guidance Platform</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="ml-4 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="relative bg-gradient-to-r from-indigo-600 to-indigo-900 shadow-xl rounded-2xl overflow-hidden mb-8">
            <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-10" />
            <div className="relative p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Welcome, {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-indigo-200">Track your career assessment progress</p>
                </div>
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all duration-300 transform hover:scale-105 ${
                      isReportAvailable
                        ? 'bg-green-500 text-white'
                        : status === 'Analyzing'
                        ? 'bg-yellow-500 text-white'
                        : status === 'Error'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {isReportAvailable ? (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Report Ready
                      </>
                    ) : status === 'Analyzing' ? (
                      <>
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Analyzing Results
                      </>
                    ) : status === 'Error' ? (
                      <>
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Processing Failed
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 mr-2" />
                        {status}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-2xl overflow-hidden p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Assessment Status</h3>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Current Status</p>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      status === 'Analyzing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : status === 'Report Generated'
                        ? 'bg-green-100 text-green-800'
                        : status === 'Error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-8">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      status === 'Pending'
                        ? 'w-1/4 bg-gray-400'
                        : status === 'Analyzing'
                        ? 'w-1/2 bg-yellow-500'
                        : status === 'Report Generated'
                        ? 'w-full bg-green-500'
                        : 'w-3/4 bg-red-500' // Error case
                    }`}
                  />
                </div>
              </div>

              {reportPath && isReportAvailable && (
                <button
                  onClick={handleDownload}
                  className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Download className="h-6 w-6 mr-2" />
                  Download Career Report
                </button>
              )}

              <div className="bg-indigo-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-indigo-900 mb-2">Next Steps</h4>
                <ul className="space-y-3">
                  {!isReportAvailable && (
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-200 flex items-center justify-center">
                        <span className="text-indigo-600 text-sm font-medium">1</span>
                      </div>
                      <p className="ml-3 text-sm text-indigo-800">
                        {status === 'Error'
                          ? 'There was an issue processing your report. Please contact support.'
                          : 'Your assessment is being processed. Please wait.'}
                      </p>
                    </li>
                  )}
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-200 flex items-center justify-center">
                      <span className="text-indigo-600 text-sm font-medium">
                        {isReportAvailable ? '1' : '2'}
                      </span>
                    </div>
                    <p className="ml-3 text-sm text-indigo-800">
                      {isReportAvailable
                        ? 'Download your career assessment report using the button above'
                        : 'Once your report is ready, you can download it from this dashboard'}
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-200 flex items-center justify-center">
                      <span className="text-indigo-600 text-sm font-medium">
                        {isReportAvailable ? '2' : '3'}
                      </span>
                    </div>
                    <p className="ml-3 text-sm text-indigo-800">
                      Schedule a consultation with a career counselor for personalized guidance
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;