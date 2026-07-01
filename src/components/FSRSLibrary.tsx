/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flashcard, DialogueChoice } from '../types';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  Sparkles, 
  Search, 
  Layers, 
  Trash2, 
  TrendingUp, 
  Sliders, 
  Play, 
  HelpCircle, 
  CheckCircle,
  Plus,
  Compass,
  Zap,
  Info,
  Star
} from 'lucide-react';
import { TranslatedText } from './TranslatedText';

interface FSRSLibraryProps {
  deck: Flashcard[];
  activeDay: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  motherTongue?: 'English' | 'Mandarin Chinese' | 'Spanish' | 'Vietnamese';
  onDeleteCard?: (cardId: string) => void;
  onExit: () => void;
  onSelectPractice?: (card: Flashcard) => void;
  onUpdateDeck?: (updatedDeck: Flashcard[]) => void;
}

// Self-contained FSRS 4.5 system interval formula: Interval = 9 * S * (D_R^-2 - 1)
const calculateFSRSInterval = (stability: number, desiredRetention: number = 0.90): number => {
  const S = Math.max(0.1, stability);
  const D_R = Math.max(0.1, Math.min(0.99, desiredRetention));
  const interval = Math.round(9 * S * (Math.pow(D_R, -2) - 1));
  return Math.max(1, interval);
};

