import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const Admin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    console.log('🔄 Admin component mounted, checking auth...');
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔐 Checking authentication status...');
      
      if (apiService.isAuthenticated()) {
        console.log('📝 Token found, verifying...');
        const result = await apiService.verifyToken();
        console.log('🔑 Verification result:', result);
        
        if (result.valid) {
          console.log('✅ Token is valid');
          setIsAuthenticated(true);
        } else {
          console.log('❌ Token is invalid');
          await apiService.logout();
          setIsAuthenticated(false);
        }
      } else {
        console.log('🚫 No token found');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('🚨 Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting login...');
      const result = await apiService.login(username, password);
      if (result.token) {
        console.log('✅ Login successful');
        setIsAuthenticated(true);
        setError('');
      }
    } catch (err) {
      console.error('❌ Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...');
      await apiService.logout();
      setIsAuthenticated(false);
      setUsername('');
      setPassword('');
      setError('');
      console.log('✅ Logout successful');
    } catch (err) {
      console.error('❌ Logout failed:', err);
      setIsAuthenticated(false);
      setUsername('');
      setPassword('');
    }
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center max-w-md">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Checking Authentication</h2>
          <p className="text-gray-600 mb-4">Verifying your admin session...</p>
          <div className="text-sm text-gray-600 px-4 py-2 rounded-lg inline-block">
            Airen Pharmacy Admin Portal
          </div>
        </div>
      </div>
    );
  }

  // Success state after login
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-10 text-center">
            <div className="w-24 h-24 bg-white bg-opacity-60 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Admin Access Granted</h1>
            <p className="text-blue-600 text-lg">Welcome to Airen Pharmacy Admin Portal</p>
          </div>

          {/* Content */}
          <div className="p-10">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M7 11V8a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Full Administrative Access</h2>
              <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto text-lg">You now have complete access to manage Airen Pharmacy operations, inventory, sales, and system configurations.</p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-black mr-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M21 12v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 12V7a5 5 0 0110 0v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-blue-800 text-lg">Sales & Revenue</h3>
                    <p className="text-gray-600 text-sm mt-1">Access financial reports, profit margins, and revenue analytics</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-black mr-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M21 16V8a2 2 0 00-1-1.73L13 3a2 2 0 00-2 0L4 6.27A2 2 0 003 8v8a2 2 0 001 1.73L11 21a2 2 0 002 0l7-3.27A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-blue-800 text-lg">Inventory Management</h3>
                    <p className="text-gray-600 text-sm mt-1">Configure products, pricing, stock levels, and suppliers</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-black mr-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 17V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18 17V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 17v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-blue-800 text-lg">Business Reports</h3>
                    <p className="text-gray-600 text-sm mt-1">Generate detailed reports and business intelligence insights</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-black mr-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M12 15.5A3.5 3.5 0 1012 8.5a3.5 3.5 0 000 7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06A2 2 0 013.3 18.9l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09c.67 0 1.28-.26 1.51-1a1.65 1.65 0 00-.33-1.82L4.21 7.7a2 2 0 112.83-2.83l.06.06c.45.45 1.12.6 1.71.36.59-.24 1.01-.78 1.01-1.45V3a2 2 0 114 0v.09c0 .67.42 1.21 1.01 1.45.59.24 1.26.09 1.71-.36l.06-.06A2 2 0 1120.7 6.3l-.06.06c-.45.45-.6 1.12-.36 1.71.24.59.78 1.01 1.45 1.01H21a2 2 0 110 4h-.09c-.67 0-1.28.26-1.51 1-.24.59-.09 1.26.36 1.71l.06.06A2 2 0 0119.4 15z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-blue-800 text-lg">System Settings</h3>
                    <p className="text-gray-600 text-sm mt-1">Manage users, permissions, store settings, and configurations</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-semibold hover:bg-black transition-all flex items-center justify-center space-x-3 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M3 3h18v4H3zM3 11h18v10H3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="w-2 h-2 bg-blue-500 rounded-full self-center" />
                <span className="text-lg">Go to Dashboard</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 py-4 rounded-xl font-semibold hover:from-gray-200 hover:to-gray-300 transition-all flex items-center justify-center space-x-3 border border-gray-300 shadow-sm"
              >
                <span className="text-xl">🚪</span>
                <span className="text-lg">Logout</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-10 py-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-transparent">
                  <span className="font-bold text-gray-900">AP</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Airen Pharmacy Admin</p>
                  <p className="text-xs text-blue-600">v1.0.0 • Secure Access</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-blue-600">
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 2l7 4v5c0 5-3.5 9.7-7 11-3.5-1.3-7-6-7-11V6l7-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm font-medium text-blue-600">Secure Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-400 p-10 text-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <span className="text-3xl text-white">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Admin Authentication</h1>
          <p className="text-blue-100">Airen Pharmacy Management Portal</p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          {error && (
            <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start">
                <span className="text-red-500 text-xl mr-4">⚠️</span>
                <div>
                  <p className="text-red-700 font-semibold text-sm mb-1">Authentication Required</p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-3">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
                placeholder="Enter admin username"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg">Authenticating...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">🔑</span>
                  <span className="text-lg">Sign In to Admin Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-10 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-start space-x-4">
              <span className="text-blue-500 text-2xl mt-1">🛡️</span>
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-2">Security Notice</p>
                <p className="text-sm text-blue-700 leading-relaxed">
                  This portal provides access to sensitive store operations and configurations. 
                  Ensure you are authorized and maintain the confidentiality of your credentials.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-t border-blue-200">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent">
                <span className="font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">AP</span>
              </div>
              <p className="text-sm font-medium text-gray-700">
                Airen Pharmacy System
              </p>
            </div>
            <div className="flex items-center space-x-2 text-blue-600">
              <span className="text-lg">🔒</span>
              <span className="text-xs font-medium">Secure Connection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;