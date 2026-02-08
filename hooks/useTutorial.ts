import { useState, useEffect, useCallback } from 'react';
import { TutorialStep } from '../components/InGameTutorial';

interface TutorialState {
  isActive: boolean;
  currentStep: TutorialStep;
  completed: boolean;
}

const TUTORIAL_STORAGE_KEY = 'cold-case-tutorial-completed';

export function useTutorial() {
  const [tutorialState, setTutorialState] = useState<TutorialState>(() => {
    // Check if tutorial was already completed
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
    return {
      isActive: !completed,
      currentStep: 'welcome' as TutorialStep,
      completed
    };
  });

  const [hasInteracted, setHasInteracted] = useState({
    panned: false,
    clickedEvidence: false,
    pinnedItem: false,
    createdLink: false
  });

  // Skip tutorial
  const skipTutorial = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setTutorialState({
      isActive: false,
      currentStep: 'complete',
      completed: true
    });
  }, []);

  // Reset tutorial (for testing or user request)
  const resetTutorial = useCallback(() => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    setTutorialState({
      isActive: true,
      currentStep: 'welcome',
      completed: false
    });
    setHasInteracted({
      panned: false,
      clickedEvidence: false,
      pinnedItem: false,
      createdLink: false
    });
  }, []);

  // Progress to next step
  const completeStep = useCallback((step: TutorialStep) => {
    const stepOrder: TutorialStep[] = [
      'welcome',
      'look-around',
      'click-evidence',
      'read-evidence',
      'pin-evidence',
      'create-link',
      'verify-connection',
      'complete'
    ];

    const currentIndex = stepOrder.indexOf(step);
    const nextStep = stepOrder[currentIndex + 1];

    if (nextStep) {
      setTutorialState(prev => ({
        ...prev,
        currentStep: nextStep
      }));
    } else {
      // Tutorial complete
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      setTutorialState({
        isActive: false,
        currentStep: 'complete',
        completed: true
      });
    }
  }, []);

  // Track user interactions to auto-progress tutorial
  const trackPan = useCallback(() => {
    if (!hasInteracted.panned && tutorialState.currentStep === 'look-around') {
      setHasInteracted(prev => ({ ...prev, panned: true }));
      // Auto-advance after panning
      setTimeout(() => completeStep('look-around'), 1000);
    }
  }, [hasInteracted.panned, tutorialState.currentStep, completeStep]);

  const trackEvidenceClick = useCallback((itemId: string | null) => {
    if (itemId && !hasInteracted.clickedEvidence && tutorialState.currentStep === 'click-evidence') {
      setHasInteracted(prev => ({ ...prev, clickedEvidence: true }));
      completeStep('click-evidence');
    }
    
    // When user closes evidence (itemId becomes null), advance from read-evidence step
    if (!itemId && hasInteracted.clickedEvidence && tutorialState.currentStep === 'read-evidence') {
      setTimeout(() => completeStep('read-evidence'), 500);
    }
  }, [hasInteracted.clickedEvidence, tutorialState.currentStep, completeStep]);

  const trackPin = useCallback(() => {
    if (!hasInteracted.pinnedItem && tutorialState.currentStep === 'pin-evidence') {
      setHasInteracted(prev => ({ ...prev, pinnedItem: true }));
      setTimeout(() => completeStep('pin-evidence'), 1000);
    }
  }, [hasInteracted.pinnedItem, tutorialState.currentStep, completeStep]);

  const trackLink = useCallback(() => {
    if (!hasInteracted.createdLink && tutorialState.currentStep === 'create-link') {
      setHasInteracted(prev => ({ ...prev, createdLink: true }));
      setTimeout(() => completeStep('create-link'), 1000);
    }
  }, [hasInteracted.createdLink, tutorialState.currentStep, completeStep]);

  return {
    ...tutorialState,
    skipTutorial,
    resetTutorial,
    completeStep,
    trackPan,
    trackEvidenceClick,
    trackPin,
    trackLink
  };
}