const getPathBadge = (type?: string) => {
  if (!type) return null;
  const map: Record<string, { label: string; bg: string; text: string; border: string }> = {
    friendly: { label: 'Friendly / Warm', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    neutral: { label: 'Neutral / Polite', bg: 'bg-slate-500/10', text: 'text-slate-300', border: 'border-slate-800' },
    direct: { label: 'Direct / Confident', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    professional: { label: 'Professional / Office', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
    confident: { label: 'Confident / Bold', bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
    correct: { label: 'Standard / Best Option', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  };
  const item = map[type.toLowerCase()] || { label: type, bg: 'bg-slate-500/10', text: 'text-slate-300', border: 'border-slate-800' };
  return (
    <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${item.bg} ${item.text} ${item.border}`}>
      {item.label}
    </span>
  );
};

export const FSRSLibrary: React.FC<FSRSLibraryProps> = ({
  deck,
  activeDay,
  difficulty,
  motherTongue,
  onDeleteCard,
  onExit,
  onSelectPractice,
  onUpdateDeck
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'new' | 'learning' | 'reviewing' | 'mastered'>('all');
  const [showFSRSExplanation, setShowFSRSExplanation] = useState(false);
  const [showSpacingParadoxAdvisor, setShowSpacingParadoxAdvisor] = useState(false);
  const [globalRetentionTarget, setGlobalRetentionTarget] = useState(0.90);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedCardForCalculations, setSelectedCardForCalculations] = useState<Flashcard | null>(null);

  // Filtered list
  const filteredCards = deck.filter(card => {
    const matchesSearch = 
      card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
      card.context.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesState = filterState === 'all' || card.state === filterState;
    
    return matchesSearch && matchesState;
  });

  // Calculate FSRS statistics for the panel
  const totalReps = deck.reduce((acc, c) => acc + c.reps, 0);
  const averageStability = deck.length > 0 
    ? (deck.reduce((acc, c) => acc + c.stability, 0) / deck.length).toFixed(1) 
    : '0.0';
  const averageDifficulty = deck.length > 0 
    ? (deck.reduce((acc, c) => acc + c.difficulty, 0) / deck.length).toFixed(1) 
    : '0.0';

  const cardsDueToday = deck.filter(c => c.dueDay <= activeDay).length;

  // FSRS-4.5 retrievability model: R = (1 + t / (9 * S)) ^ -0.5
  const calculateRetrievability = (card: Flashcard) => {
    const elapsed = activeDay - card.lastReviewDay;
    if (elapsed <= 0) return 100;
    const s = card.stability || 2.4;
    // FSRS-4.5 standard math representation
    const r = Math.pow(1 + elapsed / (9 * s), -0.5) * 100;
    return Math.max(10, Math.min(100, Math.round(r)));
  };

  return (
    <div className="flex-grow flex flex-col min-h-[580px] bg-gradient-to-b from-[#0a0f24] to-[#040817] p-5 sm:p-8 rounded-[2rem] border border-slate-900">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-indigo-950 pb-5 mb-5 font-sans">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-black text-white font-sans tracking-tight">
              FSRS Learned Sentences Library
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Free Spaced Repetition scheduler optimises card reviews using dynamic retention curves.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => {
              setShowSpacingParadoxAdvisor(!showSpacingParadoxAdvisor);
              setShowFSRSExplanation(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-950 bg-rose-950/20 text-rose-300 text-xs font-bold hover:bg-rose-900/30 hover:text-white transition-colors"
          >
            <Zap size={14} className="text-rose-400 animate-pulse" /> 🧠 Spacing Paradox
          </button>
          <button 
            onClick={() => {
              setShowFSRSExplanation(!showFSRSExplanation);
              setShowSpacingParadoxAdvisor(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 text-xs font-bold hover:bg-slate-900 hover:text-white transition-colors"
          >
            <HelpCircle size={14} className="text-indigo-400" /> How FSRS Works
          </button>
          <button 
            onClick={onExit}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
          >
            Back to Map &rarr;
          </button>
        </div>
      </div>

      {/* Explanation Banner */}
      <AnimatePresence>
        {showFSRSExplanation && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-5"
          >
            <div className="bg-gradient-to-r from-[#0d153a] to-[#0b102e] border border-indigo-900 p-5 rounded-2xl flex flex-col gap-3 font-sans">
              <h4 className="text-sm font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" /> FSRS: Spaced Repetition Under the Hood
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Classic algorithms like SM-2 rely solely on rigid multiplication metrics (e.g., E-Factor). 
                <strong> FSRS (Free Spaced Repetition Scheduler)</strong> tracks memory using three properties based on the DSR model of forgetfulness:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-1">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900">
                  <div className="text-[10px] uppercase font-bold text-amber-400">Difficulty (D)</div>
                  <p className="text-[11px] text-slate-400 mt-1">Roughly how hard the phrase felt. Ranges from 1 (easy) to 10 (exceptionally hard).</p>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900">
                  <div className="text-[10px] uppercase font-bold text-indigo-400">Stability (S)</div>
                  <p className="text-[11px] text-slate-400 mt-1">Memory strength. High stability means it takes longer for you to forget the phrase.</p>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Retrievability (R)</div>
                  <p className="text-[11px] text-slate-400 mt-1">Probability of success if tested today. We aim to test you when R targets ~90%.</p>
                </div>
              </div>
              <p className="text-xs text-indigo-400 italic">
                💡 <strong>Optimized Advice:</strong> Rate your card honesty. If you struggle slightly, click 'Hard' to reduce stability growth. Clicking 'Good' achieves the mathematically perfect retention balance.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target Retention / Spacing Paradox Optimizer Panel */}
      <AnimatePresence>
        {showSpacingParadoxAdvisor && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-5 font-sans"
          >
            <div className="bg-gradient-to-r from-[#1d0e1b] to-[#120716] border border-rose-900/60 p-5 rounded-2xl flex flex-col gap-4 font-sans shadow-xl">
              <div>
                <h4 className="text-sm font-black text-rose-300 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                  <Zap size={14} className="text-rose-400" /> Solving the Spacing Paradox (FSRS Optimization)
                </h4>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-sans">
                  The <strong className="text-rose-400">Spacing Paradox</strong> is the ultimate trade-off in memory science:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2.5">
                  <div className="bg-rose-950/20 border border-rose-900/40 p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold text-rose-300 uppercase block tracking-wider mb-1">⚖️ Force A: The Spacing Benefit</span>
                    <p className="text-[11px] text-zinc-300 leading-normal font-sans">
                      Testing right before forgetting (low Retrievability) triggers enormous stability multipliers, making memory extremely durable upon success.
                    </p>
                  </div>
                  <div className="bg-indigo-950/20 border border-indigo-900/40 p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase block tracking-wider mb-1">📉 Force B: The Forgetting Risk</span>
                    <p className="text-[11px] text-zinc-300 leading-normal font-sans">
                      But waiting too long makes you likely to fail. A memory failure (lapse) resets card stability, forcing frustrating relearning runs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tuning Interface */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-900/40 flex flex-col gap-4 font-sans">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <span className="text-xs font-black text-slate-200">Set Your Target Memory Retention Rate:</span>
                    <p className="text-[11px] text-slate-400 font-sans">Controls how safe or aggressive your review intervals will be.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-rose-400 font-mono">
                      {Math.round(globalRetentionTarget * 100)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block font-sans">Desired Retention</span>
                  </div>
                </div>

                {/* Strategy Sliders / Quick Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: '80% (Extreme)', val: 0.80, desc: 'Ultra-spaced, lowest study load, but 20% lapse rate' },
                    { label: '85% (Effortless)', val: 0.85, desc: '40% fewer reviews, slightly higher forgetting rate' },
                    { label: '90% (Standard)', val: 0.90, desc: 'Recommended global ideal balance' },
                    { label: '95% (Rigorous)', val: 0.95, desc: 'Shorter reviews, near-zero lapses, high review load' }
                  ].map(preset => (
                    <button
                      key={preset.val}
                      onClick={() => setGlobalRetentionTarget(preset.val)}
                      type="button"
                      className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between h-24 font-sans ${
                        globalRetentionTarget === preset.val 
                          ? 'bg-rose-950/50 border-rose-500 text-white shadow-md' 
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                      }`}
                    >
                      <span className="text-[11px] font-black">{preset.label}</span>
                      <span className="text-[9px] leading-tight block text-slate-400 mt-1">{preset.desc}</span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-slate-900 font-sans">
                  <div className="text-xs text-slate-300 font-sans">
                    💡 Selecting <strong className="text-rose-400">{Math.round(globalRetentionTarget * 100)}%</strong> will update the FSRS curve model.
                    {globalRetentionTarget < 0.95 && " This will stretch out review intervals and shrink your pending workload!"}
                    {globalRetentionTarget >= 0.95 && " This will shorten review intervals to preserve high speech correctness."}
                  </div>
                  {onUpdateDeck && deck.length > 0 ? (
                    <button
                      onClick={() => {
                        const updatedDeck = deck.map(card => {
                          const nextRetention = globalRetentionTarget;
                          const nextInterval = calculateFSRSInterval(card.stability, nextRetention);
                          return {
                            ...card,
                            desiredRetention: nextRetention,
                            dueDay: card.lastReviewDay + nextInterval
                          };
                        });
                        onUpdateDeck(updatedDeck);
                        setSuccessMessage(`Success! Updated target retention of ${deck.length} cards to ${Math.round(globalRetentionTarget * 100)}% and rescheduled.`);
                        setTimeout(() => setSuccessMessage(''), 4000);
                      }}
                      type="button"
                      className="whitespace-nowrap px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold text-xs rounded-xl hover:from-rose-500 hover:to-rose-600 active:scale-95 transition-all shadow-md font-sans"
                    >
                      Apply & Reschedule Deck
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic font-sans">No cards available in deck to reschedule.</div>
                  )}
                </div>

                {successMessage && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center font-bold font-sans">
                    {successMessage}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Dashboard Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-extrabold uppercase block font-sans tracking-wide">Total Learned</span>
            <span className="text-lg font-black text-white font-sans">{deck.length} Phrases</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${cardsDueToday > 0 ? 'bg-red-500/10 border border-red-500/10 text-red-500 animate-pulse' : 'bg-indigo-500/10 border border-indigo-500/10 text-indigo-400'}`}>
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-extrabold uppercase block font-sans tracking-wide">Pending Due</span>
            <span className={`text-lg font-black font-sans ${cardsDueToday > 0 ? 'text-red-400' : 'text-slate-200'}`}>
              {cardsDueToday} Cards
            </span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-extrabold uppercase block font-sans tracking-wide">Avg Stability</span>
            <span className="text-lg font-black text-white font-sans">{averageStability} Days</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/10 text-violet-500 flex items-center justify-center font-bold">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-extrabold uppercase block font-sans tracking-wide">Avg Difficulty</span>
            <span className="text-lg font-black text-white font-sans">{averageDifficulty} / 10</span>
          </div>
        </div>
      </div>

      {/* Primary Toolbar controls */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-900 mb-5">
        <div className="relative w-full md:w-72">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
            <Search size={14} />
          </span>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search learned phrases..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
          {(['all', 'new', 'learning', 'reviewing', 'mastered'] as const).map(state => {
            const isActive = filterState === state;
            const count = state === 'all' 
              ? deck.length 
              : deck.filter(c => c.state === state).length;

            return (
              <button
                key={state}
                onClick={() => setFilterState(state)}
                className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold uppercase tracking-wider transition-colors font-sans ${
                  isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                {state} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed calculation drawer modal */}
      <AnimatePresence>
        {selectedCardForCalculations && (
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            className="border border-indigo-500/20 bg-slate-950 p-5 rounded-2xl mb-5 flex flex-col gap-3 font-sans shadow-lg relative"
          >
            <div className="flex items-center justify-between border-b border-indigo-950 pb-2">
              <span className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                <Sliders size={13} /> Interactive FSRS Calculator Recommendation
              </span>
              <button 
                onClick={() => setSelectedCardForCalculations(null)}
                className="text-[10px] text-slate-400 hover:text-white uppercase font-black"
              >
                close calculator
              </button>
            </div>
            
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-900">
              <span className="text-[9px] text-indigo-400 uppercase font-bold tracking-wide">Active Sentence Selected:</span>
              <p className="text-sm font-black text-slate-100 italic mt-0.5">"{selectedCardForCalculations.text}"</p>
              <p className="text-[10px] text-slate-400 italic mt-1">{selectedCardForCalculations.context}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-1">
              <div className="bg-slate-900 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[9.5px] text-slate-400 font-extrabold uppercase">Calculated Due status</span>
                <p className="text-sm font-bold text-white mt-1.5 leading-tight">
                  {selectedCardForCalculations.dueDay <= activeDay 
                    ? <span className="text-red-400">🚨 DUE NOW</span> 
                    : <span className="text-indigo-400">📅 Due Day {selectedCardForCalculations.dueDay} (In {selectedCardForCalculations.dueDay - activeDay} Days)</span>
                  }
                </p>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[9.5px] text-slate-400 font-extrabold uppercase">Retrievability probability</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm font-bold text-emerald-400">
                    {calculateRetrievability(selectedCardForCalculations)}% Probability
                  </span>
                  <div className="w-12 bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${calculateRetrievability(selectedCardForCalculations)}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[9.5px] text-slate-400 font-extrabold uppercase">FSRS Memory Advice</span>
                <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                  Best option is to let memory decay to <strong className="text-amber-400">90% Retrievability</strong> before reviewing.
                </p>
              </div>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-900/30 p-3 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs text-slate-300">Would you like to initiate a voice review simulation for this sentence right now?</span>
              <div className="flex gap-2">
                {onSelectPractice && (
                  <button 
                    onClick={() => {
                      onSelectPractice(selectedCardForCalculations);
                    }}
                    className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    <Play size={11} /> Start Spoken Practice
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid List of Learned Sentences */}
      {filteredCards.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center p-12 text-center bg-slate-950/40 rounded-2xl border border-slate-900 font-sans">
          <BookOpen size={40} className="text-slate-700 animate-pulse mb-3" />
          <h4 className="text-base font-bold text-slate-300">No sentences found matching criteria</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
            Progress through different city locations with interactive conversation prompts, and correctly spoken paths will populate here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCards.map(card => {
            const retrievability = calculateRetrievability(card);
            
            let statusBadge = "bg-rose-500/15 border-rose-500/20 text-rose-400";
            if (card.state === 'learning') statusBadge = "bg-amber-500/15 border-amber-500/20 text-amber-400";
            else if (card.state === 'reviewing') statusBadge = "bg-indigo-500/15 border-indigo-500/20 text-indigo-400";
            else if (card.state === 'mastered') statusBadge = "bg-emerald-500/15 border-emerald-500/20 text-emerald-400";

            return (
              <motion.div 
                key={card.id}
                onClick={() => setSelectedCardForCalculations(card)}
                className={`p-5 rounded-2xl bg-[#0b0e22] border cursor-pointer hover:bg-slate-900/80 transition-all font-sans relative ${
                  selectedCardForCalculations?.id === card.id ? 'border-amber-500' : 'border-slate-850'
                }`}
              >
                {/* Visual state representation */}
                <div className="flex items-center justify-between mb-3.5 gap-2">
                  <span className="text-[10px] text-slate-400 font-bold max-w-[70%] truncate block uppercase">
                    📁 {card.context}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getPathBadge(card.choiceType)}
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${statusBadge}`}>
                      {card.state}
                    </span>
                    <div className="flex gap-0.5 items-center select-none" title={`Knowledge level: ${card.state}`}>
                      {card.state === 'mastered' && (
                        <>
                          <Star size={9} className="fill-amber-400 text-amber-400" />
                          <Star size={9} className="fill-amber-400 text-amber-400" />
                          <Star size={9} className="fill-amber-400 text-amber-400" />
                        </>
                      )}
                      {card.state === 'reviewing' && (
                        <>
                          <Star size={9} className="fill-indigo-400 text-indigo-400" />
                          <Star size={9} className="fill-indigo-400 text-indigo-400" />
                          <Star size={9} className="text-slate-800" />
                        </>
                      )}
                      {card.state === 'learning' && (
                        <>
                          <Star size={9} className="fill-amber-500/60 text-amber-500/60" />
                          <Star size={9} className="text-slate-800" />
                          <Star size={9} className="text-slate-800" />
                        </>
                      )}
                      {card.state === 'new' && (
                        <>
                          <Star size={9} className="text-slate-800" />
                          <Star size={9} className="text-slate-800" />
                          <Star size={9} className="text-slate-800" />
                        </>
                      )}
                    </div>
                    {onDeleteCard && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this learned item from database review?")) {
                            onDeleteCard(card.id);
                          }
                        }}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                        title="Delete learned phrase"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Question / Prompt info */}
                <div className="mb-3">
                  {card.historyContext && card.historyContext.length > 0 && (
                    <div className="mb-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-900/60 flex flex-col gap-1 text-[11px]">
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block">
                        Conversational History context
                      </span>
                      {card.historyContext.map((turn, i) => (
                        <div key={i} className="flex flex-col gap-0.5 leading-snug border-b border-slate-900/40 last:border-0 pb-1 last:pb-0 mb-1 last:mb-0">
                          <span className="text-[#a1a1aa] italic">
                            <strong className="text-orange-400 not-italic font-bold font-sans">NPC:</strong> "{turn.npc}"
                          </span>
                          {motherTongue && motherTongue !== 'English' && (
                            <TranslatedText text={turn.npc} to={motherTongue} className="text-[10px] text-orange-400/80 mb-1 ml-4" />
                          )}
                          <span className="text-slate-300">
                            <strong className="text-[#38bdf8] font-bold font-sans">You:</strong> "{turn.player}"
                          </span>
                          {motherTongue && motherTongue !== 'English' && (
                            <TranslatedText text={turn.player} to={motherTongue} className="text-[10px] text-sky-400/80 ml-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wide">Expected dialogue context:</p>
                  <p className="text-xs text-slate-300 italic mt-0.5 font-sans">"{card.front}"</p>
                  {motherTongue && motherTongue !== 'English' && (
                    <TranslatedText text={card.front} to={motherTongue} className="text-[10.5px] text-amber-500/85 italic font-sans" />
                  )}
                </div>

                {/* Target Learned Option phrasing */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900 mb-4">
                  <p className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-wide">Learned Phrasing Target:</p>
                  <p className="text-sm font-black text-slate-100 font-mono italic leading-relaxed mt-0.5">
                    "{card.text}"
                  </p>
                  {motherTongue && motherTongue !== 'English' && (
                    <TranslatedText text={card.text} to={motherTongue} className="text-[10.5px] text-amber-500/85 italic font-sans mt-0.5" />
                  )}
                </div>

                {/* FSRS curve parameters & schedule metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-slate-900/60 pt-3 text-[10px] font-mono select-none">
                  <div className="bg-slate-950 px-2 py-1.5 rounded border border-slate-900">
                    <span className="text-[8px] uppercase font-bold text-slate-500 block leading-none mb-1">Stability</span>
                    <span className="text-slate-300 font-medium">{card.stability} Days</span>
                  </div>

                  <div className="bg-slate-950 px-2 py-1.5 rounded border border-slate-900">
                    <span className="text-[8px] uppercase font-bold text-slate-500 block leading-none mb-1">Difficulty</span>
                    <span className="text-slate-300 font-medium">{card.difficulty}/10</span>
                  </div>

                  <div className="bg-slate-950 px-2 py-1.5 rounded border border-slate-900">
                    <span className="text-[8px] uppercase font-bold text-slate-500 block leading-none mb-1">Retrievability</span>
                    <span className={`font-black uppercase tracking-wider ${retrievability >= 85 ? 'text-emerald-400' : retrievability >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                      {retrievability}%
                    </span>
                  </div>

                  <div className="bg-slate-950 px-2 py-1.5 rounded border border-slate-900 text-right">
                    <span className="text-[8px] uppercase font-bold text-slate-500 block leading-none mb-1 text-left">FSRS Status</span>
                    <span className="text-indigo-400 font-bold truncate block">
                      {card.dueDay <= activeDay ? "🚨 DUE NOW" : `Day ${card.dueDay}`}
                    </span>
                  </div>
                </div>

                {/* FSRS-4.5 Advanced Telemetry Tracing Details */}
                <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-2 mt-2 pt-2 border-t border-dashed border-slate-900/40 text-[9.5px] font-mono text-slate-400 select-none">
                  <div>
                    <span className="inline-block text-[8.5px] text-slate-500 mr-1 uppercase">FSRS St:</span>
                    <span className="text-amber-300 font-black">{card.fsrsState || 'New'}</span>
                  </div>
                  <div>
                    <span className="inline-block text-[8.5px] text-slate-500 mr-1 uppercase">Reps/Laps:</span>
                    <span className="text-indigo-300">{(card.reps || 0)} / <span className={(card.lapses ?? 0) > 0 ? "text-red-400 font-bold" : "text-slate-400"}>{(card.lapses || 0)}</span></span>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <span className="inline-block text-[8.5px] text-slate-500 uppercase">Target R:</span>
                    {onUpdateDeck ? (
                      <select
                        value={card.desiredRetention || 0.90}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const updatedDeck = deck.map(c => {
                            if (c.id === card.id) {
                              const newInterval = calculateFSRSInterval(c.stability, val);
                              return {
                                ...c,
                                desiredRetention: val,
                                dueDay: c.lastReviewDay + newInterval
                              };
                            }
                            return c;
                          });
                          onUpdateDeck(updatedDeck);
                        }}
                        className="bg-slate-950 border border-slate-800 text-emerald-300 text-[10px] rounded px-1 py-0.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="0.80">80%</option>
                        <option value="0.85">85%</option>
                        <option value="0.90">90%</option>
                        <option value="0.93">93%</option>
                        <option value="0.95">95%</option>
                      </select>
                    ) : (
                      <span className="text-emerald-300">{Math.round((card.desiredRetention || 0.90) * 100)}%</span>
                    )}
                  </div>
                  <div className="text-right ml-auto sm:ml-0">
                    <span className="inline-block text-[8.5px] text-slate-500 mr-1 uppercase text-left">Practice:</span>
                    <span className="text-sky-300 font-bold">
                      {(card.conversationSuccess || 0)} Correct | {(card.conversationSuccess || 0) + (card.conversationFailure || 0)} Total Attempts
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
};
