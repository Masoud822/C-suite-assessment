import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaCheckCircle, FaClock, FaShieldAlt, FaArrowRight, FaLinkedin, FaTimes } from 'react-icons/fa';
import { startAssessment, getCurrentAssessment, submitAnswer, logInfraction, bookSpeakingAssessment } from '../api';
import { CEFR_LEARNING_PATHS } from '../data/learningPaths';

const AssessmentQuestionPage = () => {
  const navigate = useNavigate();
  
  const [assessmentId, setAssessmentId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(30);
  const [categories, setCategories] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState(null);
  
  // Phase management
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showCategoryIntro, setShowCategoryIntro] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cheatWarning, setCheatWarning] = useState(false);
  const cheatTimeoutRef = useRef(null);
  const lastCheatTimeRef = useRef(0);
  
  // 20-Second Timer per question
  const [timeLeft, setTimeLeft] = useState(20);
  const timerRef = useRef(null);

  // Synchronized refs to avoid restarting timer when user selects/changes answers
  const selectedOptionRef = useRef(selectedOption);
  selectedOptionRef.current = selectedOption;

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  const submittingRef = useRef(submitting);
  submittingRef.current = submitting;

  const assessmentIdRef = useRef(assessmentId);
  assessmentIdRef.current = assessmentId;

  const totalQuestionsRef = useRef(totalQuestions);
  totalQuestionsRef.current = totalQuestions;

  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  const userAnswersRef = useRef(userAnswers);
  userAnswersRef.current = userAnswers;

  // Booking Form State
  const [bookingData, setBookingData] = useState({
    linkedin: '',
    preferredTime: 'Morning / Before 3 PM',
    currentRole: 'CEO / C-Suite Executive',
    communicationFrequency: 'Daily',
    whyNow: ''
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Initialize assessment
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/assessment/register');
          return;
        }

        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (user.role === 'ADMIN') {
            navigate('/admin');
            return;
          }
          if (user.linkedin) {
            setBookingData(prev => ({ ...prev, linkedin: user.linkedin }));
          }
        } catch {
          // ignore
        }

        try {
          const data = await getCurrentAssessment();
          if (data.finished) {
            setResults(data.results);
            setIsFinished(true);
            setAcceptedTerms(true);
            setLoading(false);
            return;
          }
          setAssessmentId(data.assessmentId);
          setQuestions(data.questions || [data.question]);
          setCurrentIndex(data.questionIndex || 0);
          setTotalQuestions(data.totalQuestions || 30);
          setCategories(data.categories || []);
          if (data.answers) {
            setUserAnswers(data.answers);
          }
        } catch (err) {
          const startData = await startAssessment();
          setAssessmentId(startData.assessmentId);
          setQuestions(startData.questions || [startData.question]);
          setCurrentIndex(startData.questionIndex || 0);
          setTotalQuestions(startData.totalQuestions || 30);
          setCategories(startData.categories || []);
          setUserAnswers({});
        }
      } catch (err) {
        console.error('Failed to start assessment:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/assessment/register');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  // Handle Answer Submission & Forward Transition
  const handleNext = useCallback(async (isTimeout = false) => {
    if (submittingRef.current) return;
    
    const curIdx = currentIndexRef.current;
    const curQ = questionsRef.current[curIdx];
    if (!curQ) return;

    const currentChoice = selectedOptionRef.current;
    // If manual click, user must have selected an option
    if (!isTimeout && currentChoice === null) return;

    const optionToSubmit = currentChoice !== null ? currentChoice : -1;
    const isFinal = curIdx === totalQuestionsRef.current - 1;

    try {
      setSubmitting(true);
      submittingRef.current = true;

      // Clear running timer
      if (timerRef.current) clearInterval(timerRef.current);

      const updatedAnswers = {
        ...userAnswersRef.current,
        [curQ.id]: optionToSubmit
      };
      setUserAnswers(updatedAnswers);
      userAnswersRef.current = updatedAnswers;

      const data = await submitAnswer(assessmentIdRef.current, curQ.id, optionToSubmit, isFinal);
      
      if (data.finished) {
        setResults(data.results);
        setIsFinished(true);
      } else {
        const nextIdx = curIdx + 1;
        if (nextIdx < totalQuestionsRef.current) {
          const isNewCategory = categoriesRef.current?.some(c => c.startIdx === nextIdx);
          setCurrentIndex(nextIdx);
          setSelectedOption(null);
          selectedOptionRef.current = null;
          setTimeLeft(20);
          if (isNewCategory) {
            setShowCategoryIntro(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, []);

  // 20-Second Question Timer (Tied ONLY to question index and phase, NEVER resets when choosing an answer)
  useEffect(() => {
    if (!acceptedTerms || showCategoryIntro || isFinished || loading || !questions[currentIndex]) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Reset to 20s strictly on new question index
    setTimeLeft(20);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleNext(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, acceptedTerms, showCategoryIntro, isFinished, loading, handleNext, questions]);

  // Scroll to top on question and phase transitions
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [currentIndex, showCategoryIntro, isFinished, showBookingForm, acceptedTerms]);

  // Anti-Cheat System
  const handleCheat = useCallback(async (type) => {
    const now = Date.now();
    if (now - lastCheatTimeRef.current < 2500) {
      return;
    }
    lastCheatTimeRef.current = now;

    if (assessmentIdRef.current && acceptedTerms && !isFinished) {
      setCheatWarning(true);
      if (cheatTimeoutRef.current) clearTimeout(cheatTimeoutRef.current);
      cheatTimeoutRef.current = setTimeout(() => {
        setCheatWarning(false);
      }, 3500);

      try {
        await logInfraction(assessmentIdRef.current, type);
      } catch (err) {
        console.error('Error logging infraction:', err);
      }
    }
  }, [acceptedTerms, isFinished]);

  useEffect(() => {
    // Only attach anti-cheat listeners during the active exam (terms accepted and not finished)
    if (!acceptedTerms || isFinished) {
      return;
    }

    const isInputField = (target) => {
      if (!target) return false;
      const tag = target.tagName?.toUpperCase();
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleCheat('tab_switch');
    };
    const handleBlur = () => handleCheat('window_blur');
    const handleContextMenu = (e) => {
      if (isInputField(e.target)) return;
      e.preventDefault();
      handleCheat('right_click');
    };
    const handleKeyDown = (e) => {
      if (isInputField(e.target)) {
        if (e.key === 'F12') {
          e.preventDefault();
          handleCheat('devtools_attempt');
        }
        return;
      }
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        handleCheat('devtools_attempt');
      }
    };
    const handleCopyPaste = (e) => {
      if (isInputField(e.target)) return;
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
    };
  }, [acceptedTerms, isFinished, handleCheat]);

  const currentQuestion = questions[currentIndex] || null;

  // Category determination
  let currentCategory = categories?.[0] || { name: "Grammar", label: "First", startIdx: 0 };
  let nextCategoryStart = totalQuestions;
  let categoryNumber = 1;
  
  if (categories && categories.length > 0) {
    for (let i = categories.length - 1; i >= 0; i--) {
      if (currentIndex >= categories[i].startIdx) {
        currentCategory = categories[i];
        nextCategoryStart = categories[i+1] ? categories[i+1].startIdx : totalQuestions;
        categoryNumber = i + 1;
        break;
      }
    }
  }
  
  const questionNumberInCategory = currentIndex - currentCategory.startIdx + 1;
  const totalInCategory = nextCategoryStart - currentCategory.startIdx;

  // Handle Speaking Booking Form Submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingSubmitting(true);
    try {
      const formattedLinkedin = bookingData.linkedin?.trim() ? (
        bookingData.linkedin.trim().startsWith('http')
          ? bookingData.linkedin.trim()
          : `https://${bookingData.linkedin.trim()}`
      ) : '';

      await bookSpeakingAssessment({
        assessmentId,
        ...bookingData,
        linkedin: formattedLinkedin
      });
      setBookingConfirmed(true);
    } catch (err) {
      console.error('Booking error:', err);
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading && !currentQuestion && !results) {
    return <div className="min-h-screen flex items-center justify-center font-sans font-medium text-brand-primary">Loading Assessment...</div>;
  }

  // Render Watermark for Section Intros
  const renderCategoryIntroWatermark = (categoryName) => {
    if (categoryName.toLowerCase().includes('vocab')) {
      return (
        <div className="absolute left-6 top-8 opacity-30 pointer-events-none select-none z-0">
          <svg width="110" height="110" viewBox="0 0 100 100" fill="none" stroke="#003a8f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 36L30 16L38 36M25 30H35" />
            <path d="M50 16H66L50 36H66" />
            <path d="M12 48C28 48 40 44 48 40V82C40 86 28 90 12 90V48Z" fill="#003a8f" fillOpacity="0.06" />
            <path d="M84 48C68 48 56 44 48 40V82C56 86 68 90 84 90V48Z" fill="#003a8f" fillOpacity="0.06" />
            <path d="M12 48H48V82H12V48Z" />
            <path d="M84 48H48V82H84V48Z" />
          </svg>
        </div>
      );
    } else if (categoryName.toLowerCase().includes('situation')) {
      return (
        <div className="absolute left-6 top-8 opacity-30 pointer-events-none select-none z-0">
          <svg width="110" height="110" viewBox="0 0 100 100" fill="none" stroke="#003a8f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M32 40C32 28 40 20 50 20C60 20 68 28 68 40C68 48 62 54 58 58V66H42V58C38 54 32 48 32 40Z" />
            <path d="M44 72H56" />
            <path d="M46 78H54" />
            <path d="M50 8V14" />
            <path d="M22 22L26 26" />
            <path d="M78 22L74 26" />
            <path d="M14 40H20" />
            <path d="M80 40H86" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="absolute left-6 top-8 opacity-35 pointer-events-none select-none z-0">
          <div className="flex flex-col gap-2.5 mb-2">
            <div className="h-2.5 w-36 bg-[#003a8f]/30 rounded-full" />
            <div className="h-2.5 w-36 bg-[#003a8f]/30 rounded-full" />
            <div className="h-2.5 w-36 bg-[#003a8f]/30 rounded-full" />
            <div className="h-2.5 w-24 bg-[#003a8f]/30 rounded-full" />
          </div>
          <div className="absolute left-8 top-3">
            <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="44" fill="#003a8f" fillOpacity="0.2" />
              <path d="M28 50L44 66L74 34" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      );
    }
  };

  // Render Customized Less Opaque Watermarks on Question Cards
  const renderQuestionCardWatermark = (categoryName) => {
    if (categoryName.toLowerCase().includes('vocab')) {
      return (
        <div className="absolute left-4 top-4 opacity-[0.09] pointer-events-none select-none z-0">
          <svg width="250" height="250" viewBox="0 0 100 100" fill="none" stroke="#003a8f" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 42L28 12L40 42M20 34H36" />
            <path d="M52 12H74L52 42H74" />
            <path d="M8 50C28 50 42 45 48 41V88C42 92 28 97 8 97V50Z" />
            <path d="M88 50C68 50 54 45 48 41V88C54 92 68 97 88 97V50Z" />
            <path d="M8 50H48V88H8V50Z" />
            <path d="M88 50H48V88H88V50Z" />
          </svg>
        </div>
      );
    } else if (categoryName.toLowerCase().includes('situation')) {
      return (
        <div className="absolute left-6 top-4 opacity-[0.09] pointer-events-none select-none z-0">
          <svg width="240" height="240" viewBox="0 0 100 100" fill="none" stroke="#003a8f" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M30 42C30 26 39 16 50 16C61 16 70 26 70 42C70 51 63 58 59 63V72H41V63C37 58 30 51 30 42Z" />
            <path d="M43 78H57" />
            <path d="M46 84H54" />
            <path d="M50 4V10" />
            <path d="M18 18L23 23" />
            <path d="M82 18L77 23" />
            <path d="M8 42H15" />
            <path d="M85 42H92" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="absolute left-6 top-6 opacity-25 pointer-events-none select-none z-0">
          <div className="flex flex-col gap-3">
            <div className="h-3 w-56 bg-[#003a8f]/30 rounded-full" />
            <div className="h-3 w-56 bg-[#003a8f]/30 rounded-full" />
            <div className="h-3 w-56 bg-[#003a8f]/30 rounded-full" />
            <div className="h-3 w-40 bg-[#003a8f]/30 rounded-full" />
          </div>
        </div>
      );
    }
  };

  // Determine Learning Path items for the report
  const learningPathItems = (results?.cefrLevel && CEFR_LEARNING_PATHS[results.cefrLevel]) 
    ? CEFR_LEARNING_PATHS[results.cefrLevel] 
    : (CEFR_LEARNING_PATHS['B1-'] || []);

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-center relative w-full py-4 sm:py-6 px-3 sm:px-4 bg-cover bg-center ${(!isFinished && acceptedTerms && !showBookingForm) ? 'select-none' : ''}`}
      style={{ backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.96)), url('/assessment_bg.jpg')" }}
    >
      
      {/* Cheat Warning Overlay */}
      <AnimatePresence>
        {cheatWarning && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 sm:top-6 z-50 bg-red-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border-2 border-red-700 text-xs sm:text-sm max-w-[94%] sm:max-w-md w-full mx-auto left-0 right-0"
          >
            <div className="flex items-center gap-3">
              <FaExclamationTriangle size={18} className="shrink-0 text-red-200" />
              <div>
                <h3 className="font-bold text-xs sm:text-sm">Notice: Focus Shift Detected</h3>
                <p className="text-[10px] sm:text-xs opacity-90">Please remain on the assessment window. Integrity is monitored.</p>
              </div>
            </div>
            <button 
              onClick={() => setCheatWarning(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white shrink-0"
              aria-label="Dismiss warning"
            >
              <FaTimes size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <AnimatePresence mode="wait">
        {!acceptedTerms ? (
          /* 1. Assessment Terms & Rules Agreement Screen */
          <motion.div 
            key="terms"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-[94%] max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 p-5 sm:p-8 md:p-10 flex flex-col font-sans my-4"
          >
            <div className="flex items-center gap-3 mb-5 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-100">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-[#003a8f]/10 text-[#003a8f] flex items-center justify-center shrink-0">
                <FaShieldAlt size={20} />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900">Assessment Guidelines & Rules</h1>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Please review the rules before starting your diagnostic</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#f0f6ff] border border-blue-100 flex items-start gap-3">
                <div className="text-[#003a8f] mt-0.5 shrink-0"><FaClock size={18} /></div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">20 Seconds per Question</h3>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Each question features a live 20-second countdown bar. When the timer expires, the test automatically transitions to the next question.
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <div className="text-[#003a8f] mt-0.5 shrink-0"><FaArrowRight size={16} /></div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">Forward-Only Navigation</h3>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Questions must be answered sequentially. There is no return to previous questions once submitted or timed out.
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
                <div className="text-amber-600 mt-0.5 shrink-0"><FaShieldAlt size={18} /></div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">Anti-Cheat & Integrity System Active</h3>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Tab switches, window focus loss, right-clicks, and developer tools are strictly tracked and flagged in your final evaluation.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setAcceptedTerms(true);
                setShowCategoryIntro(true);
              }}
              className="w-full h-12 sm:h-14 bg-[#003a8f] text-white font-bold rounded-2xl hover:bg-opacity-95 transition-all shadow-md flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <span>I Understand & Accept Terms</span>
              <span>→</span>
            </button>
          </motion.div>

        ) : showBookingForm ? (
          /* 2. C-Suite Speaking Assessment — Booking Form Screen */
          <motion.div 
            key="booking"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-[94%] max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 p-5 sm:p-8 md:p-12 flex flex-col font-sans my-4 select-text"
          >
            {bookingConfirmed ? (
              /* Booking Success Confirmation */
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-20 h-20 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-6 border border-green-200 shadow-sm">
                  <FaCheckCircle size={44} />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Speaking Assessment Booked!</h2>
                <p className="text-slate-600 text-sm md:text-base max-w-lg mb-8 leading-relaxed">
                  Thank you! Your assessment profile and preferred session time have been received. Sarah Safaa’s executive team will reach out with your calendar invitation shortly.
                </p>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/');
                  }}
                  className="px-8 py-3.5 bg-[#003a8f] text-white font-semibold rounded-full hover:bg-opacity-90 transition-all shadow-md cursor-pointer"
                >
                  Return to Homepage →
                </button>
              </div>
            ) : (
              /* Booking Form */
              <div>
                <div className="mb-8 pb-4 border-b border-slate-100">
                  <h1 className="text-2xl md:text-3xl font-bold text-[#003a8f] tracking-tight">
                    C-Suite Speaking Assessment — Booking Form
                  </h1>
                  <p className="text-xs md:text-sm text-slate-500 font-medium mt-1.5">
                    Schedule your private executive 1-on-1 speaking evaluation with Sarah Safaa.
                  </p>
                </div>

                <form onSubmit={handleBookingSubmit} className="flex flex-col gap-7">
                  
                  {/* 1. LinkedIn Profile */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-[#003a8f]">1.</span> LinkedIn Profile
                    </label>
                    <p className="text-xs text-slate-500">
                      Please share your LinkedIn profile so I can learn a little more about your professional background.
                    </p>
                    <div className="relative mt-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <FaLinkedin size={18} />
                      </div>
                      <input 
                        type="url"
                        value={bookingData.linkedin}
                        onChange={(e) => setBookingData({ ...bookingData, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/yourprofile"
                        required
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 focus:border-[#003a8f] focus:ring-2 focus:ring-[#003a8f]/20 outline-none text-slate-800 text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* 2. Preferred Time */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-[#003a8f]">2.</span> Preferred Time
                    </label>
                    <p className="text-xs text-slate-500">
                      What time works best for your assessment?
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                      {[
                        'Morning / Before 3 PM',
                        'Afternoon / After 3 PM',
                        'Either works for me'
                      ].map((timeOption, idx) => (
                        <label 
                          key={idx}
                          className={`
                            p-3.5 rounded-xl border-2 cursor-pointer flex items-center gap-2.5 transition-all text-xs md:text-sm font-medium
                            ${bookingData.preferredTime === timeOption
                              ? 'border-[#003a8f] bg-[#003a8f]/5 text-[#003a8f] font-semibold'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                            }
                          `}
                        >
                          <input 
                            type="radio" 
                            name="preferredTime" 
                            value={timeOption}
                            checked={bookingData.preferredTime === timeOption}
                            onChange={(e) => setBookingData({ ...bookingData, preferredTime: e.target.value })}
                            className="text-[#003a8f] focus:ring-0"
                          />
                          <span>{timeOption}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 3. Current Role */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-[#003a8f]">3.</span> Current Role
                    </label>
                    <p className="text-xs text-slate-500">
                      Which best describes your current role?
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-1">
                      {[
                        'Founder / Co-Founder',
                        'CEO / C-Suite Executive',
                        'Director / Senior Leader',
                        'Manager / Team Leader',
                        'Other'
                      ].map((roleOption, idx) => (
                        <label 
                          key={idx}
                          className={`
                            p-3 rounded-xl border-2 cursor-pointer flex items-center gap-2.5 transition-all text-xs md:text-sm font-medium
                            ${bookingData.currentRole === roleOption
                              ? 'border-[#003a8f] bg-[#003a8f]/5 text-[#003a8f] font-semibold'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                            }
                          `}
                        >
                          <input 
                            type="radio" 
                            name="currentRole" 
                            value={roleOption}
                            checked={bookingData.currentRole === roleOption}
                            onChange={(e) => setBookingData({ ...bookingData, currentRole: e.target.value })}
                            className="text-[#003a8f] focus:ring-0"
                          />
                          <span>{roleOption}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 4. Professional Communication */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-[#003a8f]">4.</span> Professional Communication
                    </label>
                    <p className="text-xs text-slate-500">
                      How often do you use English in high-stakes professional situations such as meetings, presentations, negotiations, or client conversations?
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-1">
                      {[
                        'Daily',
                        'Several times a week',
                        'Occasionally',
                        'Rarely'
                      ].map((freqOption, idx) => (
                        <label 
                          key={idx}
                          className={`
                            p-3 rounded-xl border-2 cursor-pointer flex items-center gap-2 transition-all text-xs md:text-sm font-medium text-center justify-center
                            ${bookingData.communicationFrequency === freqOption
                              ? 'border-[#003a8f] bg-[#003a8f]/5 text-[#003a8f] font-semibold'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                            }
                          `}
                        >
                          <input 
                            type="radio" 
                            name="communicationFrequency" 
                            value={freqOption}
                            checked={bookingData.communicationFrequency === freqOption}
                            onChange={(e) => setBookingData({ ...bookingData, communicationFrequency: e.target.value })}
                            className="text-[#003a8f] focus:ring-0"
                          />
                          <span>{freqOption}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 5. Why Now? */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-[#003a8f]">5.</span> Why Now?
                    </label>
                    <p className="text-xs text-slate-500">
                      What is the main reason you want to improve your executive communication at this stage of your career?
                      <span className="block text-slate-400 font-normal mt-0.5">You may answer this question in Arabic if you prefer.</span>
                    </p>
                    <textarea 
                      rows={4}
                      value={bookingData.whyNow}
                      onChange={(e) => setBookingData({ ...bookingData, whyNow: e.target.value })}
                      placeholder="Share your primary goal or upcoming high-stakes speaking milestone..."
                      required
                      className="w-full p-4 rounded-xl border border-slate-300 focus:border-[#003a8f] focus:ring-2 focus:ring-[#003a8f]/20 outline-none text-slate-800 text-sm transition-all resize-none mt-1"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors"
                    >
                      ← Back to Diagnostic Report
                    </button>

                    <button
                      type="submit"
                      disabled={bookingSubmitting}
                      className="w-full md:w-auto px-10 py-3.5 bg-[#003a8f] text-white font-bold rounded-full hover:bg-opacity-95 transition-all shadow-md cursor-pointer disabled:bg-slate-400"
                    >
                      {bookingSubmitting ? 'Submitting Booking...' : 'Confirm Speaking Assessment Booking →'}
                    </button>
                  </div>

                </form>
              </div>
            )}
          </motion.div>

        ) : isFinished && results ? (
          /* 3. Diagnostic Profile Report Screen with Recommended Learning Paths */
          <motion.div 
            key="finish"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-[94%] max-w-4xl flex flex-col gap-4 sm:gap-6 font-sans text-slate-800 my-4"
          >
            {/* 1. Header & Overall Summary Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="mb-5 sm:mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                  {results.candidate?.name || 'Candidate'}’s Communication Profile
                </h1>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                  <span className="font-semibold text-slate-700">Role:</span> {results.candidate?.role || 'Executive Candidate'} • <span className="font-semibold text-slate-700">Email:</span> {results.candidate?.email}
                </p>
              </div>

              {/* 3-Part Metric Box */}
              <div className="grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-slate-200/90 overflow-hidden">
                
                {/* Overall Score */}
                <div className="md:col-span-3 p-4 sm:p-5 md:p-6 flex flex-col justify-center items-center md:items-start border-b md:border-b-0 md:border-r border-slate-200/90">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">OVERALL SCORE</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-3xl md:text-4xl font-extrabold text-[#003a8f]">{results.score}</span>
                    <span className="text-lg md:text-xl font-normal text-slate-400">/ {results.totalQuestions}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{results.accuracy}% Accuracy</span>
                </div>

                {/* Estimated CEFR */}
                <div className="md:col-span-3 p-4 sm:p-5 md:p-6 flex flex-col justify-center items-center md:items-start border-b md:border-b-0 md:border-r border-slate-200/90">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">ESTIMATED CEFR</span>
                  <div className="my-1">
                    <span className="text-3xl md:text-4xl font-extrabold text-slate-900">{results.cefrLevel}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Global English Standard</span>
                </div>

                {/* C-Suite Communication Stage (Light Blue Accent) */}
                <div className="md:col-span-6 p-4 sm:p-5 md:p-6 bg-[#f0f6ff] flex flex-col justify-center">
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#003a8f] tracking-wider uppercase mb-1">C-SUITE COMMUNICATION STAGE</span>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-snug my-1">
                    {results.cSuiteStage?.title || 'Pre-Independent Communicator'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {results.cSuiteStage?.description || 'Can handle most workplace interactions with occasional difficulty.'}
                  </p>
                </div>

              </div>
            </div>

            {/* 2. Diagnostic Summary Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm border border-slate-100">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Diagnostic Summary</h2>
              <div className="border-l-4 border-[#003a8f] pl-3.5 sm:pl-4 md:pl-5 py-1">
                <p className="text-slate-600 leading-relaxed text-xs sm:text-sm md:text-[15px]">
                  {results.diagnosticSummary}
                </p>
              </div>
            </div>

            {/* 3. Section Performance Rating Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm border border-slate-100">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-4 sm:mb-6">Section Performance Rating</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                {results.sectionRatings?.map((section, idx) => (
                  <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div>
                      <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-800 tracking-wider uppercase">{section.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 sm:min-h-[32px] leading-snug">{section.subtitle}</p>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xl sm:text-2xl font-bold text-slate-900">{section.percentage}%</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                          section.badgeType === 'success' 
                            ? 'border-green-400 bg-green-50 text-green-700' 
                            : section.badgeType === 'info'
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-blue-400 text-[#003a8f] bg-blue-50/50'
                        }`}>
                          {section.badge}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden my-3">
                        <div 
                          className="h-full bg-[#003a8f] rounded-full transition-all duration-1000" 
                          style={{ width: `${section.percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-medium">
                        <span>Correct Answers:</span>
                        <span className="font-semibold text-slate-700">{section.score} / {section.total}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Recommended Learning Paths */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-6 pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900">Recommended Learning Path</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Targeted development areas calibrated for level <span className="font-bold text-[#003a8f]">{results.cefrLevel}</span>
                  </p>
                </div>
                <span className="bg-[#003a8f]/10 text-[#003a8f] text-xs font-bold px-3 py-1 rounded-full uppercase self-start sm:self-auto">
                  CEFR {results.cefrLevel}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {learningPathItems.map((item, idx) => (
                  <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-[#003a8f] text-white text-xs font-bold flex items-center justify-center mb-2.5 sm:mb-3">
                        {idx + 1}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug mb-1.5 sm:mb-2">
                        {item.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Action Button & Footer Notice */}
            <div className="flex flex-col items-center mt-2 w-full">
              <motion.button 
                onClick={() => setShowBookingForm(true)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full bg-[#003a8f] text-white py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base md:text-lg hover:bg-opacity-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Next Step</span>
                <span>→</span>
              </motion.button>

              <p className="text-[10px] sm:text-xs text-slate-400 text-center mt-4 sm:mt-6">
                C-Suite Communication Assessment Diagnostic Platform • Developed exclusively for Sarah Safaa candidates.
              </p>
            </div>

          </motion.div>

        ) : showCategoryIntro ? (
          /* 4. Section Intro Screen */
          <motion.div 
            key="intro"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4 }}
            className="w-[94%] max-w-[800px] flex flex-col items-center gap-4"
          >
            <div className="w-full bg-[#dce0e6] rounded-2xl sm:rounded-3xl border border-[#c4ced9] shadow-lg p-5 sm:p-8 md:p-12 relative overflow-hidden flex flex-col items-center text-center">
              {renderCategoryIntroWatermark(currentCategory.name)}

              <div className="my-2">
                <span className="text-[#003a8f] text-[80px] sm:text-[110px] md:text-[140px] font-black leading-none font-sans block tracking-tighter drop-shadow-sm">
                  {categoryNumber}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1.5 text-[#003a8f] font-sans relative z-10">
                <p className="text-lg sm:text-xl md:text-2xl font-medium tracking-wide">
                  {currentCategory.label}
                </p>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
                  C-Suite {currentCategory.name} Questions
                </h2>
                <p className="text-base sm:text-lg md:text-xl font-medium opacity-90 mt-0.5 sm:mt-1">
                  {totalInCategory} questions
                </p>
              </div>

              <motion.button 
                onClick={() => {
                  setShowCategoryIntro(false);
                  setTimeLeft(20);
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-6 sm:mt-8 bg-[#003a8f] text-white font-semibold text-sm sm:text-base md:text-lg px-8 sm:px-10 py-3 sm:py-3.5 rounded-full shadow-md hover:bg-opacity-95 transition-all cursor-pointer relative z-10"
              >
                Start Section →
              </motion.button>
            </div>
          </motion.div>

        ) : currentQuestion ? (
          /* 5. Question View with 20s Countdown Bar & Forward Navigation */
          <motion.div 
            key={`question-${currentIndex}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="w-[94%] max-w-[960px] flex flex-col relative"
          >
            {/* Top Indicator & 20s Decreasing Timer Bar */}
            <div className="flex flex-col items-center mb-4 sm:mb-5">
              
              <div className="w-full flex items-center justify-between mb-2.5 sm:mb-3 px-1 sm:px-2">
                <span className="text-[10px] sm:text-xs font-bold text-[#003a8f] bg-[#003a8f]/10 px-2.5 sm:px-3.5 py-1 rounded-full uppercase tracking-wider">
                  {currentCategory.name}
                </span>
                
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#003a8f] tracking-tight font-sans">
                  {questionNumberInCategory}/{totalInCategory}
                </h2>

                <div className={`flex items-center gap-1.5 font-bold text-xs md:text-sm px-2.5 sm:px-3 py-1 rounded-full transition-colors ${
                  timeLeft <= 5 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'
                }`}>
                  <FaClock size={12} />
                  <span>{timeLeft}s</span>
                </div>
              </div>

              {/* 20s Decreasing Progress Bar */}
              <div className="w-full h-2 bg-slate-200/90 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                    timeLeft <= 5 ? 'bg-red-500' : 'bg-[#003a8f]'
                  }`}
                  style={{ width: `${(timeLeft / 20) * 100}%` }}
                />
              </div>

            </div>

            {/* Main Question Card */}
            <div className="bg-white rounded-2xl md:rounded-3xl border border-[#cbd5e1] p-4 sm:p-6 md:p-10 shadow-sm relative overflow-hidden">
              
              {/* Section Customized Watermark */}
              {renderQuestionCardWatermark(currentCategory.name)}

              {/* Question Text */}
              <div className="relative z-10 mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base md:text-lg font-medium text-[#003a8f] leading-relaxed">
                  <span className="mr-1.5 font-bold">{questionNumberInCategory}.</span>
                  {currentQuestion.text}
                </h3>
              </div>

              {/* Options Stack */}
              <div className="flex flex-col gap-2.5 sm:gap-3 md:gap-3.5 relative z-10">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const letters = ['A', 'B', 'C', 'D'];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedOption(idx);
                        selectedOptionRef.current = idx;
                      }}
                      className={`
                        w-full min-h-[46px] sm:min-h-[52px] py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl border-2 transition-all flex items-center text-left text-xs sm:text-sm md:text-base font-medium cursor-pointer
                        ${isSelected 
                          ? 'bg-[#003a8f] border-[#003a8f] text-white shadow-md' 
                          : 'bg-white border-[#b3cced] text-[#003a8f] hover:bg-[#f5f8fd] hover:border-[#003a8f]'
                        }
                      `}
                    >
                      <span>{letters[idx]}. {option}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action Bar (Forward Only) */}
            <div className="flex justify-end items-center mt-4 sm:mt-5">
              <button 
                type="button"
                onClick={() => handleNext(false)}
                disabled={selectedOption === null || submitting}
                className={`
                  w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-sans font-medium text-xs sm:text-sm md:text-base transition-all shadow-md
                  ${selectedOption !== null && !submitting
                    ? 'bg-[#003a8f] text-white hover:bg-[#002d72] cursor-pointer shadow-md' 
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }
                `}
              >
                {submitting ? 'Submitting...' : currentIndex === totalQuestions - 1 ? 'Finish assessment' : 'Next question'}
              </button>
            </div>

          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default AssessmentQuestionPage;
