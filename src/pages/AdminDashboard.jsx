import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAdminAssessments, 
  getAdminQuestions, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion, 
  getAdminAssessmentDetails, 
  clearAllResponses,
  getAdminMessages,
  deleteAdminMessage,
  clearAdminMessages
} from '../api';
import { 
  FaUserShield, 
  FaExclamationTriangle, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCheck, 
  FaTimes, 
  FaSync, 
  FaEnvelope, 
  FaPhone, 
  FaBuilding, 
  FaEye,
  FaWhatsapp
} from 'react-icons/fa';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates', 'questions', or 'messages'
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Question Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    category: 'Grammar',
    newCategory: '',
    text: '',
    options: ['', '', '', ''],
    correct_answer: 0
  });

  const [detailsModal, setDetailsModal] = useState(null);
  const [selectedMessageModal, setSelectedMessageModal] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/admin/login');
        return;
      }
      
      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN') {
        navigate('/admin/login');
        return;
      }

      setLoading(true);
      const [assData, qData, msgData] = await Promise.all([
        getAdminAssessments(),
        getAdminQuestions(),
        getAdminMessages()
      ]);
      setAssessments(assData || []);
      setQuestions(qData || []);
      setMessages(msgData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to permanently delete all candidate assessment records and responses?")) {
      try {
        setLoading(true);
        await clearAllResponses();
        setAssessments([]);
        alert("All candidate assessment responses have been successfully cleared.");
      } catch (err) {
        alert("Error clearing responses: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClearMessages = async () => {
    if (window.confirm("Are you sure you want to permanently delete all Get in Touch messages?")) {
      try {
        setLoading(true);
        await clearAdminMessages();
        setMessages([]);
        alert("All Get in Touch messages have been cleared.");
      } catch (err) {
        alert("Error clearing messages: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteMessage = async (id) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteAdminMessage(id);
        setMessages(messages.filter(m => m.id !== id));
        if (selectedMessageModal?.id === id) {
          setSelectedMessageModal(null);
        }
      } catch (err) {
        alert("Failed to delete message: " + err.message);
      }
    }
  };

  const viewDetails = async (assessment) => {
    try {
      const data = await getAdminAssessmentDetails(assessment.id);
      setDetailsModal(data);
    } catch (err) {
      alert("Failed to load details: " + err.message);
    }
  };

  // --- Question Management ---
  const uniqueCategories = [...new Set(questions.map(q => q.category))];
  
  const openNewQuestionModal = () => {
    setEditingId(null);
    setFormData({
      category: uniqueCategories[0] || 'Grammar',
      newCategory: '',
      text: '',
      options: ['', '', '', ''],
      correct_answer: 0
    });
    setShowModal(true);
  };

  const openEditModal = (q) => {
    setEditingId(q.id);
    setFormData({
      category: q.category,
      newCategory: '',
      text: q.text,
      options: [...q.options],
      correct_answer: q.correct_answer
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        await deleteQuestion(id);
        setQuestions(questions.filter(q => q.id !== id));
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleOptionChange = (idx, value) => {
    const newOptions = [...formData.options];
    newOptions[idx] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const categoryToSave = formData.category === 'NEW' ? formData.newCategory : formData.category;
    if (!categoryToSave) {
      alert("Please specify a category");
      return;
    }

    try {
      if (editingId) {
        const updated = await updateQuestion(editingId, {
          category: categoryToSave,
          text: formData.text,
          options: formData.options,
          correctAnswer: formData.correct_answer
        });
        setQuestions(questions.map(q => q.id === editingId ? updated : q));
      } else {
        const created = await createQuestion({
          category: categoryToSave,
          text: formData.text,
          options: formData.options,
          correctAnswer: formData.correct_answer
        });
        setQuestions([...questions, created]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && assessments.length === 0 && questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center font-sans font-medium text-slate-600">Loading Admin Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3 text-brand-primary">
            <FaUserShield size={32} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-sans font-bold">Admin Dashboard</h1>
              <p className="text-xs text-gray-500 font-medium">Executive Assessment Diagnostics & Inquiry Management</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
            <button 
              onClick={fetchDashboardData}
              title="Refresh Data"
              className="px-3.5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer"
            >
              <FaSync size={13} />
              <span>Refresh</span>
            </button>

            {activeTab === 'candidates' && (
              <button 
                onClick={handleClearAll}
                className="px-3.5 sm:px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-xs sm:text-sm shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <FaTrash size={12} />
                <span>Clear All Responses</span>
              </button>
            )}

            {activeTab === 'messages' && (
              <button 
                onClick={handleClearMessages}
                className="px-3.5 sm:px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-xs sm:text-sm shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <FaTrash size={12} />
                <span>Clear All Messages</span>
              </button>
            )}

            <button 
              onClick={handleLogout}
              className="px-3.5 sm:px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-xs sm:text-sm cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-700 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 border-b border-gray-200 pb-px">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-4 sm:px-6 py-3 rounded-t-lg font-semibold transition-colors border-b-2 text-xs sm:text-sm flex items-center gap-2 ${
              activeTab === 'candidates' 
                ? 'bg-white text-brand-primary border-brand-primary shadow-sm' 
                : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
            }`}
          >
            <span>Candidates & Results</span>
            <span className="bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full text-xs font-bold">
              {assessments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 sm:px-6 py-3 rounded-t-lg font-semibold transition-colors border-b-2 text-xs sm:text-sm flex items-center gap-2 ${
              activeTab === 'messages' 
                ? 'bg-white text-brand-primary border-brand-primary shadow-sm' 
                : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
            }`}
          >
            <span>Get in Touch Responses</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${messages.length > 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {messages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 sm:px-6 py-3 rounded-t-lg font-semibold transition-colors border-b-2 text-xs sm:text-sm flex items-center gap-2 ${
              activeTab === 'questions' 
                ? 'bg-white text-brand-primary border-brand-primary shadow-sm' 
                : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
            }`}
          >
            <span>Manage Questions</span>
            <span className="bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full text-xs font-bold">
              {questions.length}
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* 1. CANDIDATES & RESULTS TAB */}
          {activeTab === 'candidates' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs sm:text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Candidate Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Score</th>
                    <th className="px-6 py-4 font-medium">CEFR Level</th>
                    <th className="px-6 py-4 font-medium">Cheat Infractions</th>
                    <th className="px-6 py-4 font-medium">Started At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {assessments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500 font-medium">
                        No candidate assessment responses found.
                      </td>
                    </tr>
                  ) : (
                    assessments.map((assessment) => (
                      <tr 
                        key={assessment.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => viewDetails(assessment)}
                      >
                        <td className="px-6 py-4 font-bold text-gray-900">{assessment.name}</td>
                        <td className="px-6 py-4 text-gray-600">{assessment.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            assessment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {assessment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-brand-primary">{assessment.score}</td>
                        <td className="px-6 py-4 font-semibold">{assessment.cefr_level}</td>
                        <td className="px-6 py-4">
                          {assessment.infractions_count > 0 ? (
                            <div className="flex items-center gap-1.5 text-red-600 font-bold">
                              <FaExclamationTriangle size={14} />
                              <span>{assessment.infractions_count}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {new Date(assessment.started_at).toLocaleString(undefined, { 
                            year: 'numeric', month: 'short', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. GET IN TOUCH MESSAGES TAB */}
          {activeTab === 'messages' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs sm:text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Sender Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Phone / WhatsApp</th>
                    <th className="px-6 py-4 font-medium">Company</th>
                    <th className="px-6 py-4 font-medium">Subject</th>
                    <th className="px-6 py-4 font-medium">Message Preview</th>
                    <th className="px-6 py-4 font-medium">Received At</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {messages.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-gray-500 font-medium">
                        No "Get in Touch" messages received yet.
                      </td>
                    </tr>
                  ) : (
                    messages.map((msg) => (
                      <tr 
                        key={msg.id} 
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-gray-900">{msg.name}</td>
                        <td className="px-6 py-4 text-gray-600">
                          <a href={`mailto:${msg.email}`} className="text-blue-600 hover:underline">
                            {msg.email}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {msg.phone ? (
                            <a 
                              href={`https://wa.me/${msg.phone.replace(/\D/g, '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-green-700 hover:underline flex items-center gap-1"
                            >
                              <FaWhatsapp size={13} />
                              <span>{msg.phone}</span>
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-700">{msg.company || '—'}</td>
                        <td className="px-6 py-4">
                          <span className="bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full text-xs font-semibold">
                            {msg.subject || 'Inquiry'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                          {msg.message}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(msg.created_at || Date.now()).toLocaleString(undefined, { 
                            year: 'numeric', month: 'short', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2.5">
                            <button 
                              onClick={() => setSelectedMessageModal(msg)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="View Message"
                            >
                              <FaEye size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Message"
                            >
                              <FaTrash size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. MANAGE QUESTIONS TAB */}
          {activeTab === 'questions' && (
            <div>
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">
                  Question Bank ({questions.length})
                </h2>
                <button
                  onClick={openNewQuestionModal}
                  className="px-4 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-[#002d72] transition-colors font-semibold flex items-center gap-2 text-sm shadow-sm cursor-pointer"
                >
                  <FaPlus size={13} />
                  <span>Add Question</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 text-xs sm:text-sm">
                    <tr>
                      <th className="px-6 py-4 font-medium w-16">ID</th>
                      <th className="px-6 py-4 font-medium w-36">Category</th>
                      <th className="px-6 py-4 font-medium">Question Text</th>
                      <th className="px-6 py-4 font-medium w-32 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                    {questions.map((q) => (
                      <tr key={q.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-500">{q.id}</td>
                        <td className="px-6 py-4">
                          <span className="bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full text-xs font-semibold">
                            {q.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800 max-w-lg">
                          {q.text}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => openEditModal(q)} 
                              className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer"
                              title="Edit Question"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(q.id)} 
                              className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                              title="Delete Question"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Message Details Modal */}
      {selectedMessageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <FaEnvelope size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedMessageModal.name}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Received: {new Date(selectedMessageModal.created_at || Date.now()).toLocaleString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMessageModal(null)} 
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 text-sm">
              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Email</span>
                  <a href={`mailto:${selectedMessageModal.email}`} className="text-blue-600 font-semibold hover:underline">
                    {selectedMessageModal.email}
                  </a>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Phone / WhatsApp</span>
                  <span className="text-gray-800 font-semibold">{selectedMessageModal.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Company</span>
                  <span className="text-gray-800 font-semibold">{selectedMessageModal.company || '—'}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Subject</span>
                  <span className="text-brand-primary font-semibold">{selectedMessageModal.subject}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Full Message</span>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedMessageModal.message}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 justify-end">
                {selectedMessageModal.phone && (
                  <a 
                    href={`https://wa.me/${selectedMessageModal.phone.replace(/\D/g, '')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-green-700 transition-colors"
                  >
                    <FaWhatsapp size={16} />
                    <span>WhatsApp Chat</span>
                  </a>
                )}
                <a 
                  href={`mailto:${selectedMessageModal.email}?subject=Re: ${encodeURIComponent(selectedMessageModal.subject)}`}
                  className="px-5 py-2.5 bg-brand-primary text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-[#002d72] transition-colors"
                >
                  <FaEnvelope size={14} />
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingId ? 'Edit Question' : 'Add New Question'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 flex flex-col gap-6">
              
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Category</label>
                <select 
                  className="border border-gray-300 rounded-lg p-3 outline-none focus:border-brand-primary"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {uniqueCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="NEW">+ Add New Category</option>
                </select>
                
                {formData.category === 'NEW' && (
                  <input
                    type="text"
                    placeholder="Enter new category name..."
                    className="border border-gray-300 rounded-lg p-3 outline-none focus:border-brand-primary mt-2"
                    value={formData.newCategory}
                    onChange={(e) => setFormData({ ...formData, newCategory: e.target.value })}
                    required
                  />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Question Text</label>
                <textarea
                  className="border border-gray-300 rounded-lg p-3 outline-none focus:border-brand-primary min-h-[100px]"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="font-semibold text-gray-700">Options</label>
                {[0, 1, 2, 3].map(idx => (
                  <div key={idx} className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="correct_answer"
                      checked={formData.correct_answer === idx}
                      onChange={() => setFormData({ ...formData, correct_answer: idx })}
                      className="w-5 h-5 text-brand-primary"
                    />
                    <input
                      type="text"
                      className={`flex-1 border rounded-lg p-3 outline-none focus:border-brand-primary ${formData.correct_answer === idx ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-300'}`}
                      placeholder={`Option ${['A','B','C','D'][idx]}`}
                      value={formData.options[idx]}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-4 mt-4 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 rounded-lg font-medium bg-brand-primary text-white hover:bg-opacity-90 transition-colors"
                >
                  {editingId ? 'Save Changes' : 'Create Question'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Assessment Details Modal */}
      {detailsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Assessment Details: {detailsModal.assessment.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Score: {detailsModal.assessment.score} • 
                  Level: {detailsModal.assessment.cefr_level} • 
                  Taken: {new Date(detailsModal.assessment.started_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={() => setDetailsModal(null)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              <div className="space-y-4">
                {detailsModal.answers.map((ans, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border ${ans.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex gap-3 mb-2">
                      <div className="mt-1">
                        {ans.is_correct ? <FaCheck className="text-green-600" /> : <FaTimes className="text-red-600" />}
                      </div>
                      <div>
                        <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-semibold mr-2 border">
                          {ans.category}
                        </span>
                        <span className="font-medium text-gray-800">{idx + 1}. {ans.question_text}</span>
                      </div>
                    </div>
                    <div className="ml-7 text-sm space-y-1">
                      <p className="text-gray-600">
                        <span className="font-semibold">Candidate Answer:</span> {ans.options[ans.selected_option]}
                      </p>
                      {!ans.is_correct && (
                        <p className="text-green-700">
                          <span className="font-semibold">Correct Answer:</span> {ans.options[ans.correct_answer]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {detailsModal.answers.length === 0 && (
                  <p className="text-center text-gray-500">No answers recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
