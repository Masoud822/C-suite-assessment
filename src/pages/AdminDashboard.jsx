import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminAssessments, getAdminQuestions, createQuestion, updateQuestion, deleteQuestion, getAdminAssessmentDetails, clearAllResponses } from '../api';
import { FaUserShield, FaExclamationTriangle, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSync } from 'react-icons/fa';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates' or 'questions'
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
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
      const [assData, qData] = await Promise.all([
        getAdminAssessments(),
        getAdminQuestions()
      ]);
      setAssessments(assData || []);
      setQuestions(qData || []);
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
    
    if (!categoryToSave.trim()) {
      return alert("Category cannot be empty");
    }
    
    const payload = {
      category: categoryToSave,
      text: formData.text,
      options: formData.options,
      correct_answer: formData.correct_answer
    };

    try {
      if (editingId) {
        await updateQuestion(editingId, payload);
      } else {
        await createQuestion(payload);
      }
      setShowModal(false);
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && assessments.length === 0) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3 text-brand-primary">
            <FaUserShield size={32} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-sans font-bold">Admin Dashboard</h1>
              <p className="text-xs text-gray-500 font-medium">Executive Assessment Diagnostics Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button 
              onClick={fetchDashboardData}
              title="Refresh Data"
              className="px-3.5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 text-sm shadow-sm cursor-pointer"
            >
              <FaSync size={13} />
              <span>Refresh</span>
            </button>

            {activeTab === 'candidates' && (
              <button 
                onClick={handleClearAll}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm shadow-sm cursor-pointer flex items-center gap-2"
              >
                <FaTrash size={12} />
                <span>Clear All Responses</span>
              </button>
            )}

            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm cursor-pointer"
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

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-6 py-3 rounded-t-lg font-semibold transition-colors border-b-2 ${
              activeTab === 'candidates' 
                ? 'bg-white text-brand-primary border-brand-primary' 
                : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
            }`}
          >
            Candidates & Results
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-6 py-3 rounded-t-lg font-semibold transition-colors border-b-2 ${
              activeTab === 'questions' 
                ? 'bg-white text-brand-primary border-brand-primary' 
                : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
            }`}
          >
            Manage Questions
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {activeTab === 'candidates' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm">
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
                <tbody className="divide-y divide-gray-100">
                  {assessments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No assessments found.
                      </td>
                    </tr>
                  ) : (
                    assessments.map((assessment) => (
                      <tr 
                        key={assessment.id} 
                        className="hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => viewDetails(assessment)}
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">{assessment.name}</td>
                        <td className="px-6 py-4 text-gray-600">{assessment.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            assessment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {assessment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-brand-primary">{assessment.score}</td>
                        <td className="px-6 py-4">{assessment.cefr_level}</td>
                        <td className="px-6 py-4">
                          {assessment.infractions_count > 0 ? (
                            <div className="flex items-center gap-2 text-red-600 font-bold">
                              <FaExclamationTriangle />
                              {assessment.infractions_count}
                            </div>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
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

          {activeTab === 'questions' && (
            <div>
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-800">Question Bank ({questions.length})</h2>
                <button 
                  onClick={openNewQuestionModal}
                  className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  <FaPlus /> Add Question
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white text-gray-600 border-b">
                    <tr>
                      <th className="px-6 py-4 font-medium w-16">ID</th>
                      <th className="px-6 py-4 font-medium w-32">Category</th>
                      <th className="px-6 py-4 font-medium">Question Text</th>
                      <th className="px-6 py-4 font-medium w-32 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {questions.map((q) => (
                      <tr key={q.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-500">{q.id}</td>
                        <td className="px-6 py-4">
                          <span className="bg-brand-primary/10 text-brand-primary px-2 py-1 rounded text-xs font-medium">
                            {q.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800 line-clamp-2">
                          {q.text}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button onClick={() => openEditModal(q)} className="text-blue-600 hover:text-blue-800">
                              <FaEdit size={18} />
                            </button>
                            <button onClick={() => handleDelete(q.id)} className="text-red-600 hover:text-red-800">
                              <FaTrash size={18} />
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

      {/* Details Modal */}
      {detailsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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
