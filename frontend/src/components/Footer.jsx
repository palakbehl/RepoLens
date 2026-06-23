import React from 'react';

export const Footer = () => {
  return (
    <footer className="mt-auto py-6 border-t border-surface-border text-center text-xs text-gray-400 font-medium">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5">
        <span>RepoLens Platform</span>
        <span className="text-gray-300">•</span>
        <span>Built With:</span>
        <div className="flex flex-wrap items-center gap-x-1.5 font-semibold text-gray-500">
          <span className="hover:text-gray-700 transition-colors">ASP.NET Core</span>
          <span className="text-gray-300 font-normal">/</span>
          <span className="hover:text-gray-700 transition-colors">PostgreSQL</span>
          <span className="text-gray-300 font-normal">/</span>
          <span className="hover:text-gray-700 transition-colors">React</span>
          <span className="text-gray-300 font-normal">/</span>
          <span className="hover:text-gray-700 transition-colors">Tailwind CSS</span>
          <span className="text-gray-300 font-normal">/</span>
          <span className="hover:text-gray-700 transition-colors">OpenRouter AI</span>
          <span className="text-gray-300 font-normal">/</span>
          <span className="hover:text-gray-700 transition-colors">GitHub API</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
