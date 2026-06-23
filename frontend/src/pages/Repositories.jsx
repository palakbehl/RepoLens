import React, { useEffect, useState } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { Plus, Eye, Play, Sparkles, AlertCircle, FolderGit } from 'lucide-react';

export const Repositories = () => {
  const { registerRefreshHandler } = useOutletContext();
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState({});

  const fetchRepositories = async () => {
    try {
      setError(null);
      const repos = await apiService.getRepositories();
      
      const reposWithAnalysis = await Promise.all(
        repos.map(async (repo) => {
          try {
            const analysis = await apiService.getLatestAnalysis(repo.id);
            return { ...repo, analysis };
          } catch (e) {
            return { ...repo, analysis: null };
          }
        })
      );
      setRepositories(reposWithAnalysis);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch repositories. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
    registerRefreshHandler(fetchRepositories);
  }, []);

  const handleRunAnalysis = async (repoId) => {
    setAnalysisStatus((prev) => ({ ...prev, [repoId]: 'running' }));
    try {
      // Trigger backend calculation
      await apiService.analyzeRepository(repoId);
      
      // Fetch new calculation results
      const latest = await apiService.getLatestAnalysis(repoId);
      setRepositories((prev) =>
        prev.map((r) => (r.id === repoId ? { ...r, analysis: latest } : r))
      );
      setAnalysisStatus((prev) => ({ ...prev, [repoId]: 'success' }));
      setTimeout(() => {
        setAnalysisStatus((prev) => ({ ...prev, [repoId]: null }));
      }, 2000);
    } catch (err) {
      console.error(err);
      setAnalysisStatus((prev) => ({ ...prev, [repoId]: 'error' }));
      setTimeout(() => {
        setAnalysisStatus((prev) => ({ ...prev, [repoId]: null }));
      }, 2000);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Fetching repositories..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">Error: </span>
          <span>{error}</span>
        </div>
        <button
          onClick={fetchRepositories}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Repositories</h1>
          <p className="text-sm text-gray-500 mt-1">All your connected repositories and their health statuses</p>
        </div>
        <Link
          to="/repositories/add"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded text-sm font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Repository</span>
        </Link>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-surface-border rounded-lg shadow-sm overflow-hidden">
        {repositories.length > 0 ? (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-sm text-gray-500 border-collapse">
              <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-surface-border z-10">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Repository</th>
                  <th scope="col" className="px-6 py-3.5">Owner</th>
                  <th scope="col" className="px-6 py-3.5">Language</th>
                  <th scope="col" className="px-6 py-3.5">Stars</th>
                  <th scope="col" className="px-6 py-3.5">Forks</th>
                  <th scope="col" className="px-6 py-3.5">Health Score</th>
                  <th scope="col" className="px-6 py-3.5">Last Analyzed</th>
                  <th scope="col" className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {repositories.map((repo) => {
                  const hasAnalysis = repo.analysis !== null;
                  const isRunning = analysisStatus[repo.id] === 'running';
                  const isSuccess = analysisStatus[repo.id] === 'success';

                  return (
                    <tr key={repo.id} className="hover:bg-gray-50/55 transition-colors duration-150">
                      {/* Name + Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1.5">
                          <Link to={`/repositories/${repo.id}`} className="hover:text-brand hover:underline font-bold text-gray-900">
                            {repo.owner}/{repo.name}
                          </Link>
                          {hasAnalysis && (
                            <div className="mt-0.5">
                              <StatusBadge score={repo.analysis.healthScore} />
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Owner */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                        {repo.owner}
                      </td>
                      {/* Language */}
                      <td className="px-6 py-4 text-xs font-bold text-gray-400">
                        <span className="px-2 py-0.5 bg-gray-100 border border-gray-200/60 rounded text-[10px]">
                          {repo.primaryLanguage || 'Unknown'}
                        </span>
                      </td>
                      {/* Stars */}
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm font-medium">
                        {repo.stars.toLocaleString()}
                      </td>
                      {/* Forks */}
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm font-medium">
                        {repo.forks.toLocaleString()}
                      </td>
                      {/* Health Score */}
                      <td className="px-6 py-4 font-medium">
                        {hasAnalysis ? (
                          <div className="flex items-baseline space-x-0.5 font-mono text-sm">
                            <span className="font-bold text-gray-800">{repo.analysis.healthScore}</span>
                            <span className="text-gray-400 text-xs">/100</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Pending</span>
                        )}
                      </td>
                      {/* Last Analyzed */}
                      <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                        {hasAnalysis ? (
                          new Date(repo.analysis.analyzedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                        ) : (
                          <span className="italic text-gray-400">Never</span>
                        )}
                      </td>
                      {/* Actions with CSS tooltips */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {/* View Details */}
                          <div className="relative group">
                            <Link
                              to={`/repositories/${repo.id}`}
                              className="p-1.5 border border-surface-border rounded bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors flex items-center justify-center hover:shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2.5 py-1 rounded whitespace-nowrap z-50 pointer-events-none font-semibold shadow-sm">
                              View Details
                            </div>
                          </div>

                          {/* Run Analysis */}
                          <div className="relative group">
                            <button
                              onClick={() => handleRunAnalysis(repo.id)}
                              disabled={isRunning}
                              className={`p-1.5 border border-surface-border rounded bg-white hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center hover:shadow-sm ${
                                isRunning ? 'bg-blue-50 text-brand border-brand/20' :
                                isSuccess ? 'bg-green-50 text-green-600 border-green-200' :
                                'text-gray-400 hover:text-gray-900'
                              }`}
                            >
                              <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2.5 py-1 rounded whitespace-nowrap z-50 pointer-events-none font-semibold shadow-sm">
                              {isRunning ? 'Running...' : 'Run Analysis'}
                            </div>
                          </div>

                          {/* Generate AI Review */}
                          <div className="relative group">
                            <button
                              onClick={() => navigate(`/repositories/${repo.id}?tab=review`)}
                              className="p-1.5 border border-surface-border rounded bg-white hover:bg-gray-50 text-gray-400 hover:text-brand transition-colors cursor-pointer flex items-center justify-center hover:shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2.5 py-1 rounded whitespace-nowrap z-50 pointer-events-none font-semibold shadow-sm">
                              Generate AI Review
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Polished Empty State */
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-gray-50 p-5 rounded-full border border-surface-border text-gray-400">
              <FolderGit className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">No repositories analyzed yet</h3>
              <p className="text-sm text-gray-500 max-w-sm">Connect your first GitHub repository to begin analysis.</p>
            </div>
            <Link
              to="/repositories/add"
              className="inline-flex items-center space-x-1.5 px-4.5 py-2.5 bg-brand hover:bg-brand-dark text-white rounded text-sm font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Repository</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Repositories;
