import React, { useState } from 'react';
import { ChevronDown, HelpCircle, X } from 'lucide-react';

interface HelpTip {
  title: string;
  content: string;
  category: 'controls' | 'deduction' | 'evidence' | 'strategy';
}

const HELP_TIPS: HelpTip[] = [
  {
    category: 'controls',
    title: 'How to Pan the Board',
    content: 'Click and drag your mouse to move around the investigation board. Use the scroll wheel to zoom in and out of evidence items.'
  },
  {
    category: 'controls',
    title: 'Inspecting Evidence',
    content: 'Click on any piece of evidence to focus on it. You can read documents, view photos, and examine details closely. Click elsewhere to deselect.'
  },
  {
    category: 'deduction',
    title: 'What Does "Link" Mean?',
    content: 'A link connects two pieces of evidence that are related. Links represent logical relationships—a suspect who appears in both a photo and a document, or evidence that occurred on the same date.'
  },
  {
    category: 'deduction',
    title: 'Pin Important Evidence',
    content: 'Pin evidence that feels crucial to the case. Pinned items stand out on your board, making them easier to track as you build your case.'
  },
  {
    category: 'evidence',
    title: 'Different Evidence Types',
    content: 'PHOTO: Suspects and scenes. DOCUMENT: Reports and records. AUDIO: Statements and recordings. BIOLOGICAL: Lab results. TRACE: Physical samples. DIGITAL: Messages and data.'
  },
  {
    category: 'evidence',
    title: 'Reading Between the Lines',
    content: 'Don\'t just read what\'s obvious. Look for dates, times, locations, and names that connect different pieces of evidence. The truth is in the details.'
  },
  {
    category: 'strategy',
    title: 'Start Your Investigation',
    content: '1. Examine all evidence first. 2. Note connections you see. 3. Pin the most suspicious items. 4. Create links to build your theory. 5. Verify every connection matters.'
  },
  {
    category: 'strategy',
    title: 'Stuck? Try This',
    content: 'Re-read documents carefully for names and dates. Look at suspect profiles and their statements. Check if any evidence has been overlooked. Sometimes the culprit is hiding in plain sight.'
  }
];

interface GameHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GameHelp({ isOpen, onClose }: GameHelpProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('controls');
  const [selectedTip, setSelectedTip] = useState<HelpTip | null>(null);

  const categories = ['controls', 'deduction', 'evidence', 'strategy'] as const;
  const categoryLabels = {
    controls: '🎮 Controls',
    deduction: '🔍 Deduction',
    evidence: '🔬 Evidence',
    strategy: '💡 Strategy'
  };

  const getCategoryTips = (category: string) => {
    return HELP_TIPS.filter(tip => tip.category === category);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-end z-40 pointer-events-auto">
      {/* Panel from right */}
      <div className="bg-slate-900 border-l border-slate-700 w-96 h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/50 to-slate-900 border-b border-slate-700 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HelpCircle size={20} className="text-blue-400" />
            <h3 className="font-bold text-white">Investigation Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedTip ? (
            // Single tip view
            <div className="p-4 space-y-4">
              <button
                onClick={() => setSelectedTip(null)}
                className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
              >
                ← Back to Categories
              </button>
              <div>
                <h4 className="text-lg font-bold text-slate-100 mb-2">{selectedTip.title}</h4>
                <p className="text-slate-300 leading-relaxed">{selectedTip.content}</p>
              </div>
            </div>
          ) : (
            // Categories view
            <div className="p-4 space-y-2">
              {categories.map(cat => {
                const isExpanded = expandedCategory === cat;
                const tips = getCategoryTips(cat);

                return (
                  <div key={cat} className="border border-slate-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                      className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 flex justify-between items-center transition-colors"
                    >
                      <span className="font-semibold text-slate-200">{categoryLabels[cat as keyof typeof categoryLabels]}</span>
                      <ChevronDown
                        size={18}
                        className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="bg-slate-900/50 border-t border-slate-700 divide-y divide-slate-700">
                        {tips.map((tip, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedTip(tip)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors"
                          >
                            <p className="text-sm font-medium text-slate-300 hover:text-blue-400">
                              {tip.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {tip.content}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer tip */}
        <div className="bg-slate-800/50 border-t border-slate-700 px-4 py-3 text-xs text-slate-400">
          💡 Tip: Pay attention to suspect profiles, dates, and locations—they're key to solving the case!
        </div>
      </div>
    </div>
  );
}
