import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, CheckCircle, AlertCircle, Menu, X, LogOut } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState('Pending');
  const [reportPath, setReportPath] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      const backendUrl = `http://localhost:3001/api/download-report/${reportPath}`;

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
      a.download = reportPath;
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden" style={{ width: '100vw', height: '100vh' }}>
      {/* Enhanced responsive navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate max-w-[200px] sm:max-w-full">
                Career Guidance Platform
              </h1>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100"
                aria-expanded="false"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden sm:flex items-center">
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-200 py-2 px-4 shadow-lg">
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center text-left px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        )}
      </nav>

      <main className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6 sm:px-6 lg:px-8 overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="sm:px-0">
          {/* Enhanced Welcome Header */}
          <div className="relative bg-gradient-to-r from-indigo-600 to-indigo-900 shadow-xl rounded-xl overflow-hidden mb-6">
            <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-10" />
            <div className="relative p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
                    Welcome, {user?.firstName || 'User'} {user?.lastName || ''}
                  </h2>
                  <p className="text-sm md:text-base text-indigo-200">Track your career assessment progress</p>
                </div>
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-lg transition-all duration-300 transform hover:scale-105 ${
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
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        <span className="whitespace-nowrap">Report Ready</span>
                      </>
                    ) : status === 'Analyzing' ? (
                      <>
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        <span className="whitespace-nowrap">Analyzing Results</span>
                      </>
                    ) : status === 'Error' ? (
                      <>
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        <span className="whitespace-nowrap">Processing Failed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        <span className="whitespace-nowrap">{status}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="bg-white shadow-xl rounded-xl overflow-hidden p-5 sm:p-8">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Assessment Status</h3>
            </div>

            <div className="space-y-5 sm:space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm md:text-base font-medium text-gray-600">Current Status</p>
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
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
                <div className="h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      status === 'Pending'
                        ? 'w-1/4 bg-gray-400'
                        : status === 'Analyzing'
                        ? 'w-1/2 bg-yellow-500'
                        : status === 'Report Generated'
                        ? 'w-full bg-green-500'
                        : 'w-3/4 bg-red-500'
                    }`}
                  />
                </div>
              </div>

              {reportPath && isReportAvailable && (
                <button
                  onClick={handleDownload}
                  className="w-full inline-flex items-center justify-center px-4 py-3 sm:py-4 text-sm sm:text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Download className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                  Download Career Report
                </button>
              )}

              <div className="bg-indigo-50 rounded-xl p-4 sm:p-6">
                <h4 className="text-base md:text-lg font-semibold text-indigo-900 mb-3 sm:mb-4">Next Steps</h4>
                <ul className="space-y-3 sm:space-y-4">
                  {!isReportAvailable && (
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-indigo-200 flex items-center justify-center mt-0.5">
                        <span className="text-indigo-600 text-xs sm:text-sm font-medium">1</span>
                      </div>
                      <p className="ml-3 text-sm md:text-base text-indigo-800">
                        {status === 'Error'
                          ? 'There was an issue processing your report. Please contact support.'
                          : 'Your assessment is being processed. Please wait.'}
                      </p>
                    </li>
                  )}
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-indigo-200 flex items-center justify-center mt-0.5">
                      <span className="text-indigo-600 text-xs sm:text-sm font-medium">
                        {isReportAvailable ? '1' : '2'}
                      </span>
                    </div>
                    <p className="ml-3 text-sm md:text-base text-indigo-800">
                      {isReportAvailable
                        ? 'Download your career assessment report using the button above'
                        : 'Once your report is ready, you can download it from this dashboard'}
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-indigo-200 flex items-center justify-center mt-0.5">
                      <span className="text-indigo-600 text-xs sm:text-sm font-medium">
                        {isReportAvailable ? '2' : '3'}
                      </span>
                    </div>
                    <p className="ml-3 text-sm md:text-base text-indigo-800">
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