import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <section className="relative w-full min-h-[440px] md:h-[500px] flex flex-col items-center justify-center pt-28 pb-32 md:py-0">
      {/* Background with overlay */}
      <div className="absolute inset-0 overflow-hidden bg-brand-light bg-gradient-to-b from-[#b1c3d6] to-[#e4e9f0]">
        <div className="absolute inset-0 bg-hero-gradient" />
      </div>

      {/* Floating Header Pill */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 px-4 sm:px-8 py-2.5 sm:py-3 rounded-full backdrop-blur-md bg-white/10 flex flex-col sm:flex-row items-center border border-white/20 w-[92%] max-w-5xl justify-between gap-3 sm:gap-0 z-30"
      >
        <Link to="/" className="flex flex-col items-center shrink-0">
          <span className="font-handwriting text-3xl sm:text-4xl md:text-5xl text-white font-normal leading-none tracking-wide">
            Sarah Safaa
          </span>
          <span className="text-brand-light text-[10px] sm:text-xs font-sans tracking-wider uppercase mt-0.5 font-semibold">
            C-suite English Mentor
          </span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-8 text-xs sm:text-base md:text-lg text-brand-light font-medium flex-wrap justify-center">
          <Link to="/" className="font-sans hover:text-brand-pink transition-colors">Home</Link>
          {!localStorage.getItem('token') ? (
            <Link to="/assessment/register" className="font-sans hover:text-brand-pink transition-colors">Register</Link>
          ) : (
            <>
              <Link to="/assessment/question" className="font-sans hover:text-brand-pink transition-colors">Assessment</Link>
              <button 
                onClick={handleLogout}
                className="font-sans font-bold bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors cursor-pointer text-xs sm:text-sm"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Main Title */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 flex flex-col items-center px-4"
      >
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-medium text-brand-light text-center leading-tight">
          C-Suite Assessment
        </h1>
      </motion.div>

      {/* Overlapping Welcome Card */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="absolute -bottom-24 w-[92%] sm:w-11/12 max-w-5xl bg-white rounded-2xl shadow-[0px_0px_10px_0px_rgba(0,58,143,0.15)] p-6 sm:p-10 md:p-14 text-center z-20"
      >
        <h2 className="text-xl sm:text-2xl md:text-[32px] font-medium text-brand-primary leading-snug mb-3 sm:mb-4">
          Welcome to your <br className="hidden md:block" /> C-Suite English Communication Assessment
        </h2>
        <p className="text-sm sm:text-base md:text-[18px] font-medium text-brand-primary/80 max-w-3xl mx-auto leading-relaxed">
          Evaluate how effectively you communicate in high-stakes business environments and discover where your English stands today.
        </p>
      </motion.div>
    </section>
  );
};

export default HeroSection;
