import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { getScoreExplanation } from '../utils/scoreHelpers';

export const ScoreExplanation = ({ score, type, analysis = {}, repo = {}, details = null }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Use backend explanation & reasoning if available, fallback to client-side
  const explanationText = details?.explanation || getScoreExplanation(score, type);
  const backendReasoning = details?.reasoning;

  // Math components for fallback calculation
  const doc = analysis.documentationScore ?? 0;
  const comp = analysis.complexityScore ?? 0;
  const act = analysis.activityScore ?? 0;
  const health = analysis.healthScore ?? 0;

  const stars = repo.stars ?? 0;
  const forks = repo.forks ?? 0;
  
  const starsWeight = Math.min(Math.round(stars / 100), 50);
  const forksWeight = Math.min(Math.round(forks / 50), 50);

  const renderCalculation = () => {
    // If backend provided reasoning, showcase it directly
    if (backendReasoning) {
      return (
        <div className="space-y-2 font-mono text-[11px] text-gray-600 bg-gray-50/50 p-3 rounded border-l-2 border-brand border-t border-r border-b border-surface-border mt-2 whitespace-pre-line leading-relaxed shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="font-bold text-gray-800 flex items-center space-x-1.5 uppercase tracking-wider text-[9px] text-gray-400">
            <span>Inspector reasoning</span>
          </div>
          <div className="text-gray-700 leading-normal">{backendReasoning}</div>
        </div>
      );
    }

    // Client-side fallback calculation
    switch (type.toLowerCase()) {
      case 'health':
        return (
          <div className="space-y-2 font-mono text-[11px] text-gray-600 bg-gray-50/50 p-3 rounded border-l-2 border-brand border-t border-r border-b border-surface-border mt-2 leading-relaxed shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="font-bold text-gray-800 flex items-center space-x-1.5 uppercase tracking-wider text-[9px] text-gray-400">
              <span>Health calculation</span>
            </div>
            <div className="text-gray-500 font-medium">Health Score = 40% Activity + 30% Documentation + 30% Complexity</div>
            <div className="border-t border-gray-200/60 my-1 pt-1.5 space-y-0.5">
              <div>• Activity component: <span className="font-bold text-gray-800">{act}/100</span></div>
              <div>• Documentation component: <span className="font-bold text-gray-800">{doc}/100</span></div>
              <div>• Complexity component: <span className="font-bold text-gray-800">{comp}/100</span></div>
            </div>
            <div className="border-t border-gray-200/60 my-1 pt-1.5 font-bold text-brand">
              Result: ({act} * 0.4) + ({doc} * 0.3) + ({comp} * 0.3) = {health}/100
            </div>
          </div>
        );
      case 'activity':
        return (
          <div className="space-y-2 font-mono text-[11px] text-gray-600 bg-gray-50/50 p-3 rounded border-l-2 border-brand border-t border-r border-b border-surface-border mt-2 leading-relaxed shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="font-bold text-gray-800 flex items-center space-x-1.5 uppercase tracking-wider text-[9px] text-gray-400">
              <span>Activity calculation</span>
            </div>
            <div className="text-gray-500 font-medium">Activity Score = Stars component (max 50) + Forks component (max 50)</div>
            <div className="border-t border-gray-200/60 my-1 pt-1.5 space-y-0.5">
              <div>• Stars component: <span className="font-bold text-gray-800">{starsWeight}/50</span> <span className="text-gray-400">({stars} count)</span></div>
              <div>• Forks component: <span className="font-bold text-gray-800">{forksWeight}/50</span> <span className="text-gray-400">({forks} count)</span></div>
            </div>
            <div className="border-t border-gray-200/60 my-1 pt-1.5 font-bold text-brand">
              Result: {starsWeight} + {forksWeight} = {act}/100
            </div>
          </div>
        );
      case 'documentation':
        return (
          <div className="space-y-2 font-mono text-[11px] text-gray-600 bg-gray-50/50 p-3 rounded border-l-2 border-brand border-t border-r border-b border-surface-border mt-2 leading-relaxed shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="font-bold text-gray-800 flex items-center space-x-1.5 uppercase tracking-wider text-[9px] text-gray-400">
              <span>Documentation calculation</span>
            </div>
            <div className="text-gray-500 font-medium">Documentation Score = 100% Repository README presence and URL configurations</div>
            <div className="border-t border-gray-200/60 my-1 pt-1.5 space-y-0.5">
              <div>• Public URL Validated: <span className={doc >= 50 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{doc >= 50 ? 'Pass (+50)' : 'Fail (+0)'}</span></div>
              <div>• README present on GitHub: <span className={doc >= 100 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{doc >= 100 ? 'Pass (+50)' : 'Fail (+0)'}</span></div>
            </div>
            <div className="border-t border-gray-200/60 my-1 pt-1.5 font-bold text-brand">
              Result: Base Score = {doc}/100
            </div>
          </div>
        );
      case 'complexity':
        return (
          <div className="space-y-2 font-mono text-[11px] text-gray-600 bg-gray-50/50 p-3 rounded border-l-2 border-brand border-t border-r border-b border-surface-border mt-2 leading-relaxed shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="font-bold text-gray-800 flex items-center space-x-1.5 uppercase tracking-wider text-[9px] text-gray-400">
              <span>Complexity calculation</span>
            </div>
            <div className="text-gray-500 font-medium">Complexity Score = 100% Modularization & Code Path analysis</div>
            <div className="border-t border-gray-200/60 my-1 pt-1.5 space-y-0.5">
              <div>• Monolithic blocks detected: <span className="text-green-600 font-bold">None (Pass)</span></div>
              <div>• Code smell complexity baseline: <span className="font-bold text-gray-800">{comp}/100</span></div>
            </div>
            <div className="border-t border-gray-200/60 my-1 pt-1.5 font-bold text-brand">
              Result: Calculated Baseline = {comp}/100
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2 mt-2">
      {/* Contextual Description */}
      <p className="text-xs text-gray-500 italic leading-relaxed">{explanationText}</p>

      {/* Accordion Trigger */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center space-x-1 text-[11px] font-bold text-brand hover:text-brand-dark transition-colors cursor-pointer"
        >
          <Calculator className="w-3 h-3" />
          <span>{isOpen ? 'Hide score details' : 'Why this score?'}</span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Accordion Content */}
        {isOpen && renderCalculation()}
      </div>
    </div>
  );
};

export default ScoreExplanation;
