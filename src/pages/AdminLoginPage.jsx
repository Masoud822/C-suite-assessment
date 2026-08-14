import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserShield, FaLock, FaUser, FaExclamationCircle } from 'react-icons/fa';
import { adminLogin } from '../api';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user?.role === 'ADMIN') {
          navigate('/admin', { replace: true });
        }
      } catch {
        // ignore
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setLoading(true);

    try {
      const data = await adminLogin(email, password);
      if (data.user?.role !== 'ADMIN') {
        throw new Error('Access denied: Admin credentials required.');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/admin');
    } catch (err) {
      const errMsg = err.message || 'Invalid credentials';
      if (errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('email')) {
        setEmailError(errMsg);
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative w-full px-6 py-16 bg-cover bg-center"
      style={{ backgroundImage: "linear-gradient(rgba(240, 244, 248, 0.85), rgba(240, 244, 248, 0.95)), url('/london_background.jpg')" }}
    >
      {/* Top Brand Link */}
      <div className="mb-8 text-center">
        <Link to="/" className="inline-block flex flex-col items-center">
          <span className="font-handwriting text-4xl md:text-5xl text-brand-primary font-normal leading-none tracking-wide">
            Sarah Safaa
          </span>
          <span className="font-sans text-[11px] uppercase tracking-widest text-brand-primary/80 font-bold mt-1">
            C-Suite English Mentor
          </span>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
            <FaUserShield size={32} />
          </div>
          <h1 className="text-2xl font-sans font-bold text-gray-900">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">Authorized administrative access only</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl mb-5 text-xs text-center flex items-center justify-center gap-2">
            <FaExclamationCircle className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Username / Admin Email</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <FaUser />
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                placeholder="admin"
                required
                className={`w-full h-12 pl-11 pr-4 rounded-xl border outline-none text-gray-800 transition-all ${
                  emailError 
                    ? 'border-red-500 ring-2 ring-red-100 focus:border-red-500' 
                    : 'border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                }`}
              />
            </div>
            {emailError && (
              <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                <FaExclamationCircle size={12} />
                <span>{emailError}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <FaLock />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••••••"
                required
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-gray-800 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-brand-primary text-white font-semibold rounded-xl hover:bg-opacity-95 transition-all shadow-md mt-2 disabled:bg-gray-400 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
          <Link to="/" className="text-brand-primary font-medium hover:underline">← Return to Homepage</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
