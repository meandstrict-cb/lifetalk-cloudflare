/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { defaultScenarios } from './data/defaultScenarios';
import { PlayerProfile, DialogueScenario, DialogueChoice, CharacterProficiency, Flashcard } from './types';
import { CharacterCreation } from './components/CharacterCreation';
import { Dashboard } from './components/Dashboard';
import { DialogueEvent } from './components/DialogueEvent';
import { FSRSFlashcards } from './components/FSRSFlashcards';
import { ScenarioEditor } from './components/ScenarioEditor';
import { FSRSLibrary } from './components/FSRSLibrary';
import { RestaurantZones } from './components/RestaurantZones';
import { SpeechPractice } from './components/SpeechPractice';
import { ToastContainer, toast } from './components/Toast';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import chloeAvatar from './assets/images/chloe_anime_avatar_1782570705681.jpg';
import { 
  Sparkles, 
  MapPin, 
  Award, 
  Flame, 
  BookOpen, 
  PlusCircle, 
  HelpCircle,
  Database,
  ArrowRight,
  TrendingUp,
  Volume2,
  ChevronRight,
  ChevronDown,
  Coins,
  Menu,
  X,
  Shield,
  Mic,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

// FSRS-4.5 interval calculation: Interval(S, D_R) = 9 * S * (D_R^-2 - 1)
export const calculateFSRSInterval = (stability: number, desiredRetention: number = 0.90): number => {
  const S = Math.max(0.1, stability);
  const D_R = Math.max(0.1, Math.min(0.99, desiredRetention));
  const interval = Math.round(9 * S * (Math.pow(D_R, -2) - 1));
  return Math.max(1, interval);
};

// Map FSRS game-state based on custom Mastery triggers
export const updateCardGameState = (card: {
  stability: number;
  reps: number;
  conversationSuccess: number;
}): 'new' | 'learning' | 'reviewing' | 'mastered' => {
  // Option 1: The Balanced Spaced Milestone (Recommended)
  // At least 14 days stability (approx 2 weeks memory safety), 3 reviews, 2 conversational successes.
  if (card.stability >= 14 && card.reps >= 3 && card.conversationSuccess >= 2) {
    return 'mastered';
  }
  if (card.reps >= 2) {
    return 'reviewing';
  }
  if (card.reps >= 1) {
    return 'learning';
  }
  return 'new';
};

export default function App() {
  // Screen state routing: 'landing' | 'character' | 'dashboard' | 'dialogue' | 'morning-review' | 'editor' | 'deck-library' | 'restaurant_zones' | 'speech-practice'
  const [screen, setScreen] = useState<'landing' | 'character' | 'dashboard' | 'dialogue' | 'morning-review' | 'editor' | 'deck-library' | 'restaurant_zones' | 'speech-practice'>('landing');

  // Player state profiles
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [difficulty, setDifficulty] = useState<CharacterProficiency>('Beginner');

  // Interactive flashcards and scenarios library database
  const [library, setLibrary] = useState<Record<string, DialogueScenario[]>>(defaultScenarios);
  const [fsrsDeck, setFsrsDeck] = useState<Flashcard[]>([]);

  // Dialog session states
  const [activeScenario, setActiveScenario] = useState<{ locationKey: string; sc: DialogueScenario } | null>(null);
  const [feedbackItem, setFeedbackItem] = useState<{ choice: DialogueChoice; isSuccess: boolean } | null>(null);

  // Milestone unlock celebration modals triggers
  const [unlockedDiff, setUnlockedDiff] = useState<CharacterProficiency | null>(null);

  // Mobile menu overlay visibility
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showEarnGuide, setShowEarnGuide] = useState(false);

  // Auth & Admin states
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAdminPageActive, setIsAdminPageActive] = useState(false);

  // Deck Migration helper
  const migrateDeck = (parsed: any[]): Flashcard[] => {
    return parsed.map((card: any) => {
      const reps = typeof card.reps === 'number' ? card.reps : 0;
      const stability = typeof card.stability === 'number' ? card.stability : 2.4;
      const difficulty = typeof card.difficulty === 'number' ? card.difficulty : 4.93;
      const lapses = typeof card.lapses === 'number' ? card.lapses : 0;
      const desiredRetention = typeof card.desiredRetention === 'number' ? card.desiredRetention : 0.90;
      const fsrsState = card.fsrsState || (card.state === 'mastered' ? 'Review' : (reps >= 1 ? 'Learning' : 'New'));
      const conversationSuccess = typeof card.conversationSuccess === 'number' ? card.conversationSuccess : Math.max(1, reps);
      const conversationFailure = typeof card.conversationFailure === 'number' ? card.conversationFailure : 0;
      const masteryStars = typeof card.masteryStars === 'number' ? card.masteryStars : (card.state === 'mastered' ? 3 : 0);
      const computedState = updateCardGameState({ stability, reps, conversationSuccess });

      return {
        ...card,
        stability,
        difficulty,
        reps,
        lapses,
        desiredRetention,
        fsrsState,
        conversationSuccess,
        conversationFailure,
        masteryStars,
        state: computedState
      };
    });
  };

  // Load baseline profile parameters onload & authenticate
  useEffect(() => {
    // 1. Immediately load local storage state so Guest mode works without blocking
    const savedProfile = localStorage.getItem('lifetalk_profile_core');
    const savedDiff = localStorage.getItem('lifetalk_proficiency');
    const savedLib = localStorage.getItem('lifetalk_scenarios');
    const savedDeck = localStorage.getItem('lifetalk_fsrs_deck');

    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedDiff) setDifficulty(JSON.parse(savedDiff) as CharacterProficiency);
    if (savedLib) setLibrary(JSON.parse(savedLib));
    if (savedDeck) {
      try {
        const parsed = JSON.parse(savedDeck);
        if (Array.isArray(parsed)) {
          setFsrsDeck(migrateDeck(parsed));
        }
      } catch (err) {
        setFsrsDeck([]);
      }
    } else {
      // Seed an initial flashcard for practice
      const sampleCard: Flashcard = {
        id: 'init_phrase_' + Date.now(),
        front: 'Order Hot Beverage',
        context: 'You walk up to the busy counter. How do you politely order a caramel macchiato?',
        beginner_choices: [
          {
            id: 'A',
            type: 'correct',
            text: 'Good morning. I would like a hot latte, please.',
            feedback: 'Perfect!',
            explanation: 'Clean request.',
            fluency: 12,
            confidence: 6,
            money: -5,
            nextTurnIndex: -1
          }
        ],
        intermediate_choices: [],
        advanced_choices: [],
        text: 'Good morning. I would like a hot latte, please.',
        stability: 2.4,
        difficulty: 4.93,
        dueDay: 1,
        lastReviewDay: 0,
        reps: 0,
        state: 'new',
        lapses: 0,
        desiredRetention: 0.90,
        fsrsState: 'New',
        conversationSuccess: 0,
        conversationFailure: 0,
        masteryStars: 0,
        unlockedAt: 'Day 1'
      };
      setFsrsDeck([sampleCard]);
    }

    // 2. Load auth status and sync progress from cloud if logged in
    const checkAuthAndSync = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const authUser = await res.json();
          setUser({ username: authUser.username, role: authUser.role });
          
          const progRes = await fetch('/api/progress');
          if (progRes.ok) {
            const cloudProg = await progRes.json();
            if (cloudProg.profile) {
              setProfile(cloudProg.profile);
              setDifficulty(cloudProg.difficulty || 'Beginner');
              if (cloudProg.library) setLibrary(cloudProg.library);
              if (cloudProg.fsrsDeck) setFsrsDeck(migrateDeck(cloudProg.fsrsDeck));

              localStorage.setItem('lifetalk_profile_core', JSON.stringify(cloudProg.profile));
              localStorage.setItem('lifetalk_proficiency', JSON.stringify(cloudProg.difficulty || 'Beginner'));
              if (cloudProg.library) localStorage.setItem('lifetalk_scenarios', JSON.stringify(cloudProg.library));
              if (cloudProg.fsrsDeck) localStorage.setItem('lifetalk_fsrs_deck', JSON.stringify(cloudProg.fsrsDeck));
            } else {
              // Sync local guest progress to cloud
              const currentProfStr = localStorage.getItem('lifetalk_profile_core');
              if (currentProfStr) {
                const currentProfile = JSON.parse(currentProfStr);
                const currentDiff = JSON.parse(localStorage.getItem('lifetalk_proficiency') || '"Beginner"');
                const currentLib = JSON.parse(localStorage.getItem('lifetalk_scenarios') || 'null') || library;
                const currentDeck = JSON.parse(localStorage.getItem('lifetalk_fsrs_deck') || '[]');
                await fetch('/api/progress', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    profile: currentProfile,
                    difficulty: currentDiff,
                    library: currentLib,
                    fsrsDeck: currentDeck
                  })
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("Authentication/Sync resolution failed:", err);
      }
    };
    checkAuthAndSync();
  }, []);

  const handleAuthSuccess = async (authUser: { username: string; role: string }) => {
    setUser(authUser);
    try {
      const res = await fetch('/api/progress');
      if (res.ok) {
        const cloudProg = await res.json();
        if (cloudProg.profile) {
          setProfile(cloudProg.profile);
          setDifficulty(cloudProg.difficulty || 'Beginner');
          if (cloudProg.library) setLibrary(cloudProg.library);
          if (cloudProg.fsrsDeck) setFsrsDeck(migrateDeck(cloudProg.fsrsDeck));

          localStorage.setItem('lifetalk_profile_core', JSON.stringify(cloudProg.profile));
          localStorage.setItem('lifetalk_proficiency', JSON.stringify(cloudProg.difficulty || 'Beginner'));
          if (cloudProg.library) localStorage.setItem('lifetalk_scenarios', JSON.stringify(cloudProg.library));
          if (cloudProg.fsrsDeck) localStorage.setItem('lifetalk_fsrs_deck', JSON.stringify(cloudProg.fsrsDeck));
        } else {
          // Upload local progress to cloud
          const currentProfStr = localStorage.getItem('lifetalk_profile_core');
          if (currentProfStr) {
            const currentProfile = JSON.parse(currentProfStr);
            const currentDiff = JSON.parse(localStorage.getItem('lifetalk_proficiency') || '"Beginner"');
            const currentLib = JSON.parse(localStorage.getItem('lifetalk_scenarios') || 'null') || library;
            const currentDeck = JSON.parse(localStorage.getItem('lifetalk_fsrs_deck') || '[]');
            await fetch('/api/progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                profile: currentProfile,
                difficulty: currentDiff,
                library: currentLib,
                fsrsDeck: currentDeck
              })
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to sync progress on login success:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIsAdminPageActive(false);
      toast.success("Logged out successfully! Game is now running in Guest Mode.");
    } catch (err) {
      console.error("Logout request failed:", err);
    }
  };

  // Save states
  const saveProgressState = (newProfile: PlayerProfile, newDiff: CharacterProficiency, newLib = library, newDeck = fsrsDeck) => {
    setProfile(newProfile);
    setDifficulty(newDiff);
    setLibrary(newLib);
    setFsrsDeck(newDeck);

    localStorage.setItem('lifetalk_profile_core', JSON.stringify(newProfile));
    localStorage.setItem('lifetalk_proficiency', JSON.stringify(newDiff));
    localStorage.setItem('lifetalk_scenarios', JSON.stringify(newLib));
    localStorage.setItem('lifetalk_fsrs_deck', JSON.stringify(newDeck));

    // Upload to cloud database in background if user is authenticated
    const checkAndSyncInBg = async () => {
      const cookieRes = await fetch('/api/auth/me');
      if (cookieRes.ok) {
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: newProfile,
            difficulty: newDiff,
            library: newLib,
            fsrsDeck: newDeck
          })
        }).catch(err => console.error("Cloud synchronization failed:", err));
      }
    };
    checkAndSyncInBg();
  };

  const checkProficiencyProgression = (oldMastered: number, newMastered: number, currentProf: CharacterProficiency) => {
    let nextProf: CharacterProficiency = currentProf;
    if (newMastered >= 500) {
      nextProf = 'Advanced';
    } else if (newMastered >= 100) {
      nextProf = 'Intermediate';
    } else {
      nextProf = 'Beginner';
    }

    if (nextProf !== currentProf) {
      setUnlockedDiff(nextProf);
    }
    return nextProf;
  };

  const handleInitProfileComplete = (created: PlayerProfile, baseline: CharacterProficiency) => {
    // Generate related baseline deck configurations
    const initialDeck: Flashcard[] = [
      {
        id: 'start_card_1',
        front: 'Good morning greeting',
        context: 'Meeting Emma at the morning table. How do you greet her?',
        beginner_choices: [
          {
            id: 'A',
            type: 'correct',
            text: 'Hello Emma. My day is good, thank you. How are you?',
            feedback: 'Polite and crisp.',
            explanation: 'Answers greeting correctly.',
            fluency: 10,
            confidence: 5,
            money: 0,
            nextTurnIndex: -1
          }
        ],
        intermediate_choices: [],
        advanced_choices: [],
        text: 'Hello Emma. My day is good, thank you. How are you?',
        stability: 2.4,
        difficulty: 4.93,
        dueDay: 1,
        lastReviewDay: 0,
        reps: 0,
        state: 'new',
        lapses: 0,
        desiredRetention: 0.90,
        fsrsState: 'New',
        conversationSuccess: 0,
        conversationFailure: 0,
        masteryStars: 0,
        unlockedAt: 'Day 1'
      }
    ];

    saveProgressState(created, baseline, library, initialDeck);
    
    // Check if review cards are due
    const hasReviews = initialDeck.some(c => c.dueDay <= created.day);
    setScreen(hasReviews ? 'morning-review' : 'dashboard');
  };

  const handleEnterLocation = (locationId: string) => {
    if (!profile) return;

    if (locationId === 'cafe') {
      setScreen('restaurant_zones');
      return;
    }

    if (profile.energy < 15) {
      toast.warning("You need at least 15 energy points to initiate conversation situations!\nGo sleep and advance the day to refresh energy.");
      return;
    }

    // Spend energy point
    const updatedProfile = {
      ...profile,
      energy: Math.max(0, profile.energy - 15)
    };

    // Grab scenario candidate
    let list = library[locationId];
    if (!list || list.length === 0) {
      list = library.restaurant_entrance;
    }
    const scSelection = list[Math.floor(Math.random() * list.length)];

    saveProgressState(updatedProfile, difficulty);
    setActiveScenario({ locationKey: locationId, sc: scSelection });
    setFeedbackItem(null);
    setScreen('dialogue');
  };

  const handleEnterCafeZone = (zoneKey: string) => {
    if (!profile) return;

    if (profile.energy < 15) {
      toast.warning("You need at least 15 energy points to initiate conversation situations!\nGo sleep and advance the day to refresh energy.");
      return;
    }

    // Spend energy point
    const updatedProfile = {
      ...profile,
      energy: Math.max(0, profile.energy - 15)
    };

    // Grab scenario candidate for this specific zone
    const list = library[zoneKey] || [];
    if (list.length === 0) {
      toast.error("No situations currently configured for this zone!");
      return;
    }
    const scSelection = list[Math.floor(Math.random() * list.length)];

    saveProgressState(updatedProfile, difficulty);
    setActiveScenario({ locationKey: zoneKey, sc: scSelection });
    setFeedbackItem(null);
    setScreen('dialogue');
  };

  const checkXpLevelUpAndEarn = (oldXp: number, newXp: number, currentMoney: number) => {
    const oldLevel = Math.floor(oldXp / 100) + 1;
    const newLevel = Math.floor(newXp / 105) + 1; // 100 or 105 or whatever, let's stick with 100 XP per level
    const calculatedNewLevel = Math.floor(newXp / 100) + 1;
    if (calculatedNewLevel > oldLevel) {
      const reward = (calculatedNewLevel - oldLevel) * 50;
      return {
        leveledUp: true,
        newLevel: calculatedNewLevel,
        reward,
        newMoney: currentMoney + reward
      };
    }
    return {
      leveledUp: false,
      newLevel: oldLevel,
      reward: 0,
      newMoney: currentMoney
    };
  };

  const handleCompleteConversation = () => {
    if (!profile) return;

    const currentConvToday = profile.conversationsToday || 0;
    const nextConvToday = currentConvToday + 1;

    let earnedCoins = 10;
    let goalMessage = "";

    // Complete a daily goal: 5 conversations today -> +30 🪙
    if (nextConvToday === 5) {
      earnedCoins += 30;
      goalMessage = "\n\n🎯 DAILY GOAL ACHIEVED! Completed 5 conversations today! +30 🪙 awarded!";
    }

    const updatedProfile: PlayerProfile = {
      ...profile,
      money: profile.money + earnedCoins,
      conversationsToday: nextConvToday
    };

    saveProgressState(updatedProfile, difficulty);
    toast.coins(`🎉 Conversation completed! You earned +10 🪙!${goalMessage}`);
    setScreen('dashboard');
  };

  const handleDialogueChoiceSelect = (
    choice: DialogueChoice, 
    isDirectSelect: boolean, 
    turnIndexNum?: number,
    selectionHistory?: { npcMessage: string; choiceSelected: DialogueChoice }[]
  ) => {
    if (!profile || !activeScenario) return;

    const oldMastered = profile.sentencesMastered;
    let earnedXp = choice.fluency;
    if (!isDirectSelect) earnedXp = Math.round(choice.fluency * 0.5); // reduced reward for assisted advice

    const nextMastered = profile.sentencesMastered;
    const checkedDifficulty = difficulty;

    // Update objectives
    const updatedObjectives = profile.objectives.map(obj => {
      if (activeScenario.locationKey && (activeScenario.locationKey.startsWith('restaurant') || activeScenario.locationKey.startsWith('cafe')) && (obj.category === 'Restaurant' || obj.category === 'Cafe')) return { ...obj, done: true };
      if (activeScenario.locationKey === 'work' && obj.category === 'Office') return { ...obj, done: true };
      if (activeScenario.locationKey === 'park' && obj.category === 'Social') return { ...obj, done: true };
      return obj;
    });

    const levelCheck = checkXpLevelUpAndEarn(profile.fluencyXp, profile.fluencyXp + earnedXp, Math.max(0, profile.money + choice.money));

    const updatedProfile: PlayerProfile = {
      ...profile,
      fluencyXp: profile.fluencyXp + earnedXp,
      confidence: Math.min(100, Math.max(10, profile.confidence + choice.confidence)),
      money: levelCheck.newMoney,
      sentencesMastered: nextMastered,
      objectives: updatedObjectives
    };

    if (levelCheck.leveledUp) {
      setTimeout(() => {
        toast.achievement(`✨ LEVEL UP! reached Level ${levelCheck.newLevel} and unlocked a new city area! +50 🪙 rewarded!`);
      }, 300);
    }

    // Check if sentence needs addition to review deck
    const currentIdx = typeof turnIndexNum === 'number' ? turnIndexNum : 0;
    const currentTurnMsg = activeScenario.sc.turns[currentIdx]?.npc_message || '';
    const existsInDeck = fsrsDeck.some((c) => c.front === currentTurnMsg && (c.choiceType || 'correct') === choice.type);

    let nextDeck = [...fsrsDeck];
    const isCorrectChoiceType = choice.type !== 'incorrect';
    if (!existsInDeck && isCorrectChoiceType) {
      // Build previous turn history context
      let historyContext: { npc: string; player: string }[] | undefined = undefined;
      if (currentIdx > 0) {
        historyContext = [];
        for (let i = 0; i < currentIdx; i++) {
          const turn = activeScenario.sc.turns[i];
          if (!turn) continue;

          // Gather all possible choices for this specific historic turn
          const allTurnChoices = [
            ...(turn.beginner_choices || []),
            ...(turn.intermediate_choices || []),
            ...(turn.advanced_choices || [])
          ];

          // Find the player selection that matches one of this turn's choices & is not an incorrect option
          const match = [...(selectionHistory || [])].reverse().find(item => {
            if (!item.choiceSelected) return false;
            const npcMatches = item.npcMessage === turn.npc_message;
            const textMatches = allTurnChoices.some(ch => 
              item.choiceSelected.text === ch.text || 
              item.choiceSelected.text.startsWith(ch.text)
            );
            return (npcMatches || textMatches) && item.choiceSelected.type !== 'incorrect';
          });

          if (match) {
            historyContext.push({
              npc: turn.npc_message,
              player: match.choiceSelected.text
            });
          } else {
            // Fallback: If no non-incorrect entry found, try matching any selection entry for this turn
            const fallbackMatch = [...(selectionHistory || [])].reverse().find(item => {
              if (!item.choiceSelected) return false;
              const npcMatches = item.npcMessage === turn.npc_message;
              const textMatches = allTurnChoices.some(ch => 
                item.choiceSelected.text === ch.text || 
                item.choiceSelected.text.startsWith(ch.text)
              );
              return npcMatches || textMatches;
            });
            if (fallbackMatch) {
              historyContext.push({
                npc: turn.npc_message,
                player: fallbackMatch.choiceSelected.text
              });
            } else {
              // Extreme fallback: Default to the first correct option for the turn
              const defaultCorrect = allTurnChoices.find(ch => ch.type === 'correct' || ch.type === 'friendly') || allTurnChoices[0];
              if (defaultCorrect) {
                historyContext.push({
                  npc: turn.npc_message,
                  player: defaultCorrect.text
                });
              }
            }
          }
        }
      }

      const addedCard: Flashcard = {
        id: 'vocab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        front: currentTurnMsg,
        context: `Scenario: ${activeScenario.sc.title} (Turn ${currentIdx + 1})`,
        beginner_choices: activeScenario.sc.turns[currentIdx]?.beginner_choices || [],
        intermediate_choices: activeScenario.sc.turns[currentIdx]?.intermediate_choices || [],
        advanced_choices: activeScenario.sc.turns[currentIdx]?.advanced_choices || [],
        text: choice.text,
        stability: 2.4, // FSRS-4.5 default w[2] for standard 'Good' initial rating
        difficulty: 4.93, // FSRS-4.5 default w[4] initial difficulty
        dueDay: profile.day + calculateFSRSInterval(2.4, 0.90),
        lastReviewDay: profile.day,
        reps: 0,
        lapses: 0,
        desiredRetention: 0.90,
        fsrsState: 'New',
        conversationSuccess: 0,
        conversationFailure: 0,
        masteryStars: 0,
        state: 'new',
        unlockedAt: `Day ${profile.day}`,
        choiceType: choice.type,
        historyContext
      };
      nextDeck.push(addedCard);
    }

    saveProgressState(updatedProfile, checkedDifficulty, library, nextDeck);
    setFeedbackItem({ choice, isSuccess: choice.type !== 'incorrect' });
  };

  const handleReviewRatingSubmit = (cardId: string, grade: number) => {
    if (!profile) return;

    let newlyMasteredCount = 0;
    let earnedXp = 5;

    // FSRS-4.5 Spaced-Repetition math specifications (17 default parameters)
    const w = [
      0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14,
      0.94, 2.18, 0.05, 0.34, 1.26, 0.27, 2.61
    ];

    const updatedDeck = fsrsDeck.map((card) => {
      if (card.id !== cardId) return card;

      let nextStability = card.stability || 2.4;
      let nextDifficulty = card.difficulty || 4.93;
      let nextLapses = card.lapses || 0;
      let nextFsrsState: 'New' | 'Learning' | 'Review' | 'Relearning' = card.fsrsState || 'New';
      let nextSuccess = card.conversationSuccess || 0;
      let nextFailure = card.conversationFailure || 0;

      const elapsedDays = Math.max(0, profile.day - card.lastReviewDay);

      // --- 1. FIRST REVIEW OR NO PARAMETERS ---
      if (card.reps === 0 || !card.stability || !card.difficulty) {
        nextStability = w[grade - 1];
        nextDifficulty = Math.max(1, Math.min(10, w[4] - (grade - 3) * w[5]));
        if (grade === 1) {
          nextFsrsState = 'Learning';
          nextFailure += 1;
        } else {
          nextFsrsState = 'Review';
          nextSuccess += 1;
        }
      } 
      // --- 2. SUBSEQUENT REVIEWS (DSR MODEL) ---
      else {
        // Retrievability probability under DSR model: R = (1 + t / (9 * S)) ^ -0.5
        const R = Math.pow(1 + elapsedDays / (9 * card.stability), -0.5);

        // Difficulty update with mean reversion
        const deltaD = -w[6] * (grade - 3);
        const meanReversion = w[7] * w[4] + (1 - w[7]) * (card.difficulty + deltaD);
        nextDifficulty = Math.max(1, Math.min(10, meanReversion));

        if (grade === 1) { // Fail (Again)
          nextFailure += 1;
          
          // Increment lapses if sliding down from active Review state
          if (card.fsrsState === 'Review') {
            nextLapses += 1;
          }
          nextFsrsState = 'Relearning';

          const failureStability = w[11] * 
            Math.pow(nextDifficulty, -w[12]) * 
            Math.pow(card.stability + 1, w[13]) * 
            Math.exp(w[14] * (1 - R));
          
          // Clamp failure stability to go down, capped at current card stability
          nextStability = Math.max(0.1, Math.min(failureStability, card.stability));
        } else { // Success (Hard, Good, Easy)
          nextSuccess += 1;
          
          // State transition machine
          if (card.fsrsState === 'New') {
            nextFsrsState = 'Review';
          } else if (card.fsrsState === 'Learning') {
            if (grade >= 3) {
              nextFsrsState = 'Review';
            }
          } else if (card.fsrsState === 'Relearning') {
            if (grade >= 3) {
              nextFsrsState = 'Review';
            }
          } else {
            nextFsrsState = 'Review';
          }

          const multiplier = 1 + 
            Math.exp(w[8]) * 
            (11 - nextDifficulty) * 
            Math.pow(card.stability, -w[9]) * 
            (Math.exp(w[10] * (1 - R)) - 1);
          
          let successStability = card.stability * multiplier;

          if (grade === 2) {
            successStability *= w[15]; // Hard penalty multiplier
          } else if (grade === 4) {
            successStability *= w[16]; // Easy bonus multiplier
          }

          nextStability = Math.max(0.1, successStability);
        }
      }

      // --- 3. REWARD XP PROPORTIONAL TO KNOWLEDGE RETENTION ADVANCEMENT (ANTI-SPAM) ---
      if (grade > 1) {
        const stabilityGain = Math.max(0, nextStability - (card.stability || 0));
        earnedXp = Math.max(5, Math.min(60, Math.round(stabilityGain * 3)));
      } else {
        earnedXp = 3;
      }

      // --- 4. GAME PROGRESSION / MASTERY CLASSIFICATION ---
      const nextReps = card.reps + 1;
      const nextState = updateCardGameState({
        stability: nextStability,
        reps: nextReps,
        conversationSuccess: card.conversationSuccess || 0
      });

      if (card.state !== 'mastered' && nextState === 'mastered') {
        newlyMasteredCount += 1;
      } else if (card.state === 'mastered' && nextState !== 'mastered') {
        newlyMasteredCount -= 1;
      }

      // Calculated interval using official formula under card's target retention
      const targetRetention = card.desiredRetention || 0.90;
      const nextInterval = calculateFSRSInterval(nextStability, targetRetention);

      return {
        ...card,
        stability: parseFloat(nextStability.toFixed(2)),
        difficulty: parseFloat(nextDifficulty.toFixed(2)),
        dueDay: profile.day + nextInterval,
        lastReviewDay: profile.day,
        reps: nextReps,
        lapses: nextLapses,
        fsrsState: nextFsrsState,
        conversationSuccess: card.conversationSuccess || 0,
        conversationFailure: card.conversationFailure || 0,
        state: nextState
      };
    });

    const oldMastered = profile.sentencesMastered;
    const nextMastered = Math.max(0, profile.sentencesMastered + newlyMasteredCount);
    const checkedDifficulty = checkProficiencyProgression(oldMastered, nextMastered, difficulty);

    let masteryReward = 0;
    if (newlyMasteredCount > 0) {
      masteryReward = newlyMasteredCount * 5;
    }

    const levelCheck = checkXpLevelUpAndEarn(profile.fluencyXp, profile.fluencyXp + earnedXp, profile.money + masteryReward);

    const updatedProfile: PlayerProfile = {
      ...profile,
      fluencyXp: profile.fluencyXp + earnedXp,
      money: levelCheck.newMoney,
      sentencesMastered: nextMastered,
      objectives: profile.objectives.map(obj => obj.category === 'General' ? { ...obj, done: true } : obj)
    };

    if (masteryReward > 0) {
      setTimeout(() => {
        toast.achievement(`🎓 SENTENCE MASTERED! +5 🪙 rewarded!`);
      }, 300);
    }

    if (levelCheck.leveledUp) {
      setTimeout(() => {
        toast.achievement(`✨ LEVEL UP! reached Level ${levelCheck.newLevel} and unlocked a new city area! +50 🪙 rewarded!`);
      }, 500);
    }

    saveProgressState(updatedProfile, checkedDifficulty, library, updatedDeck);
  };

  const handleSaveScenarioEditor = (locKey: string, sc: DialogueScenario, originIdx: number | null) => {
    let nextList = [...(library[locKey] || [])];
    if (originIdx !== null) {
      nextList[originIdx] = sc;
    } else {
      nextList.push(sc);
    }

    const updatedLibrary = {
      ...library,
      [locKey]: nextList
    };

    setLibrary(updatedLibrary);
    localStorage.setItem('lifetalk_scenarios', JSON.stringify(updatedLibrary));
  };

  const handleDeleteScenarioEditor = (locKey: string, idx: number) => {
    const list = [...(library[locKey] || [])];
    list.splice(idx, 1);
    const updatedLibrary = {
      ...library,
      [locKey]: list
    };

    setLibrary(updatedLibrary);
    localStorage.setItem('lifetalk_scenarios', JSON.stringify(updatedLibrary));
  };

  const handleAdvanceDay = () => {
    if (!profile) return;

    const oldXp = profile.fluencyXp;
    const nextDay = profile.day + 1;
    const dialogsCompleted = profile.conversationsToday || 0;

    let nextStreak = profile.streak;
    let nextStreakFreeze = profile.streakFreezeCount || 0;
    let streakStatusText = "";

    if (dialogsCompleted >= 1) {
      nextStreak = profile.streak + 1;
      streakStatusText = `Daily streak increased to ${nextStreak}! 🔥`;
    } else {
      // No dialogue completed today
      if (nextStreakFreeze > 0) {
        nextStreakFreeze -= 1;
        streakStatusText = `No dialogue completed today! A Streak Freeze was used. Your streak of ${nextStreak} Days remains frozen/intact. 🛡️ (Streak freeze consumed)`;
      } else {
        nextStreak = 0;
        streakStatusText = `No dialogue completed today! Your daily practice streak was broken. ❄️`;
      }
    }

    // Maintain a streak: every 7 days -> +100 🪙
    let streakBonus = 0;
    if (nextStreak > 0 && nextStreak % 7 === 0 && dialogsCompleted >= 1) {
      streakBonus = 100;
    }

    // Reset objectives, charge energy, update streak info
    const refreshedProfile: PlayerProfile = {
      ...profile,
      day: nextDay,
      energy: 100,
      streak: nextStreak,
      streakFreezeCount: nextStreakFreeze,
      money: profile.money + streakBonus,
      conversationsToday: 0,
      lastActiveDate: new Date().toDateString(),
      objectives: profile.objectives.map(obj => ({ ...obj, done: false }))
    };

    saveProgressState(refreshedProfile, difficulty);
    
    let streakBonusMessage = "";
    if (streakBonus > 0) {
      streakBonusMessage = `\n\n🔥 7-DAY STREAK MILESTONE reached! +100 🪙 Streak Bonus awarded!`;
    }
    toast.energy(`Day ${nextDay} initialized successfully! ${streakStatusText}\nEnergy fully recharged to 100! ☀️${streakBonusMessage}`);

    // Check if morning card reviews are due
    const hasDue = fsrsDeck.some((c) => c.dueDay <= nextDay);
    setScreen(hasDue ? 'morning-review' : 'dashboard');
  };

  const handleBuyStreakFreeze = () => {
    if (!profile) return;
    const itemCost = 50;
    if (profile.money < itemCost) {
      toast.error(`❌ Insufficient Coins! You need 50 🪙 to buy a Streak Shield.\n(Current Balance: ${profile.money} 🪙)`);
      return;
    }
    const updatedProfile: PlayerProfile = {
      ...profile,
      money: profile.money - itemCost,
      streakFreezeCount: (profile.streakFreezeCount || 0) + 1
    };
    setProfile(updatedProfile);
    saveProgressState(updatedProfile, difficulty);
    toast.shield(`Shield Equipped! 🛡️ Streak Freeze purchased successfully!\nYou now have ${updatedProfile.streakFreezeCount} Streak Shield(s) equipped.`);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[#070a1a]">
      
      {/* Mobile Top HUD and Navigation */}
      {profile && screen !== 'character' && screen !== 'morning-review' && screen !== 'dialogue' && screen !== 'landing' && (
        <header className="lg:hidden bg-slate-950 border-b border-slate-900 sticky top-0 z-50 flex flex-col">
          <div className="flex justify-between items-center px-4 py-3">
            {/* Logo & Mini Avatar */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500/35 bg-slate-950 flex-shrink-0 shadow-lg">
                <img 
                  src={profile.avatarUrl || chloeAvatar} 
                  alt={profile.playerName} 
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-sans tracking-tight text-slate-150 font-black leading-none">{profile.playerName}</span>
                <span className="text-[8px] font-sans text-amber-500 font-black uppercase tracking-wider mt-0.5 leading-none">LifeTalk Sim</span>
              </div>
            </div>

            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Quick horizontal stats list */}
          <div className="flex items-center gap-3 px-4 pb-2.5 overflow-x-auto text-[11px] whitespace-nowrap border-t border-slate-900/60 pt-2 font-sans select-none scrollbar-thin">
            <div className="flex items-center gap-1 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-850">
              <span className="text-amber-500 font-bold">$</span>
              <span className="font-extrabold text-slate-200">{profile.money}</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-850">
              <span className="text-emerald-400 font-bold">⚡</span>
              <span className="font-extrabold text-slate-200">{profile.energy}/100</span>
            </div>
            <div className="flex items-center gap-1 bg-[#1e140d] px-2 py-1 rounded-lg border border-[#8b6508]/25 text-amber-550">
              <Flame className="w-3 h-3 text-amber-500 animate-pulse" />
              <span className="font-extrabold">{profile.streak} d</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-850 text-slate-400">
              <span>Day {profile.day}</span>
            </div>
            <button 
              onClick={handleBuyStreakFreeze}
              className="flex items-center gap-1 bg-[#091526] hover:bg-[#0d213c] active:scale-95 px-2.5 py-1 rounded-lg border border-blue-900/35 text-sky-400 text-[10px] font-black cursor-pointer shadow-sm transition-all"
            >
              <Shield className="w-3 h-3 text-sky-400" />
              <span>Shield: {profile.streakFreezeCount || 0} (Buy: 50 🪙)</span>
            </button>
          </div>

          {/* Slide down menu drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-slate-950 border-t border-slate-900 flex flex-col font-sans p-4 gap-2 shadow-2xl"
              >
                {/* Mobile Auth Panel */}
                <div className="bg-slate-900/60 border border-slate-850 p-3 rounded-xl flex flex-col gap-2 mb-2">
                  {user ? (
                    <div className="flex items-center justify-between gap-3 text-left">
                      <div>
                        <p className="text-[10px] font-black text-slate-100 truncate max-w-[140px]">{user.username}</p>
                        <p className="text-[8px] text-slate-550 font-bold uppercase tracking-wider">{user.role} • Synced</p>
                      </div>
                      <div className="flex gap-1.5">
                        {user.role === 'admin' && (
                          <button
                            onClick={() => { setIsAdminPageActive(true); setMobileMenuOpen(false); }}
                            className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/10 cursor-pointer"
                          >
                            Admin
                          </button>
                        )}
                        <button
                          onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                          className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 cursor-pointer"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 text-left">
                      <div>
                        <p className="text-[10px] font-black text-slate-200">Guest Mode</p>
                        <p className="text-[8px] text-slate-500 leading-none mt-1 font-sans">Saves locally. Login to sync</p>
                      </div>
                      <button
                        onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }}
                        className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase bg-amber-500 text-slate-950 hover:bg-amber-600 transition-all cursor-pointer"
                      >
                        Login / Sign Up
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setScreen('dashboard'); setMobileMenuOpen(false); }}
                  className={`flex items-center justify-between p-3 rounded-xl text-left text-xs border ${
                    screen === 'dashboard' ? 'bg-slate-900 border-amber-500/30 text-amber-500 font-bold' : 'bg-slate-900/30 border-slate-900 text-slate-300'
                  }`}
                >
                  <span>City Map Hub</span>
                  <ChevronRight size={12} className="text-slate-500" />
                </button>
                <button
                  onClick={() => { setScreen('morning-review'); setMobileMenuOpen(false); }}
                  className={`flex items-center justify-between p-3 rounded-xl text-left text-xs border ${
                    screen === 'morning-review' ? 'bg-slate-900 border-amber-500/30 text-amber-500 font-bold' : 'bg-slate-900/30 border-slate-900 text-slate-300'
                  }`}
                >
                  <span>Daily Reviews ({fsrsDeck.filter(c => c.dueDay <= profile.day).length})</span>
                  <ChevronRight size={12} className="text-slate-500" />
                </button>
                <button
                  onClick={() => { setScreen('deck-library'); setMobileMenuOpen(false); }}
                  className={`flex items-center justify-between p-3 rounded-xl text-left text-xs border ${
                    screen === 'deck-library' ? 'bg-slate-900 border-amber-500/30 text-amber-500 font-bold' : 'bg-slate-900/30 border-slate-900 text-slate-300'
                  }`}
                >
                  <span>Review Library (FSRS) ({fsrsDeck.length})</span>
                  <ChevronRight size={12} className="text-slate-500" />
                </button>
                <button
                  onClick={() => { setScreen('speech-practice'); setMobileMenuOpen(false); }}
                  className={`flex items-center justify-between p-3 rounded-xl text-left text-xs border ${
                    screen === 'speech-practice' ? 'bg-slate-900 border-amber-500/30 text-amber-500 font-bold' : 'bg-slate-900/30 border-slate-900 text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Mic size={11} className="text-amber-500 animate-pulse" /> Speech Practice Arena</span>
                  <ChevronRight size={12} className="text-slate-500" />
                </button>
                <button
                  onClick={() => { setScreen('editor'); setMobileMenuOpen(false); }}
                  className={`flex items-center justify-between p-3 rounded-xl text-left text-xs border ${
                    screen === 'editor' ? 'bg-slate-900 border-amber-500/30 text-amber-500 font-bold' : 'bg-slate-900/30 border-slate-900 text-slate-300'
                  }`}
                >
                  <span>Scenario Database Editor</span>
                  <ChevronRight size={12} className="text-slate-500" />
                </button>
                {/* Mobile Mother tongue selector */}
                <div className="bg-[#090d20] border border-slate-900 p-2.5 rounded-xl flex flex-col gap-1 mt-1">
                  <label className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span>🌐</span> Mother Tongue (L1)
                  </label>
                  <select
                    value={profile.motherTongue || 'English'}
                    onChange={(e) => {
                      const newLanguage = e.target.value as 'English' | 'Mandarin Chinese' | 'Spanish' | 'Vietnamese';
                      const updated = { ...profile, motherTongue: newLanguage };
                      setProfile(updated);
                      localStorage.setItem('lifetalk_profile_core', JSON.stringify(updated));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="English">English (Immersion)</option>
                    <option value="Mandarin Chinese">Mandarin Chinese</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Vietnamese">Vietnamese</option>
                  </select>
                </div>

                <button
                  onClick={() => { handleAdvanceDay(); setMobileMenuOpen(false); }}
                  className="w-full bg-[#1c1209] hover:bg-[#2d1c0e] text-amber-500 font-black py-3 rounded-xl text-xs border border-[#8b6508]/30 text-center flex items-center justify-center gap-1.5 mt-1"
                >
                  Sleep & Sleep to Next Day
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}
      
      {/* Side HUD Panel */}
      {profile && screen !== 'character' && screen !== 'morning-review' && screen !== 'dialogue' && screen !== 'landing' && (
        <aside className="hidden lg:flex w-80 border-r border-slate-900 bg-slate-950 flex-col justify-between p-5 relative font-sans z-30">
          <div className="flex flex-col gap-5 overflow-y-auto pr-1 select-none">
            
            {/* Logo area */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-900">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center border border-amber-400/20 shadow-xl shadow-amber-500/10 flex-shrink-0">
                <Volume2 className="text-slate-950 w-5 h-5 font-black" />
              </div>
              <div>
                <h2 className="text-md font-sans tracking-wide text-amber-500 font-extrabold uppercase leading-none">LifeTalk Sim</h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Immersive speech loops</p>
              </div>
            </div>

            {/* Active Character & Auth Profile Card */}
            <div className="bg-slate-900/60 border border-slate-850 p-3.5 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex-shrink-0 relative">
                  <img 
                    src={profile.avatarUrl || chloeAvatar} 
                    alt={profile.playerName} 
                    className="w-full h-full object-cover object-top filter contrast-[1.05]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] text-amber-500 font-extrabold uppercase tracking-widest leading-none mb-1">Active Persona</p>
                  <h4 className="text-sm font-black text-slate-100 truncate leading-none">{profile.playerName}</h4>
                  <p className="text-[9.5px] text-slate-400 font-medium mt-1 leading-none">{profile.playerPath} • L1: {profile.motherTongue || 'English'}</p>
                </div>
              </div>

              {/* Mini Auth Status */}
              <div className="pt-2.5 border-t border-slate-850/60 flex items-center justify-between text-[10px]">
                {user ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-slate-400 font-medium truncate max-w-[130px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {user.username} ({user.role})
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-[9px] font-black uppercase text-rose-400 hover:text-rose-350 bg-rose-500/5 hover:bg-rose-500/10 px-2 py-1 rounded border border-rose-500/10 cursor-pointer transition-all"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                      Offline Guest
                    </span>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="text-[9px] font-black uppercase text-amber-500 hover:text-amber-400 px-2.5 py-1 rounded bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 cursor-pointer transition-all"
                    >
                      Sync Cloud
                    </button>
                  </div>
                )}
              </div>

              {user?.role === 'admin' && (
                <button
                  onClick={() => setIsAdminPageActive(true)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Shield size={10} className="fill-slate-950" />
                  <span>Security Desk</span>
                </button>
              )}
            </div>

            {/* Navigation Section */}
            <div className="flex flex-col gap-1.5 font-sans">
              <p className="text-[8.5px] text-slate-550 font-black uppercase tracking-widest pl-1.5 mb-1">Sim Navigation</p>
              
              <button 
                onClick={() => setScreen('dashboard')} 
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-slate-900/60 text-left transition-all text-xs border ${
                  screen === 'dashboard' 
                    ? 'bg-slate-900 border-amber-500/30 text-amber-500 font-bold shadow-md shadow-amber-500/5' 
                    : 'border-transparent text-slate-300 hover:border-slate-850'
                }`}
              >
                <span className="flex items-center gap-2">🗺️ City Map Hub</span>
                <ChevronRight size={11} className="text-slate-500" />
              </button>

              <button 
                onClick={() => setScreen('morning-review')} 
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-slate-900/60 text-left transition-all text-xs border ${
                  screen === 'morning-review' 
                    ? 'bg-slate-900 border-amber-500/30 text-amber-500 font-bold shadow-md shadow-amber-500/5' 
                    : 'border-transparent text-slate-300 hover:border-slate-850'
                }`}
              >
                <span className="flex items-center gap-2">🔄 Daily Reviews ({fsrsDeck.filter(c => c.dueDay <= profile.day).length})</span>
                <ChevronRight size={11} className="text-slate-500" />
              </button>

              <button 
                onClick={() => setScreen('deck-library')} 
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-slate-900/60 text-left transition-all text-xs border ${
                  screen === 'deck-library' 
                    ? 'bg-slate-900 border-amber-500/30 text-amber-500 font-bold shadow-md shadow-amber-500/5' 
                    : 'border-transparent text-slate-300 hover:border-slate-850'
                }`}
              >
                <span className="flex items-center gap-2">📚 Review Library (FSRS) ({fsrsDeck.length})</span>
                <ChevronRight size={11} className="text-slate-500" />
              </button>

              <button 
                onClick={() => setScreen('speech-practice')} 
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-slate-900/60 text-left transition-all text-xs border ${
                  screen === 'speech-practice' 
                    ? 'bg-slate-900 border-amber-500/30 text-amber-500 font-bold shadow-md shadow-amber-500/5' 
                    : 'border-transparent text-slate-300 hover:border-slate-850'
                }`}
              >
                <span className="flex items-center gap-2">🎙️ Speech Practice Arena</span>
                <ChevronRight size={11} className="text-slate-500" />
              </button>

              <button 
                onClick={() => setScreen('editor')} 
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-slate-900/60 text-left transition-all text-xs border ${
                  screen === 'editor' 
                    ? 'bg-slate-900 border-amber-500/30 text-amber-500 font-bold shadow-md shadow-amber-500/5' 
                    : 'border-transparent text-slate-300 hover:border-slate-850'
                }`}
              >
                <span className="flex items-center gap-2">🛠️ Scenario Database Editor</span>
                <Database size={12} className="text-emerald-400" />
              </button>
            </div>

            {/* Profile Statistics Dashboard */}
            <div className="flex flex-col gap-3 font-sans pt-3 border-t border-slate-900">
              <p className="text-[8.5px] text-slate-550 font-black uppercase tracking-widest pl-1.5 mb-0.5">Parameters & Stats</p>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Coins Balance Box */}
                <div className="bg-slate-900/50 border border-slate-850 p-2 rounded-xl flex flex-col justify-between h-[52px]">
                  <p className="text-[8.5px] text-slate-500 font-black uppercase leading-none">Coins Balance</p>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-100 text-xs">🪙 {profile.money}</span>
                    <button 
                      onClick={handleBuyStreakFreeze}
                      title="Buy Streak Shield (-50 🪙)"
                      className="text-[9px] font-black text-sky-400 hover:text-sky-300 bg-sky-950/45 border border-sky-400/20 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                    >
                      +🛡️
                    </button>
                  </div>
                </div>

                {/* Energy Box */}
                <div className="bg-slate-900/50 border border-slate-850 p-2 rounded-xl flex flex-col justify-between h-[52px]">
                  <p className="text-[8.5px] text-slate-500 font-black uppercase leading-none">Sim Energy</p>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-400 text-xs">⚡</span>
                    <span className="font-extrabold text-slate-100 text-xs">{profile.energy}/100</span>
                  </div>
                </div>

                {/* Confidence Box */}
                <div className="bg-slate-900/50 border border-slate-850 p-2 rounded-xl flex flex-col justify-between h-[52px]">
                  <p className="text-[8.5px] text-slate-500 font-black uppercase leading-none">Confidence</p>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-extrabold text-slate-100 text-xs">{profile.confidence}%</span>
                  </div>
                </div>

                {/* Days Streak & Calendars Box */}
                <div className="bg-slate-900/50 border border-slate-850 p-2 rounded-xl flex flex-col justify-between h-[52px]">
                  <p className="text-[8.5px] text-slate-550 font-black uppercase leading-none">Day {profile.day} • Streak</p>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-500 text-xs flex items-center gap-0.5"><Flame size={11} className="fill-amber-500/10 animate-bounce" /> {profile.streak}d</span>
                    <span className="text-[8.5px] text-sky-400 font-bold bg-sky-950/45 px-1 rounded border border-sky-400/15" title="Equipped Shields">
                      🛡️{profile.streakFreezeCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress meters milestones */}
              <div className="bg-slate-900/50 border border-slate-850 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center text-xs font-black uppercase shadow-lg">
                  {difficulty.substring(0, 3)}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center text-[8.5px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                    <span>Rank: {difficulty}</span>
                    <span>{profile.sentencesMastered} Mastered</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (profile.sentencesMastered / 100) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Controls / Language Selector */}
          <div className="flex flex-col gap-3 font-sans pt-3 border-t border-slate-900/80">
            {/* Desktop Mother tongue selector */}
            <div className="bg-slate-900/50 border border-slate-850/60 p-3 rounded-2xl flex flex-col gap-1.5">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 font-sans">
                <span>🌐</span> Mother Tongue (L1)
              </label>
              <select
                value={profile.motherTongue || 'English'}
                onChange={(e) => {
                  const newLanguage = e.target.value as 'English' | 'Mandarin Chinese' | 'Spanish' | 'Vietnamese';
                  const updated = { ...profile, motherTongue: newLanguage };
                  setProfile(updated);
                  localStorage.setItem('lifetalk_profile_core', JSON.stringify(updated));
                }}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all cursor-pointer font-sans"
              >
                <option value="English">English (Immersion)</option>
                <option value="Mandarin Chinese">Mandarin Chinese</option>
                <option value="Spanish">Spanish</option>
                <option value="Vietnamese">Vietnamese</option>
              </select>
            </div>

            <button 
              onClick={handleAdvanceDay}
              className="w-full bg-[#1c1209] hover:bg-[#2d1c0e] text-amber-500 font-black py-3.5 px-4 rounded-xl text-xs border border-[#8b6508]/30 transition-transform active:scale-95 text-center flex items-center justify-center gap-1.5 shadow cursor-pointer"
            >
              Sleep & Sleep to Next Day
            </button>
          </div>
        </aside>
      )}

      {/* Main Game Segment stage */}
      <section className="flex-1 flex flex-col min-h-0 bg-[#070a1a] p-4 sm:p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          
          {isAdminPageActive ? (
            <AdminPanel onBack={() => setIsAdminPageActive(false)} />
          ) : (
            <>
              {screen === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="relative overflow-hidden flex flex-col items-center justify-center p-6 sm:p-14 text-center min-h-[580px] w-full bg-gradient-to-br from-[#0c1024] via-[#050814] to-indigo-955/20 rounded-[2.5rem] border border-slate-900/60 shadow-2xl"
            >
              <div className="absolute w-[450px] h-[450px] rounded-full bg-indigo-500/5 blur-[120px] top-10 left-10 pointer-events-none"></div>

              <div className="relative max-w-3xl flex flex-col items-center gap-6 z-10 font-sans">
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full text-amber-500 text-xs font-semibold uppercase tracking-wider shadow-inner">
                  <Sparkles size={12} className="animate-pulse" /> FSRS SPACED COMPREHENSION IMMERSION
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight font-sans">
                  Live a new identity.<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-[#e0b36c] italic">Master real English dialogues.</span>
                </h1>

                <p className="text-xs sm:text-sm text-slate-400 max-w-lg leading-relaxed text-center font-medium font-sans">
                  Experience dynamic real-life scenarios like cafes, client offices, and public parks to build natural vocabulary fluency under certified FSRS spaced interval algorithms.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full justify-center">
                  {profile ? (
                    <button 
                      onClick={() => setScreen('dashboard')}
                      className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold px-10 py-4 rounded-2xl shadow-xl shadow-amber-600/15 transition-transform active:scale-95 text-xs tracking-wider uppercase font-sans"
                    >
                      RESUME SIMULATION
                    </button>
                  ) : (
                    <button 
                      onClick={() => setScreen('character')}
                      className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-yellow-700 text-slate-955 font-bold px-10 py-4.5 rounded-2xl shadow-xl shadow-amber-600/15 transition-all text-xs tracking-wider uppercase font-sans"
                    >
                      CREATE A CHARACTER PROFILE
                    </button>
                  )}
                  {profile && (
                    <button 
                      onClick={() => setScreen('character')}
                      className="w-full sm:w-auto bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-bold px-8 py-4.5 rounded-2xl border border-slate-800 transition-colors text-xs tracking-wider uppercase font-sans"
                    >
                      RESET CORE PROFILE
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {screen === 'character' && (
            <CharacterCreation 
              onComplete={handleInitProfileComplete}
            />
          )}

          {screen === 'dashboard' && profile && (
            <Dashboard 
              profile={profile}
              difficulty={difficulty}
              onEnterLocation={handleEnterLocation}
              onAdvanceDay={handleAdvanceDay}
            />
          )}

          {screen === 'restaurant_zones' && profile && (
            <RestaurantZones 
              profile={profile}
              difficulty={difficulty}
              library={library}
              onSelectZone={handleEnterCafeZone}
              onBack={() => setScreen('dashboard')}
            />
          )}

          {screen === 'dialogue' && activeScenario && profile && (
            <DialogueEvent 
              locationKey={activeScenario.locationKey}
              scenario={activeScenario.sc}
              difficulty={difficulty}
              motherTongue={profile.motherTongue}
              onChoiceSelect={handleDialogueChoiceSelect}
              onExit={handleCompleteConversation}
            />
          )}

          {screen === 'morning-review' && profile && (
            <FSRSFlashcards 
              deck={fsrsDeck}
              activeDay={profile.day}
              difficulty={difficulty}
              motherTongue={profile.motherTongue}
              onReviewRating={handleReviewRatingSubmit}
              onExit={() => setScreen('dashboard')}
            />
          )}

          {screen === 'deck-library' && profile && (
            <FSRSLibrary 
              deck={fsrsDeck}
              activeDay={profile.day}
              difficulty={difficulty}
              motherTongue={profile.motherTongue}
              onDeleteCard={(cardId) => {
                const nextDeck = fsrsDeck.filter(c => c.id !== cardId);
                saveProgressState(profile, difficulty, library, nextDeck);
              }}
              onUpdateDeck={(nextDeck) => {
                saveProgressState(profile, difficulty, library, nextDeck);
              }}
              onSelectPractice={(card) => {
                const matchedSc = (Object.values(library).flat() as DialogueScenario[]).find(sc => 
                  sc.turns.some(turn => turn.npc_message === card.front)
                );
                if (matchedSc) {
                  setActiveScenario({ locationKey: 'cafe', sc: matchedSc });
                  setFeedbackItem(null);
                  setScreen('dialogue');
                } else {
                  const provisionalSc = {
                    id: 'prov_' + card.id,
                    title: card.context.replace("Scenario: ", ""),
                    bgClass: 'sprite-bg-cafe',
                    description: 'Direct Memory Calibration Practice',
                    npc_name: 'Phonetic Review Assistant',
                    npc_avatar_class: '',
                    npc_portrait_class: '',
                    turns: [
                      {
                        npc_message: card.front,
                        beginner_choices: card.beginner_choices,
                        intermediate_choices: card.intermediate_choices,
                        advanced_choices: card.advanced_choices
                      }
                    ]
                  };
                  setActiveScenario({ locationKey: 'cafe', sc: provisionalSc as any });
                  setFeedbackItem(null);
                  setScreen('dialogue');
                }
              }}
              onExit={() => setScreen('dashboard')}
            />
          )}

          {screen === 'editor' && (
            <ScenarioEditor 
              library={library}
              onSaveScenario={handleSaveScenarioEditor}
              onDeleteScenario={handleDeleteScenarioEditor}
              onResetLibrary={() => {
                setLibrary(defaultScenarios);
                localStorage.setItem('lifetalk_scenarios', JSON.stringify(defaultScenarios));
                toast.success("Dialogue Scenarios restored to default!");
              }}
              onImportLibrary={(data) => {
                setLibrary(data);
                localStorage.setItem('lifetalk_scenarios', JSON.stringify(data));
              }}
              onPlayTest={(locationKey, sc) => {
                setActiveScenario({ locationKey, sc });
                setFeedbackItem(null);
                setScreen('dialogue');
              }}
              onExit={() => setScreen('dashboard')}
            />
          )}

          {screen === 'speech-practice' && profile && (
            <SpeechPractice 
              profile={profile}
              fsrsDeck={fsrsDeck}
              onUpdateProfile={(updated, updatedDeck) => saveProgressState(updated, difficulty, library, updatedDeck || fsrsDeck)}
              onBackToHub={() => setScreen('dashboard')}
            />
          )}

            </>
          )}

        </AnimatePresence>
      </section>

      {/* Unlocked modal celebration */}
      <AnimatePresence>
        {unlockedDiff && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-b from-[#161208]/95 to-slate-950 border border-[#8b6508]/40 rounded-[2.5rem] max-w-sm w-full p-8 text-center flex flex-col items-center gap-6 shadow-2xl font-sans"
            >
              <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20">
                ⭐
              </div>
              <div>
                <h3 className="text-2xl font-black text-amber-500 font-sans tracking-wide uppercase">Complexity Unlocked!</h3>
                <p className="text-xs text-slate-400 mt-2">Your spoken retention unlocked a higher difficulty stage!</p>
              </div>

              <div className="bg-slate-900 border border-slate-850 px-6 py-4.5 rounded-2xl w-full">
                <span className="text-[8px] text-amber-500 font-black uppercase tracking-widest block mb-0.5">New Standing Rank</span>
                <span className="text-3xl font-black text-white uppercase tracking-wider block">{unlockedDiff}</span>
              </div>

              <button 
                onClick={() => setUnlockedDiff(null)}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black py-3 px-6 rounded-2xl text-xs uppercase tracking-wider font-sans"
              >
                Acknowledge Advancement
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ToastContainer />

      <AnimatePresence>
        {showAuthModal && (
          <AuthModal 
            onClose={() => setShowAuthModal(false)} 
            onAuthSuccess={handleAuthSuccess} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
