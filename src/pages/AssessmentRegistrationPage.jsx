import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { register } from '../api';

const AssessmentRegistrationPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationReasons, setValidationReasons] = useState([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user?.role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/assessment/question', { replace: true });
        }
      } catch {
        navigate('/assessment/question', { replace: true });
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');

    const formData = new FormData(e.target);
    const name = formData.get('name')?.trim() || '';
    const email = formData.get('email')?.trim() || '';
    const phone = formData.get('phone')?.trim() || '';
    const age = formData.get('age')?.trim() || '';
    const country = formData.get('country') || '';
    const job_title = formData.get('job_title')?.trim() || '';
    const company = formData.get('company')?.trim() || '';
    const linkedin = formData.get('linkedin')?.trim() || '';

    // Validation checks
    const reasons = [];

    if (!name || name.length < 2) {
      reasons.push('Full Name is required (minimum 2 characters).');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      reasons.push('A valid Email address is required (e.g. name@example.com).');
      setEmailError('Please enter a valid email address');
    }

    if (!phone || phone.length < 6) {
      reasons.push('WhatsApp / Phone number is required.');
    }

    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 15 || ageNum > 100) {
      reasons.push('Please provide a valid Age between 15 and 100.');
    }

    if (!country) {
      reasons.push('Please select your Country.');
    }

    if (!job_title || job_title.length < 2) {
      reasons.push('Job title / Role is required.');
    }

    // If any validation failed, trigger the popup modal and DO NOT start the assessment
    if (reasons.length > 0) {
      setValidationReasons(reasons);
      setShowValidationModal(true);
      return;
    }

    setLoading(true);

    const formattedLinkedin = linkedin ? (linkedin.startsWith('http') ? linkedin : `https://${linkedin}`) : '';

    const candidateData = {
      name,
      email,
      phone,
      age,
      country,
      job_title,
      company,
      linkedin: formattedLinkedin
    };

    try {
      const data = await register(candidateData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/assessment/question');
    } catch (err) {
      const msg = err.message || 'Registration failed. Please check your information.';
      if (msg.toLowerCase().includes('email')) {
        setEmailError(msg);
      }
      setValidationReasons([msg]);
      setShowValidationModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative w-full pt-28 pb-16 md:pt-32 md:pb-24 bg-cover bg-center px-3 sm:px-6"
      style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.85)), url('/london_background.jpg')" }}
    >
      {/* Floating Header */}
      <div className="absolute top-4 md:top-[28px] left-1/2 -translate-x-1/2 backdrop-blur-[5px] bg-[rgba(255,255,255,0.25)] flex justify-between items-center px-4 sm:px-6 md:px-[28px] py-2.5 sm:py-3 md:py-[14px] rounded-[50px] w-[94%] max-w-[1248px] z-10 shadow-sm border border-white/30">
        <Link to="/" className="flex flex-col items-center shrink-0">
          <span className="font-handwriting text-brand-primary leading-none text-3xl sm:text-4xl md:text-5xl font-normal tracking-wide">
            Sarah Safaa
          </span>
          <span className="font-sans leading-[normal] text-brand-primary text-[9px] sm:text-[10px] text-center font-bold tracking-wider uppercase mt-0.5">
            C-suite English Mentor
          </span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6 md:gap-[32px] text-sm sm:text-base md:text-[18px] text-brand-primary font-medium">
          <Link to="/" className="font-sans hover:text-brand-pink transition-colors">Home</Link>
          <Link to="/assessment/question" className="font-sans hover:text-brand-pink transition-colors">Assessment</Link>
        </div>
      </div>

      {/* Validation Incomplete Popup Modal */}
      <AnimatePresence>
        {showValidationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl border border-red-100 max-w-lg w-full p-5 sm:p-6 md:p-8 relative overflow-hidden mx-4"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <FaExclamationTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Registration Incomplete</h3>
                    <p className="text-xs text-slate-500">Please provide all required details to proceed</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowValidationModal(false)}
                  className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              <div className="bg-red-50/70 rounded-2xl p-4 border border-red-100/80 mb-6">
                <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Required Corrections:</p>
                <ul className="space-y-1.5">
                  {validationReasons.map((reason, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-red-700 flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setShowValidationModal(false)}
                className="w-full h-11 sm:h-12 bg-[#003a8f] text-white font-semibold rounded-2xl hover:bg-opacity-95 transition-all shadow-md cursor-pointer text-sm sm:text-base"
              >
                Got It, Complete Information
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Card */}
      <div className="bg-[rgba(250,248,246,0.96)] backdrop-blur-md rounded-[24px] sm:rounded-[32px] shadow-2xl p-5 sm:p-8 md:p-12 w-[94%] max-w-[1248px] relative z-10 mx-auto flex flex-col items-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-sans font-medium text-brand-primary text-2xl sm:text-3xl md:text-[40px] text-center mb-6 sm:mb-8 md:mb-10"
        >
          Personal Information
        </motion.h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-6 text-sm text-center w-full max-w-[600px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 sm:gap-6 md:gap-[32px] items-center w-full max-w-[1200px]">
          
          {/* Row 1: Name & Email */}
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-[24px] w-full items-start">
            <div className="w-full">
              <input 
                type="text" 
                name="name" 
                placeholder="Full name*" 
                required 
                className="bg-white border border-brand-primary h-[50px] md:h-[56px] rounded-[100px] shadow-[0px_0px_2px_0px_#6e1f32] w-full px-5 md:px-[32px] font-sans text-sm md:text-[16px] text-brand-primary placeholder:text-[rgba(0,58,143,0.4)] focus:outline-none focus:ring-2 focus:ring-brand-pink transition-all" 
              />
            </div>
            <div className="w-full flex flex-col">
              <input 
                type="email" 
                name="email" 
                placeholder="Email*" 
                required 
                onChange={() => { if (emailError) setEmailError(''); }}
                className={`bg-white border h-[50px] md:h-[56px] rounded-[100px] w-full px-5 md:px-[32px] font-sans text-sm md:text-[16px] placeholder:text-[rgba(0,58,143,0.4)] focus:outline-none focus:ring-2 transition-all ${
                  emailError 
                    ? 'border-red-500 text-red-700 ring-2 ring-red-100 shadow-[0px_0px_4px_0px_#ef4444]' 
                    : 'border-brand-primary text-brand-primary shadow-[0px_0px_2px_0px_#6e1f32] focus:ring-brand-pink'
                }`}
              />
              {emailError && (
                <span className="text-red-500 text-xs font-semibold mt-1.5 ml-4 flex items-center gap-1">
                  • {emailError}
                </span>
              )}
            </div>
          </div>

          {/* Row 2: WhatsApp & Age */}
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-[24px] w-full">
            <input 
              type="tel" 
              name="phone"
              placeholder="WhatsApp number*" 
              required 
              className="bg-white border border-brand-primary h-[50px] md:h-[56px] rounded-[100px] shadow-[0px_0px_2px_0px_#6e1f32] w-full px-5 md:px-[32px] font-sans text-sm md:text-[16px] text-brand-primary placeholder:text-[rgba(0,58,143,0.4)] focus:outline-none focus:ring-2 focus:ring-brand-pink transition-all" 
            />
            <input 
              type="number" 
              name="age"
              placeholder="Age*" 
              required 
              min="15"
              max="100"
              className="bg-white border border-brand-primary h-[50px] md:h-[56px] rounded-[100px] shadow-[0px_0px_2px_0px_#6e1f32] w-full px-5 md:px-[32px] font-sans text-sm md:text-[16px] text-brand-primary placeholder:text-[rgba(0,58,143,0.4)] focus:outline-none focus:ring-2 focus:ring-brand-pink transition-all" 
            />
          </div>

          {/* Row 3: Country & Role */}
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-[24px] w-full">
            <div className="relative w-full">
              <select 
                name="country"
                defaultValue="" 
                required 
                className="bg-white border border-brand-primary h-[50px] md:h-[56px] rounded-[100px] shadow-[0px_0px_2px_0px_#6e1f32] w-full px-5 md:px-[32px] font-sans text-sm md:text-[16px] text-brand-primary appearance-none focus:outline-none focus:ring-2 focus:ring-brand-pink transition-all bg-transparent relative z-10 cursor-pointer"
              >
                <option value="" disabled className="text-[rgba(0,58,143,0.4)]">Country*</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Qatar">Qatar</option>
                <option value="Kuwait">Kuwait</option>
                <option value="Egypt">Egypt</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Canada">Canada</option>
                <option value="Other">Other</option>
              </select>
              <div className="absolute right-[24px] top-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-60 text-brand-primary">
                <FaChevronDown size={18} />
              </div>
            </div>
            <input 
              type="text" 
              name="job_title"
              placeholder="Job title / Role*" 
              required 
              className="bg-white border border-brand-primary h-[50px] md:h-[56px] rounded-[100px] shadow-[0px_0px_2px_0px_#6e1f32] w-full px-5 md:px-[32px] font-sans text-sm md:text-[16px] text-brand-primary placeholder:text-[rgba(0,58,143,0.4)] focus:outline-none focus:ring-2 focus:ring-brand-pink transition-all" 
            />
          </div>

          {/* Row 4: Company & LinkedIn */}
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-[24px] w-full">
            <input 
              type="text" 
              name="company"
              placeholder="Company" 
              className="bg-white border border-brand-primary h-[50px] md:h-[56px] rounded-[100px] shadow-[0px_0px_2px_0px_#6e1f32] w-full px-5 md:px-[32px] font-sans text-sm md:text-[16px] text-brand-primary placeholder:text-[rgba(0,58,143,0.4)] focus:outline-none focus:ring-2 focus:ring-brand-pink transition-all" 
            />
            <input 
              type="url" 
              name="linkedin"
              placeholder="LinkedIn Profile link" 
              className="bg-white border border-brand-primary h-[50px] md:h-[56px] rounded-[100px] shadow-[0px_0px_2px_0px_#6e1f32] w-full px-5 md:px-[32px] font-sans text-sm md:text-[16px] text-brand-primary placeholder:text-[rgba(0,58,143,0.4)] focus:outline-none focus:ring-2 focus:ring-brand-pink transition-all" 
            />
          </div>

          {/* Submit Button */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`text-brand-light font-sans font-medium text-base md:text-[18px] h-[50px] md:h-[56px] px-8 md:px-[56px] rounded-[100px] mt-4 sm:mt-6 shadow-lg transition-all cursor-pointer w-full sm:w-auto ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-primary hover:bg-opacity-90'}`}
          >
            {loading ? 'Starting Assessment...' : 'Start Assessment →'}
          </motion.button>

        </form>
      </div>
    </div>
  );
};

export default AssessmentRegistrationPage;
