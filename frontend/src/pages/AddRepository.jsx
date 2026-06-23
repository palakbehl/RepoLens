import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const GitHubIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    width="100%"
    height="100%"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export const AddRepository = () => {
  const navigate = useNavigate();
  const [gitHubUrl, setGitHubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gitHubUrl.trim()) return;

    // Basic validation
    if (!gitHubUrl.includes('github.com')) {
      setError('Please provide a valid GitHub repository URL (e.g., https://github.com/owner/repo)');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.addRepository(gitHubUrl.trim());
      setSuccess(response);
      setGitHubUrl('');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data || err.message || 'An error occurred while adding the repository. Ensure it is public and valid.';
      setError(typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back navigation */}
      <button
        onClick={() => navigate('/repositories')}
        className="flex items-center space-x-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Repositories</span>
      </button>

      {/* Form Container */}
      <div className="bg-white border border-surface-border rounded-lg shadow-sm p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add Repository</h1>
          <p className="text-sm text-gray-500 mt-1">Connect a public GitHub repository to perform intelligence analysis and AI code review.</p>
        </div>

        {/* Success Card */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-5 rounded-lg space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Repository connected successfully!</h4>
                <p className="text-xs text-green-700 mt-1">
                  Analysis completed for <span className="font-semibold">{success.owner}/{success.name}</span>.
                </p>
              </div>
            </div>
            <div className="flex space-x-3 pt-1">
              <button
                onClick={() => navigate(`/repositories/${success.id}`)}
                className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                View Repository details
              </button>
              <button
                onClick={() => setSuccess(null)}
                className="px-3.5 py-1.5 border border-green-200 bg-white hover:bg-green-100 text-green-800 rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Connect another repo
              </button>
            </div>
          </div>
        )}

        {/* Error Card */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Failed to connect repository</h4>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && !loading && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="repoUrl" className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                GitHub Repository URL
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <GitHubIcon className="w-4 h-4" />
                </span>
                <input
                  id="repoUrl"
                  type="url"
                  required
                  placeholder="https://github.com/facebook/react"
                  value={gitHubUrl}
                  onChange={(e) => setGitHubUrl(e.target.value)}
                  className="w-full bg-surface-alt border border-surface-border rounded pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:bg-white transition-colors"
                />
              </div>
              <span className="text-xs text-gray-400">Must be a public, valid GitHub repository. Private repositories are not supported yet.</span>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-brand hover:bg-brand-dark text-white rounded text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Analyze Repository
            </button>
          </form>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-8">
            <LoadingSpinner message="Cloning, indexing, and calculating repository health scores..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default AddRepository;
