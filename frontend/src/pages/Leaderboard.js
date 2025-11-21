import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Leaderboard = () => {
  const { challenge_id } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, [challenge_id]);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get(`/leaderboard/challenge/${challenge_id}`);
      console.log('Leaderboard response:', response.data);
      
      if (response.data) {
        if (response.data.leaderboard) {
          setLeaderboard(response.data.leaderboard);
        } else {
          setLeaderboard([]);
        }
        
        if (response.data.challenge) {
          setChallenge(response.data.challenge);
        }
      } else {
        setLeaderboard([]);
      }
    } catch (error) {
      console.error('Leaderboard error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load leaderboard';
      toast.error(errorMessage);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/admin" className="text-indigo-600 hover:text-indigo-800">
                ← Back to Admin Panel
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Leaderboard</h1>
        {challenge && (
          <p className="text-gray-600 mb-6">Challenge: {challenge.title}</p>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <p className="text-gray-500">No submissions yet. Leaderboard will appear once candidates start submitting.</p>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Best Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tests Passed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Best Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((entry, index) => (
                  <tr key={entry.user_id} className={index < 3 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-lg font-bold ${
                        index === 0 ? 'text-yellow-500' : 
                        index === 1 ? 'text-gray-400' : 
                        index === 2 ? 'text-orange-600' : 
                        'text-gray-600'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{entry.candidate_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-indigo-600">{entry.best_score || 0}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-600">{entry.best_passed || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{entry.best_time || 'N/A'}ms</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{entry.total_attempts || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

