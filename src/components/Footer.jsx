import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="bg-[rgba(0,58,143,0.95)] text-brand-light py-20 px-6 md:px-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-16">
        
        {/* Left Section: Branding and Socials */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center md:items-start gap-8"
        >
          <div className="flex flex-col items-center md:items-start">
            <h2 className="font-handwriting text-5xl md:text-6xl text-white leading-none">
              Sarah Safaa
            </h2>
            <p className="text-sm font-sans uppercase tracking-wider font-semibold text-brand-light/90 mt-1">
              C-suite English Mentor
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <motion.a 
              whileHover={{ scale: 1.1, y: -2 }} 
              href="https://www.facebook.com/share/1Jww7nszTL/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 flex items-center justify-center text-brand-light hover:text-brand-pink transition-colors"
              aria-label="Facebook"
            >
              <FaFacebook className="w-full h-full" />
            </motion.a>
            <motion.a 
              whileHover={{ scale: 1.1, y: -2 }} 
              href="https://www.instagram.com/sarahsafaa99?igsh=MWR6OW0wYzRqbWR3bA==" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 flex items-center justify-center text-brand-light hover:text-brand-pink transition-colors"
              aria-label="Instagram"
            >
              <FaInstagram className="w-full h-full" />
            </motion.a>
            <motion.a 
              whileHover={{ scale: 1.1, y: -2 }} 
              href="https://www.linkedin.com/in/sarah-safaa-421607409?utm_source=share_via&utm_content=profile&utm_medium=member_android" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 flex items-center justify-center text-brand-light hover:text-brand-pink transition-colors"
              aria-label="LinkedIn"
            >
              <FaLinkedin className="w-full h-full" />
            </motion.a>
          </div>
        </motion.div>

        {/* Center Section: Navigation */}
        <motion.nav 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center gap-4 text-[17px]"
        >
          <Link to="/" className="hover:text-brand-pink transition-colors">Home</Link>
          <Link to="/assessment/register" className="hover:text-brand-pink transition-colors">Registration</Link>
          <a href="/#contact" onClick={() => { navigate('/'); setTimeout(() => { const el = document.getElementById('contact'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 100); }} className="hover:text-brand-pink transition-colors cursor-pointer">Get in Touch</a>
          {localStorage.getItem('token') && (
            <>
              <Link to="/assessment/question" className="hover:text-brand-pink transition-colors">Assessment</Link>
              <button 
                onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); }} 
                className="hover:text-brand-pink transition-colors cursor-pointer text-sm text-brand-pink/90"
              >
                Logout
              </button>
            </>
          )}
          <Link to="/admin/login" className="hover:text-brand-pink transition-colors text-xs opacity-75 mt-1">Admin Login</Link>
        </motion.nav>

        {/* Right Section: Actions */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col gap-6"
        >
          <motion.button 
            onClick={() => {
              const token = localStorage.getItem('token');
              if (token) {
                try {
                  const user = JSON.parse(localStorage.getItem('user') || '{}');
                  if (user?.role === 'ADMIN') {
                    navigate('/admin');
                    return;
                  }
                } catch {
                  // ignore
                }
                navigate('/assessment/question');
              } else {
                navigate('/assessment/register');
              }
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-brand-light text-brand-primary font-medium text-[18px] px-8 py-4 rounded-full shadow-lg cursor-pointer"
          >
            {localStorage.getItem('token') ? 'Go to Assessment' : 'Register Now'}
          </motion.button>
        </motion.div>

      </div>
    </footer>
  );
};

export default Footer;
