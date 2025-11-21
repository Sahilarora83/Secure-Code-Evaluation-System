import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ChallengeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const fetchChallenge = useCallback(async () => {
    try {
      const response = await api.get(`/challenges/${id}`);
      setChallenge(response.data.challenge);
      
      // Set default code based on language
      const defaultCode = getDefaultCode(response.data.challenge.language);
      setCode(defaultCode);
      
      // Initialize timer if duration is set
      if (response.data.challenge.duration_minutes) {
        const durationMs = response.data.challenge.duration_minutes * 60 * 1000;
        setTimeRemaining(durationMs);
      }
    } catch (error) {
      toast.error('Failed to load challenge');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Timer countdown effect
  useEffect(() => {
    if (!timerStarted || !timeRemaining || timeRemaining <= 0) {
      if (timeRemaining === 0 && !submitting && code.trim()) {
        // Auto submit when timer expires
        const autoSubmit = async () => {
          setSubmitting(true);
          setTimerStarted(false);
          try {
            const response = await api.post('/attempts/submit', {
              code,
              challenge_id: id
            });
            toast.error('Time is up! Your code has been automatically submitted.');
            navigate(`/attempt/${response.data.attempt.id}`);
          } catch (error) {
            toast.error('Failed to auto-submit code');
          } finally {
            setSubmitting(false);
          }
        };
        autoSubmit();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStarted, timeRemaining, submitting, code, id, navigate]);

  const startTimer = () => {
    if (challenge?.duration_minutes && !timerStarted) {
      setTimerStarted(true);
      setStartTime(Date.now());
      toast.success('Timer started!');
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const getDefaultCode = (language) => {
    const defaults = {
      python: `# Write your solution here
def solution():
    pass

# Example usage
if __name__ == "__main__":
    result = solution()
    print(result)
`,
      javascript: `// Write your solution here
function solution() {
    // Your code here
    return null;
}

// Example usage
console.log(solution());
`
    };
    return defaults[language.toLowerCase()] || '';
  };

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setRunning(true);
    setRunResult(null);

    try {
      const response = await api.post('/attempts/run', {
        code,
        language: challenge.language,
        challenge_id: id
      });

      setRunResult(response.data);
      if (response.data.success) {
        toast.success(`Tests: ${response.data.passed} passed, ${response.data.failed} failed`);
      } else {
        toast.error('Execution failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to run code');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!code.trim()) {
      if (!autoSubmit) {
        toast.error('Please write some code first');
      }
      return;
    }

    if (!autoSubmit && !window.confirm('Are you sure you want to submit? This is your final submission.')) {
      return;
    }

    setSubmitting(true);
    setTimerStarted(false); // Stop timer

    try {
      const response = await api.post('/attempts/submit', {
        code,
        challenge_id: id
      });

      if (autoSubmit) {
        toast.error('Time is up! Your code has been automatically submitted.');
      } else {
        toast.success('Code submitted successfully!');
      }
      navigate(`/attempt/${response.data.attempt.id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit code');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!challenge) {
    return <div className="min-h-screen flex items-center justify-center">Challenge not found</div>;
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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{challenge.title}</h1>
            <div className="flex items-center space-x-3">
              {challenge.duration_minutes && (
                <div className={`px-4 py-2 rounded-lg font-bold ${
                  timeRemaining && timeRemaining < 60000 
                    ? 'bg-red-100 text-red-800 animate-pulse' 
                    : timeRemaining && timeRemaining < 300000
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {timerStarted && timeRemaining !== null ? (
                    <>
                      ⏱️ {formatTime(timeRemaining)}
                      {timeRemaining < 60000 && ' ⚠️'}
                    </>
                  ) : (
                    <>
                      ⏱️ {challenge.duration_minutes} min
                      {!timerStarted && (
                        <button
                          onClick={startTimer}
                          className="ml-2 px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                        >
                          Start Timer
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              <span className="px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 rounded">
                {challenge.language}
              </span>
            </div>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{challenge.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Code Editor</h2>
              <div className="space-x-2">
                <button
                  onClick={handleRun}
                  disabled={running}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {running ? 'Running...' : 'Run Code'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || running}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
            <div className="h-96">
              <Editor
                height="100%"
                language={challenge.language.toLowerCase()}
                value={code}
                onChange={setCode}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on'
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Execution Results</h2>
            {runResult ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      runResult.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {runResult.status}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Tests Passed:</span>
                    <span className="text-green-600">{runResult.passed}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Tests Failed:</span>
                    <span className="text-red-600">{runResult.failed}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="font-medium">Execution Time:</span>
                    <span>{runResult.execution_time_ms}ms</span>
                  </div>
                </div>

                {runResult.output && (
                  <div>
                    <h3 className="font-medium mb-2">Output:</h3>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                      {runResult.output}
                    </pre>
                  </div>
                )}

                {runResult.error && (
                  <div>
                    <h3 className="font-medium mb-2 text-red-600">Error:</h3>
                    <pre className="bg-red-50 p-3 rounded text-sm text-red-800 overflow-auto max-h-40">
                      {runResult.error}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-12">
                Click "Run Code" to test your solution
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetail;

