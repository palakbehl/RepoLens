import React, { useState } from 'react';
import { Settings as SettingsIcon, Sliders, Key, Globe, Database, Save, Check } from 'lucide-react';

export const Settings = () => {
  const [saveStatus, setSaveStatus] = useState(false);
  const [settings, setSettings] = useState({
    apiUrl: 'http://localhost:5086/api',
    geminiModel: 'gemini-2.0-flash',
    refreshRate: '5',
    strictMode: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaveStatus(true);
    setTimeout(() => {
      setSaveStatus(false);
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure global platform integrations and analysis preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* API Settings */}
        <div className="bg-white border border-surface-border rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-surface-border flex items-center space-x-2.5">
            <Globe className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-bold text-gray-900">API Connection</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Backend API URL</label>
              <input
                type="text"
                value={settings.apiUrl}
                onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
                className="w-full bg-surface-alt border border-surface-border rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:bg-white transition-colors"
              />
              <span className="text-xs text-gray-400">The base endpoint URL of your RepoLens C# backend.</span>
            </div>
          </div>
        </div>

        {/* Gemini Settings */}
        <div className="bg-white border border-surface-border rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-surface-border flex items-center space-x-2.5">
            <Key className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-bold text-gray-900">Gemini LLM Provider</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Gemini API Model</label>
                <select
                  value={settings.geminiModel}
                  onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                  className="w-full bg-surface-alt border border-surface-border rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand focus:bg-white transition-colors"
                >
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Analysis Interval (Minutes)</label>
                <input
                  type="number"
                  value={settings.refreshRate}
                  onChange={(e) => setSettings({ ...settings, refreshRate: e.target.value })}
                  className="w-full bg-surface-alt border border-surface-border rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Preferences */}
        <div className="bg-white border border-surface-border rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-surface-border flex items-center space-x-2.5">
            <Sliders className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-bold text-gray-900">Analysis Preferences</h3>
          </div>
          <div className="p-6 space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.strictMode}
                onChange={(e) => setSettings({ ...settings, strictMode: e.target.checked })}
                className="w-4 h-4 text-brand border-surface-border rounded focus:ring-brand"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-gray-900">Enable Strict Code Smells Detection</span>
                <p className="text-xs text-gray-500">Perform deep checks for complex class structure and duplicate code segments.</p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveStatus}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:bg-green-600 disabled:opacity-90"
          >
            {saveStatus ? (
              <>
                <Check className="w-4 h-4" />
                <span>Settings Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
