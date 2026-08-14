import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaCheckCircle, FaEnvelope, FaPhone, FaBuilding, FaUser, FaCommentDots } from 'react-icons/fa';
import { submitContactMessage } from '../api';

const GetInTouchSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: 'Executive Mentorship Inquiry',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in your Name, Email, and Message.');
      return;
    }

    setLoading(true);
    try {
      await submitContactMessage(formData);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: 'Executive Mentorship Inquiry',
        message: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 px-4 sm:px-6 md:px-12 bg-white relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-pink/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-4 py-1.5 rounded-full inline-block mb-3 font-sans">
            Direct Communication
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-sans font-bold text-slate-900 tracking-tight">
            Get in Touch
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Have questions about executive diagnostic assessments, personalized 1-on-1 mentorship, or bespoke corporate communication coaching? Send a message directly to Sarah Safaa’s executive desk.
          </p>
        </div>

        {/* Contact Form Container */}
        <div className="bg-[#f8fafc] border border-slate-200/90 rounded-3xl p-6 sm:p-10 md:p-14 shadow-sm">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center py-10"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-6 border border-green-200 shadow-sm">
                  <FaCheckCircle size={40} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Message Received!</h3>
                <p className="text-slate-600 text-sm sm:text-base max-w-md mb-8 leading-relaxed">
                  Thank you for reaching out. Your inquiry has been forwarded to Sarah Safaa’s executive mentorship team. We will get back to you promptly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-8 py-3 bg-brand-primary text-white font-medium rounded-full hover:bg-opacity-95 transition-all text-sm cursor-pointer shadow-md"
                >
                  Send Another Inquiry
                </button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-6"
              >
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs sm:text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <FaUser size={12} className="text-brand-primary" />
                      <span>Full Name *</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-slate-800 text-sm transition-all bg-white"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <FaEnvelope size={12} className="text-brand-primary" />
                      <span>Professional Email *</span>
                    </label>
                    <input 
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-slate-800 text-sm transition-all bg-white"
                    />
                  </div>

                  {/* WhatsApp / Phone */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <FaPhone size={12} className="text-brand-primary" />
                      <span>WhatsApp / Phone</span>
                    </label>
                    <input 
                      type="tel"
                      placeholder="+971 50 123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-slate-800 text-sm transition-all bg-white"
                    />
                  </div>

                  {/* Company */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <FaBuilding size={12} className="text-brand-primary" />
                      <span>Company / Organization</span>
                    </label>
                    <input 
                      type="text"
                      placeholder="Company Name"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-slate-800 text-sm transition-all bg-white"
                    />
                  </div>

                </div>

                {/* Subject */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-800">
                    Subject / Topic of Interest
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-slate-800 text-sm transition-all bg-white cursor-pointer"
                  >
                    <option value="Executive Mentorship Inquiry">Executive 1-on-1 Mentorship</option>
                    <option value="Corporate Executive Training">Corporate Team & Board Training</option>
                    <option value="C-Suite Diagnostic Inquiry">C-Suite English Assessment Inquiry</option>
                    <option value="Keynote & Workshop Speaking">Keynote Speaking & Masterclasses</option>
                    <option value="General Question">General Inquiry</option>
                  </select>
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <FaCommentDots size={12} className="text-brand-primary" />
                    <span>Your Message *</span>
                  </label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="Describe your executive communication goals, team needs, or inquiries..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-4 rounded-xl border border-slate-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-slate-800 text-sm transition-all bg-white resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-10 py-4 bg-brand-primary text-white font-bold rounded-full hover:bg-[#002d72] transition-all shadow-md flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer disabled:bg-slate-400"
                  >
                    <FaPaperPlane size={14} />
                    <span>{loading ? 'Sending Message...' : 'Submit Message →'}</span>
                  </button>
                </div>

              </motion.form>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default GetInTouchSection;
