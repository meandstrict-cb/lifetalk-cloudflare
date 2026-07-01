/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CharacterProficiency = 'Beginner' | 'Intermediate' | 'Advanced';

export interface DialogueChoice {
  id: string;
  type: string; // 'correct' | 'incorrect' | 'friendly' | 'neutral' | 'direct' | 'professional' | 'confident'
  text: string;
  feedback: string;
  explanation: string;
  npc_expression_url?: string;
  fluency: number;
  confidence: number;
  money: number;
  nextTurnIndex: number; // -1 means end of scenario
}

export interface DialogueTurn {
  npc_message: string;
  isNpcEnd?: boolean;
  beginner_choices?: DialogueChoice[];
  intermediate_choices?: DialogueChoice[];
  advanced_choices?: DialogueChoice[];
  // Fallbacks for older structure
  choices?: DialogueChoice[];
}

export interface DialogueScenario {
  id: string;
  title: string;
  bgClass: string; // e.g. 'sprite-bg-cafe', 'sprite-bg-office', 'sprite-bg-park'
  bgImageUrl?: string; // high-fidelity custom prompt background override
  description: string;
  npc_name: string;
  npc_avatar_class: string;
  npc_portrait_class: string;
  npcOpenSceneUrl?: string; // custom high fidelity character portrait override
  turns: DialogueTurn[];
  npc_gender?: 'male' | 'female';
  npc_accent?: 'US' | 'UK';
  npc_voice_name?: string;
}

export interface Flashcard {
  id: string;
  front: string; // The situation context or dialog prompt that requires recall
  context: string;
  beginner_choices: DialogueChoice[];
  intermediate_choices: DialogueChoice[];
  advanced_choices: DialogueChoice[];
  text: string; // The correct target response string
  stability: number;
  difficulty: number;
  dueDay: number;
  lastReviewDay: number;
  reps: number;
  state: 'new' | 'learning' | 'reviewing' | 'mastered';
  lapses: number;
  desiredRetention: number;
  fsrsState: 'New' | 'Learning' | 'Review' | 'Relearning';
  conversationSuccess: number;
  conversationFailure: number;
  masteryStars: number;
  unlockedAt: string;
  historyContext?: { npc: string; player: string }[];
  choiceType?: string;
}

export interface PlayerHistoryItem {
  scenarioId: string;
  scenarioTitle: string;
  score: number;
  timestamp: string;
}

export interface PlayerProfile {
  playerName: string;
  playerPath: string; // e.g. 'Student', 'Intern', 'Tourist'
  playerGender: 'male' | 'female';
  day: number;
  money: number;
  fluencyXp: number;
  confidence: number;
  energy: number;
  streak: number;
  streakFreezeCount: number;
  lastActiveDate: string;
  sentencesMastered: number;
  conversationsToday?: number;
  motherTongue?: 'English' | 'Mandarin Chinese' | 'Spanish' | 'Vietnamese';
  avatarId?: string;
  avatarUrl?: string;
  objectives: {
    id: string;
    text: string;
    category: 'Restaurant' | 'Office' | 'Social' | 'General';
    done: boolean;
  }[];
  sentenceSpeechStats?: Record<string, { correctCount: number; attemptCount: number }>;
}
