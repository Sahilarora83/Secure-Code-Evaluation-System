import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const challengesRes = await api.get('/challenges');
      setChallenges(challengesRes.data.challenges);
      
      // Try to fetch statistics, but don't fail if it errors
      try {
        const statsRes = await api.get('/leaderboard/statistics');
        setStatistics(statsRes.data.statistics);
      } catch (statsError) {
        console.log('Statistics not available:', statsError);
        // Continue without statistics
      }
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallenge = async (id) => {
    if (!window.confirm('Are you sure you want to delete this challenge?')) {
      return;
    }

    try {
      await api.delete(`/challenges/${id}`);
      toast.success('Challenge deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete challenge');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-indigo-600">Admin Panel</h1>
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-800">
                Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
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
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-sm text-gray-600">Total Challenges</div>
              <div className="text-2xl font-bold text-indigo-600">{statistics.total_challenges}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-sm text-gray-600">Total Attempts</div>
              <div className="text-2xl font-bold text-green-600">{statistics.total_attempts}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-sm text-gray-600">Active Candidates</div>
              <div className="text-2xl font-bold text-blue-600">{statistics.total_candidates}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-sm text-gray-600">Average Score</div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(statistics.average_score || 0)}%
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Challenges</h2>
          <Link
            to="/admin/challenges/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Create Challenge
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {challenges.map((challenge) => (
                  <tr key={challenge.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/challenge/${challenge.id}`}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        {challenge.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {challenge.language}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(challenge.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        to={`/leaderboard/challenge/${challenge.id}`}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        Leaderboard
                      </Link>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleDeleteChallenge(challenge.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
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

export default AdminDashboard;

