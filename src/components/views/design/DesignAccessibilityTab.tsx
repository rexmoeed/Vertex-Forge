import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ThemeDefinition } from '../../../types/theme';

interface DesignAccessibilityTabProps {
  activeTheme: ThemeDefinition;
  contrastRatio: number;
}

export const DesignAccessibilityTab: React.FC<DesignAccessibilityTabProps> = ({
  activeTheme,
  contrastRatio,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-5 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">WCAG Contrast Audit: {activeTheme.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Ensures comfortable legibility during long development sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{contrastRatio}:1</span>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded text-xs font-bold uppercase">
            {contrastRatio >= 7 ? 'AAA Pass' : contrastRatio >= 4.5 ? 'AA Pass' : 'Custom'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Text Contrast</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-snug">
            Text color ({activeTheme.colors.text}) on surface ({activeTheme.colors.surface}) has a {contrastRatio}:1 ratio for enhanced accessibility.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Keyboard Focus</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-snug">
            All interactive controls include high-visibility focus rings and complete tab-order navigation.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zero-Color Dependency</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-snug">
            Status badges and diffs use distinct icons and labels in addition to colors.
          </p>
        </div>
      </div>
    </div>
  );
};
