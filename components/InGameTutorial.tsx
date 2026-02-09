import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle, MousePointerClick } from 'lucide-react';

export type TutorialStep =
  | 'welcome'
  | 'look-around'
  | 'click-evidence'
  | 'read-evidence'
  | 'pin-evidence'
  | 'create-link'
  | 'verify-connection'
  | 'complete';

interface TutorialStepConfig {
  id: TutorialStep;
  title: string;
  description: string;
  hint?: string;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  actionRequired?: string;
  allowManualAdvance?: boolean;
  canSkip?: boolean;
}

const TUTORIAL_STEPS: TutorialStepConfig[] = [
  {
    id: 'welcome',
    title: 'Welcome, Detective',
    description: 'You\'ve been assigned a case. Your investigation board contains all the evidence you need to solve it. Let me show you how to investigate.',
    position: 'center',
    canSkip: true
  },
  {
    id: 'look-around',
    title: 'Survey the Evidence',
    description: 'Use your mouse to drag and pan around the board. Scroll to zoom in and out. Take a moment to see what evidence is available.',
    hint: 'Try dragging your mouse across the screen now, or continue when ready',
    position: 'top-left',
    actionRequired: 'Pan the camera to continue',
    allowManualAdvance: true
  },
  {
    id: 'click-evidence',
    title: 'Examine Evidence',
    description: 'Click on any piece of evidence to inspect it closely. Each item contains clues that will help solve the case.',
    hint: 'Click on an evidence item to continue',
    position: 'top-left',
    actionRequired: 'Click any evidence item'
  },
  {
    id: 'read-evidence',
    title: 'Read Carefully',
    description: 'Pay close attention to names, dates, locations, and relationships. These details connect the evidence together.',
    hint: 'Look for important details in the evidence',
    position: 'bottom-center',
    actionRequired: 'Click elsewhere or press ESC when done reading'
  },
  {
    id: 'pin-evidence',
    title: 'Pin Important Clues',
    description: 'Found something important? Pin it to keep track! Click the pin icon on any evidence you want to highlight.',
    hint: 'Try pinning the evidence item you just examined',
    position: 'top-right',
    actionRequired: 'Pin an evidence item'
  },
  {
    id: 'create-link',
    title: 'Connect the Dots',
    description: 'Now for the real detective work: creating connections. Use the link tool, then click two related pieces of evidence to connect them.',
    hint: 'If you already made a connection, you can continue. Otherwise, link two items that share a person, date, or location.',
    position: 'top-left',
    actionRequired: 'Create a connection between evidence',
    allowManualAdvance: true
  },
  {
    id: 'verify-connection',
    title: 'Build the Case',
    description: 'Keep connecting evidence until you\'ve built a complete chain proving who committed the crime. The connections must follow logical rules.',
    hint: 'Create more connections to build your case. When you have enough valid connections, the case will be solved!',
    position: 'bottom-right'
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    description: 'You now know the basics of investigation. Remember: read everything carefully, look for patterns, and trust the evidence. Good luck, Detective!',
    position: 'center',
    canSkip: false
  }
];

interface InGameTutorialProps {
  currentStep: TutorialStep;
  onStepComplete: (step: TutorialStep) => void;
  onSkipTutorial: () => void;
  visible: boolean;
}

export default function InGameTutorial({
  currentStep,
  onStepComplete,
  onSkipTutorial,
  visible
}: InGameTutorialProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed) return null;

  const stepConfig = TUTORIAL_STEPS.find(s => s.id === currentStep);
  if (!stepConfig) return null;

  const handleNext = () => {
    const currentIndex = TUTORIAL_STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < TUTORIAL_STEPS.length - 1) {
      onStepComplete(currentStep);
    } else {
      // Tutorial complete
      setDismissed(true);
      onStepComplete('complete');
    }
  };

  const handleSkip = () => {
    setDismissed(true);
    onSkipTutorial();
  };

  const getPositionClasses = () => {
    switch (stepConfig.position) {
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      case 'top-left':
        return 'top-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'bottom-left':
        return 'bottom-24 left-6';
      case 'bottom-right':
        return 'bottom-24 right-6';
      case 'bottom-center':
        return 'bottom-24 left-1/2 -translate-x-1/2';
      default:
        return 'top-6 left-6';
    }
  };

  const currentIndex = TUTORIAL_STEPS.findIndex(s => s.id === currentStep);
  const isLastStep = currentIndex === TUTORIAL_STEPS.length - 1;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Spotlight effect - dim everything except tutorial */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Tutorial card */}
      <div className={`absolute ${getPositionClasses()} pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-500`}>
        <div className="bg-slate-900/95 rounded-lg shadow-2xl border border-slate-600 max-w-md">
          {/* Header */}
          <div className="flex justify-between items-start p-4 border-b border-slate-700">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">
                  Step {currentIndex + 1} of {TUTORIAL_STEPS.length}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-100">{stepConfig.title}</h3>
            </div>
            {stepConfig.canSkip && (
              <button
                onClick={handleSkip}
                className="text-slate-400 hover:text-slate-100 transition-colors ml-2"
                title="Skip tutorial"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <p className="text-slate-200 leading-relaxed">
              {stepConfig.description}
            </p>

            {stepConfig.hint && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-start gap-2">
                <MousePointerClick size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-200">
                  {stepConfig.hint}
                </p>
              </div>
            )}

            {stepConfig.actionRequired && (
              <div className="bg-amber-950/40 border border-amber-700/60 rounded-lg p-2 px-3">
                <p className="text-xs text-amber-200 font-semibold tracking-wide uppercase">
                  ⏳ {stepConfig.actionRequired}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 pt-0 flex justify-between items-center">
            <div className="flex gap-1">
              {TUTORIAL_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all ${idx <= currentIndex
                    ? 'bg-amber-500 w-8'
                    : 'bg-slate-700 w-4'
                    }`}
                />
              ))}
            </div>

            {(!stepConfig.actionRequired || stepConfig.allowManualAdvance) && (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 rounded-md transition-colors font-semibold text-sm shadow-sm active:translate-y-[1px]"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle size={16} />
                    Got it!
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Pointer arrow for non-center positions */}
        {stepConfig.position !== 'center' && (
          <div className="absolute -z-10">
            {/* Visual indicator pointing to relevant UI */}
            {stepConfig.position === 'top-left' && (
              <div className="absolute top-full left-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-900/95" />
            )}
            {stepConfig.position === 'top-right' && (
              <div className="absolute top-full right-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-900/95" />
            )}
            {stepConfig.position === 'bottom-center' && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-slate-900/95" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
