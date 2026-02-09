import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface TutorialSlide {
  title: string;
  content: string;
  tips?: string[];
  icon?: string;
}

const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: "Welcome Detective",
    content: "You are a forensic detective tasked with solving cases. Use your investigative skills to examine evidence, connect clues, and identify the culprit. Can you crack the case?",
    icon: "🔍"
  },
  {
    title: "The Investigation Board",
    content: "Start by examining the evidence scattered across your investigation board. Each item—photos, documents, lab reports—contains vital clues. Click on any item to inspect it more closely.",
    tips: [
      "Zoom in to read text on evidence items",
      "Look for patterns and relationships between evidence",
      "Items can be rotated for better viewing"
    ],
    icon: "📋"
  },
  {
    title: "Pinning Evidence",
    content: "Pin important evidence to your board by clicking the pin icon. Pinned items stay visible and highlighted, helping you track the most important clues as you work through the case.",
    tips: [
      "Start by pinning items that seem most relevant",
      "Keep your workspace organized",
      "You can pin as many items as you need"
    ],
    icon: "📌"
  },
  {
    title: "Making Connections",
    content: "The real detective work begins when you connect the dots. Click the link icon to create connections between evidence items, building a web of relationships that tells the story of what happened.",
    tips: [
      "Connect evidence that share common elements (names, dates, locations)",
      "Different types of connections reveal different relationships",
      "Follow your connections to spot patterns"
    ],
    icon: "🔗"
  },
  {
    title: "Understanding Evidence Types",
    content: "Each piece of evidence has a type:\n• PHOTO: Visual evidence and profiles\n• DOCUMENT: Written records and reports\n• AUDIO: Voice recordings and statements\n• BIOLOGICAL: Lab results and analysis\n• TRACE: Physical evidence and samples\n• DIGITAL: Data, messages, and records\n\nDifferent evidence types often connect in meaningful ways.",
    icon: "🔬"
  },
  {
    title: "Building Your Case",
    content: "As you connect evidence, you're building a logical chain. The connections must satisfy specific rules to prove who did it, how, and why. Keep track of the evidence and their relationships—they'll lead you to the solution.",
    tips: [
      "Look for multiple connections from each suspect",
      "Verify that your evidence chain is complete",
      "Challenge your assumptions if a connection doesn't feel right"
    ],
    icon: "⛓️"
  },
  {
    title: "The Deduction Process",
    content: "Your goal is to establish a complete chain of evidence that proves the culprit's identity. This requires:\n1. Finding enough evidence\n2. Connecting them logically\n3. Following the rules that govern the case\n4. Verifying your solution\n\nOnce your connections satisfy all requirements, the case is solved!",
    tips: [
      "Don't rush—examine all available evidence first",
      "Dead ends are part of the investigation; adjust your approach",
      "Trust your analysis; the evidence doesn't lie"
    ],
    icon: "🎯"
  },
  {
    title: "Tips for Success",
    content: "• Read everything carefully—details matter\n• Pay attention to dates, times, and locations\n• Look for contradictions that reveal guilt or innocence\n• Create a mental timeline of events\n• Consider motive, means, and opportunity\n• When stuck, re-examine evidence you might have missed",
    icon: "💡"
  },
  {
    title: "Ready to Start?",
    content: "You now have the knowledge to begin your investigation. Each case is unique with its own puzzles to solve. Apply your detective skills, trust the evidence, and solve the case. Good luck!",
    icon: "🔎"
  }
];

interface TutorialProps {
  onClose: () => void;
  onStartCase?: () => void;
}

export default function Tutorial({ onClose, onStartCase }: TutorialProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = TUTORIAL_SLIDES[currentSlide];
  const isFirstSlide = currentSlide === 0;
  const isLastSlide = currentSlide === TUTORIAL_SLIDES.length - 1;

  const handleNext = () => {
    if (currentSlide < TUTORIAL_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleStartGame = () => {
    onClose();
    onStartCase?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg shadow-2xl w-11/12 max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{slide.icon}</span>
            <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close tutorial"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap mb-4">
            {slide.content}
          </p>

          {/* Tips */}
          {slide.tips && slide.tips.length > 0 && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mt-4">
              <h3 className="text-blue-300 font-semibold mb-2 text-sm uppercase tracking-wide">💡 Pro Tips:</h3>
              <ul className="space-y-1">
                {slide.tips.map((tip, idx) => (
                  <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer with Navigation */}
        <div className="bg-slate-900/50 border-t border-slate-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-slate-400 text-sm">
              Slide {currentSlide + 1} of {TUTORIAL_SLIDES.length}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={isFirstSlide}
                className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              {isLastSlide ? (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStartGame}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-colors font-semibold"
                  >
                    Start Investigation
                  </button>
                </>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={isLastSlide}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-700 rounded-full h-1">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentSlide + 1) / TUTORIAL_SLIDES.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
