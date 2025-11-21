import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const CandidateDashboard = () => {
  const [challenges, setChallenges] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [challengesRes, statsRes] = await Promise.all([
        api.get('/challenges'),
        api.get('/candidate/my-stats')
      ]);
      setChallenges(challengesRes.data.challenges);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getChallengeStatus = (challengeId) => {
    if (!stats || !stats.challenges) return null;
    const challengeData = stats.challenges.find(c => c.challenge_id === challengeId);
    return challengeData;
  };

  const getStatusBadge = (challengeData) => {
    if (!challengeData || challengeData.attempt_count === '0') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
          Not Attempted
        </span>
      );
    }
    
    const bestScore = parseInt(challengeData.best_score) || 0;
    if (bestScore === 100) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
          ✅ Perfect Score
        </span>
      );
    } else if (bestScore >= 50) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
          ⚠️ {bestScore}%
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
          ❌ {bestScore}%
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">Code Evaluation</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && stats.statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-sm text-gray-600">Total Attempts</div>
              <div className="text-2xl font-bold text-indigo-600">{stats.statistics.total_attempts || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-sm text-gray-600">Challenges Attempted</div>
              <div className="text-2xl font-bold text-green-600">{stats.statistics.challenges_attempted || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-sm text-gray-600">Best Score</div>
              <div className="text-2xl font-bold text-blue-600">{stats.statistics.best_score || 0}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-sm text-gray-600">Average Score</div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(stats.statistics.average_score || 0)}%
              </div>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Challenges</h2>

        {loading ? (
          <div className="text-center py-12">Loading challenges...</div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No challenges available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => {
              const challengeData = getChallengeStatus(challenge.id);
              const attemptCount = challengeData ? parseInt(challengeData.attempt_count) : 0;
              
              return (
                <Link
                  key={challenge.id}
                  to={`/challenge/${challenge.id}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-indigo-500"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {challenge.title}
                      </h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                          {challenge.language}
                        </span>
                        {getStatusBadge(challengeData)}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {challenge.description}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Created: {new Date(challenge.created_at).toLocaleDateString()}</span>
                      {challenge.duration_minutes && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                          ⏱️ {challenge.duration_minutes} min
                        </span>
                      )}
                    </div>
                    
                    {attemptCount > 0 && challengeData && (
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-gray-600">
                          Attempts: <span className="font-semibold">{attemptCount}</span>
                        </span>
                        {challengeData.best_score && (
                          <span className="text-indigo-600 font-semibold">
                            Best: {challengeData.best_score}%
                          </span>
                        )}
                        {challengeData.last_attempt && (
                          <span className="text-gray-500">
                            Last: {new Date(challengeData.last_attempt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {attemptCount === 0 && (
                      <div className="text-center mt-2">
                        <span className="text-xs text-gray-400 italic">Click to start challenge</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDashboard;

