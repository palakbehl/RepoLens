import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  MessageSquare, 
  RefreshCw, 
  Clipboard, 
  Check, 
  Info, 
  GitBranch, 
  CheckCircle2 
} from 'lucide-react';

export const AIReview = ({ repositoryId, initialReview = null }) => {
  const [review, setReview] = useState(initialReview);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedSection, setCopiedSection] = useState(null);

  useEffect(() => {
    setReview(initialReview);
  }, [initialReview]);

  const handleGenerateReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.generateAIReview(repositoryId);
      setReview(response);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data || 
        err.message || 
        'Failed to generate review. Ensure your Gemini API Key is configured in appsettings.json.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text, sectionKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  const getRiskBadgeStyles = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
      default:
        return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const getReviewData = () => {
    if (!review) return null;

    // Direct mapping to the 6 fields and risk level
    return {
      overall: review.overallReview || '',
      codeSmells: review.codeSmells || '',
      security: review.securityIssues || '',
      architecture: review.architectureObservations || '',
      refactoring: review.refactoringSuggestions || '',
      maintainability: review.maintainabilityRecommendations || '',
      riskLevel: review.riskLevel || 'Low',
    };
  };

  const renderFormattedContent = (text) => {
    if (!text) return null;

    // Helper to format inline code (`text`) and bold (**text**)
    const formatInline = (str) => {
      const boldParts = str.split(/(\*\*.*?\*\*)/g);
      return boldParts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={idx} className="font-extrabold text-gray-900">
              {formatCode(boldText)}
            </strong>
          );
        }
        return <React.Fragment key={idx}>{formatCode(part)}</React.Fragment>;
      });
    };

    const formatCode = (str) => {
      const codeParts = str.split(/(`.*?`)/g);
      return codeParts.map((part, idx) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          const codeText = part.slice(1, -1);
          return (
            <code key={idx} className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded font-mono text-[11.5px] text-gray-800 font-medium">
              {codeText}
            </code>
          );
        }
        return part;
      });
    };

    // Split by lines and parse structured blocks
    const lines = text.split('\n');
    const parsedElements = [];
    let currentCodeBlock = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        if (currentCodeBlock !== null) {
          // Close current code block
          parsedElements.push({
            type: 'codeblock',
            language: currentCodeBlock.language,
            content: currentCodeBlock.lines.join('\n')
          });
          currentCodeBlock = null;
        } else {
          // Open a new code block
          const language = trimmed.slice(3).trim();
          currentCodeBlock = { language, lines: [] };
        }
        continue;
      }

      if (currentCodeBlock !== null) {
        currentCodeBlock.lines.push(line);
        continue;
      }

      // Normal parsing
      if (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•')) {
        const content = trimmed.replace(/^[*•-]\s*/, '');
        parsedElements.push({ type: 'bullet', content });
      } else if (/^\d+\.\s+/.test(trimmed)) {
        const num = trimmed.match(/^(\d+)\.\s+/)[1];
        const content = trimmed.replace(/^\d+\.\s+/, '');
        parsedElements.push({ type: 'number', num, content });
      } else if (trimmed === '') {
        parsedElements.push({ type: 'empty' });
      } else {
        parsedElements.push({ type: 'paragraph', content: line });
      }
    }

    // If still in code block at end of text, close it
    if (currentCodeBlock !== null) {
      parsedElements.push({
        type: 'codeblock',
        language: currentCodeBlock.language,
        content: currentCodeBlock.lines.join('\n')
      });
    }

    return (
      <div className="space-y-1.5">
        {parsedElements.map((el, idx) => {
          if (el.type === 'codeblock') {
            return (
              <div key={idx} className="relative my-3 group font-mono text-[12px] bg-slate-950 text-slate-200 border border-slate-800 rounded-lg overflow-hidden select-text shadow-sm">
                <div className="flex justify-between items-center px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                  <span>{el.language || 'code'}</span>
                  <button
                    onClick={() => handleCopyToClipboard(el.content, `code-${idx}`)}
                    className="hover:text-slate-200 transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedSection === `code-${idx}` ? (
                      <>
                        <Check className="w-3 h-3 text-green-500" />
                        <span className="text-green-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-3 h-3 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto leading-relaxed select-text">
                  <code>{el.content}</code>
                </pre>
              </div>
            );
          }

          if (el.type === 'bullet') {
            return (
              <div key={idx} className="flex items-start space-x-2.5 text-sm text-gray-600 leading-relaxed ml-2 my-1">
                <span className="text-brand font-bold mt-2.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand" />
                <span className="flex-1">{formatInline(el.content)}</span>
              </div>
            );
          }

          if (el.type === 'number') {
            return (
              <div key={idx} className="flex items-start space-x-2 text-sm text-gray-600 leading-relaxed ml-2 my-1">
                <span className="text-brand font-bold text-xs mt-0.5 flex-shrink-0 w-4 font-mono">{el.num}.</span>
                <span className="flex-1">{formatInline(el.content)}</span>
              </div>
            );
          }

          if (el.type === 'empty') {
            return <div key={idx} className="h-1" />;
          }

          return (
            <p key={idx} className="text-sm text-gray-600 leading-relaxed my-1">
              {formatInline(el.content)}
            </p>
          );
        })}
      </div>
    );
  };

  const parsed = getReviewData();

  if (loading) {
    return (
      <div className="bg-white border border-surface-border rounded-lg p-12 shadow-sm space-y-6">
        <LoadingSpinner message="Gemini is reviewing repository files, checking code practices, and detecting security smells..." />
        <p className="text-center text-xs text-gray-400 max-w-md mx-auto">
          This process issues real requests to Google Gemini. It may take up to a minute to complete.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-start space-x-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Failed to generate AI Review</h4>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {parsed ? (
        <div className="space-y-6">
          {/* Header Action to regenerate */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-surface-border p-4 rounded-lg shadow-sm gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-500">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span>AI Analysis completed.</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskBadgeStyles(parsed.riskLevel)}`}>
                Risk Level: {parsed.riskLevel}
              </span>
            </div>
            <button
              onClick={handleGenerateReview}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-surface-border bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
              <span>Regenerate Review</span>
            </button>
          </div>

          {/* Cards Grid/Stack */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Overall Review */}
            <div className="bg-white border border-surface-border rounded-lg p-6 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-50 text-brand rounded">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Overall Review</h3>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Summary generated by AI</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyToClipboard(parsed.overall, 'overall')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 border border-surface-border rounded bg-white hover:bg-gray-50 text-xs text-gray-600 font-medium transition-colors cursor-pointer"
                >
                  {copiedSection === 'overall' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5 text-gray-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="border-t border-gray-100 my-2"></div>
              <div className="pt-2">
                {renderFormattedContent(parsed.overall) || <p className="text-sm text-gray-400">No overall review generated.</p>}
              </div>
            </div>

            {/* Code Smells */}
            <div className="bg-white border border-surface-border rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Code Smells</h3>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Detected issues and maintainability concerns</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyToClipboard(parsed.codeSmells, 'codeSmells')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 border border-surface-border rounded bg-white hover:bg-gray-50 text-xs text-gray-600 font-medium transition-colors cursor-pointer"
                >
                  {copiedSection === 'codeSmells' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5 text-gray-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="border-t border-gray-100 my-2"></div>
              <div className="pt-2">
                {renderFormattedContent(parsed.codeSmells) || <p className="text-sm text-gray-400">No code smells detected.</p>}
              </div>
            </div>

            {/* Security Issues */}
            <div className="bg-white border border-surface-border rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-red-50 text-red-600 rounded">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Security Issues</h3>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Potential security observations</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyToClipboard(parsed.security, 'security')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 border border-surface-border rounded bg-white hover:bg-gray-50 text-xs text-gray-600 font-medium transition-colors cursor-pointer"
                >
                  {copiedSection === 'security' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5 text-gray-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="border-t border-gray-100 my-2"></div>
              <div className="pt-2">
                {renderFormattedContent(parsed.security) || <p className="text-sm text-gray-400">No security issues detected.</p>}
              </div>
            </div>

            {/* Architecture Observations */}
            <div className="bg-white border border-surface-border rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Architecture Observations</h3>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Separation of concerns and design pattern feedback</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyToClipboard(parsed.architecture, 'architecture')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 border border-surface-border rounded bg-white hover:bg-gray-50 text-xs text-gray-600 font-medium transition-colors cursor-pointer"
                >
                  {copiedSection === 'architecture' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5 text-gray-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="border-t border-gray-100 my-2"></div>
              <div className="pt-2">
                {renderFormattedContent(parsed.architecture) || <p className="text-sm text-gray-400">No architectural observations recorded.</p>}
              </div>
            </div>

            {/* Refactoring Suggestions */}
            <div className="bg-white border border-surface-border rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-green-50 text-green-600 rounded">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Refactoring Suggestions</h3>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Recommended improvements</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyToClipboard(parsed.refactoring, 'refactoring')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 border border-surface-border rounded bg-white hover:bg-gray-50 text-xs text-gray-600 font-medium transition-colors cursor-pointer"
                >
                  {copiedSection === 'refactoring' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5 text-gray-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="border-t border-gray-100 my-2"></div>
              <div className="pt-2">
                {renderFormattedContent(parsed.refactoring) || <p className="text-sm text-gray-400">No refactoring suggestions recorded.</p>}
              </div>
            </div>

            {/* Maintainability Recommendations */}
            <div className="bg-white border border-surface-border rounded-lg p-6 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-teal-50 text-teal-600 rounded">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Maintainability Recommendations</h3>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Test coverage, packaging, and quality advice</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyToClipboard(parsed.maintainability, 'maintainability')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 border border-surface-border rounded bg-white hover:bg-gray-50 text-xs text-gray-600 font-medium transition-colors cursor-pointer"
                >
                  {copiedSection === 'maintainability' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5 text-gray-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="border-t border-gray-100 my-2"></div>
              <div className="pt-2">
                {renderFormattedContent(parsed.maintainability) || <p className="text-sm text-gray-400">No maintainability recommendations recorded.</p>}
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Polished Empty State */
        <div className="bg-white border border-surface-border rounded-lg p-16 text-center shadow-sm space-y-5">
          <div className="bg-brand-light p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-brand">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">No AI review has been generated yet</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Request an AI-powered code architecture review using Google Gemini. It will identify architectural smells, security issues, and provide refactoring suggestions.
            </p>
          </div>
          <button
            onClick={handleGenerateReview}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand hover:bg-brand-dark text-white rounded text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Review</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AIReview;
