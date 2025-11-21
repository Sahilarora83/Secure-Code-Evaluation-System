import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const AttemptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const { user } = useAuth();

  const fetchAttempt = useCallback(async () => {
    try {
      const response = await api.get(`/attempts/${id}`);
      setAttempt(response.data.attempt);
    } catch (error) {
      toast.error('Failed to load attempt');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAttempt();
  }, [fetchAttempt]);

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const response = await api.post(
        `/reports/generate/${id}`,
        {},
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!attempt) {
    return <div className="min-h-screen flex items-center justify-center">Attempt not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-indigo-600 hover:text-indigo-800"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{attempt.challenge_title}</h1>
              <p className="text-gray-600 mt-1">
                Submitted by: {attempt.candidate_name || user?.name}
              </p>
              <p className="text-gray-500 text-sm">
                Submitted on: {new Date(attempt.submitted_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {generatingReport ? 'Generating...' : 'Download PDF Report'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Score</div>
              <div className="text-2xl font-bold text-indigo-600">{attempt.score}%</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Passed</div>
              <div className="text-2xl font-bold text-green-600">{attempt.passed}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Failed</div>
              <div className="text-2xl font-bold text-red-600">{attempt.failed}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Execution Time</div>
              <div className="text-2xl font-bold text-gray-600">{attempt.execution_time_ms}ms</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Submitted Code</h2>
          {user?.role === 'admin' ? (
            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm max-h-96">
              {attempt.code}
            </pre>
          ) : (
            <div className="bg-gray-100 p-4 rounded text-center text-gray-500">
              <p className="text-sm">🔒 Code is hidden. Only admins can view submitted code.</p>
            </div>
          )}
        </div>

        {attempt.output && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Output</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {attempt.output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttemptDetail;

