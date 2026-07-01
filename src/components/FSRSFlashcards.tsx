/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flashcard, DialogueChoice } from '../types';
import { Award, BookOpen, Clock, Calendar, CheckSquare, Trash2, Heart, Sparkles, Volume2 } from 'lucide-react';
import { TranslatedText } from './TranslatedText';
import { IntonationGuide } from './IntonationGuide';

interface FSRSFlashcardsProps {
  deck: Flashcard[];
  activeDay: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  motherTongue?: 'English' | 'Mandarin Chinese' | 'Spanish' | 'Vietnamese';
  onReviewRating: (cardId: string, grade: number) => void;
  onExit: () => void;
}

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
    <span className={`inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${item.bg} ${item.text} ${item.border} ml-2 align-middle`}>
      Style: {item.label}
    </span>
  );
};

export const FSRSFlashcards: React.FC<FSRSFlashcardsProps> = ({
  deck,
  activeDay,
  difficulty,
  motherTongue,
  onReviewRating,
  onExit
}) => {
  const [reviewIdx, setReviewIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Retrieve cards due on or before active day
  const dueCards = deck.filter((c) => c.dueDay <= activeDay);
  const activeCard = dueCards[reviewIdx] || null;

  // Speech TTS synthesizer for flashcard questions
  const speakCardText = (phrase: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleaned = phrase.split(' [Voice')[0].split('[')[0].trim();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = 'en-US';
      utterance.pitch = 1.0;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Auto-play the front question audio of the active card when it loads
  useEffect(() => {
    if (activeCard) {
      speakCardText(activeCard.front);
    }
  }, [activeCard]);

  if (dueCards.length === 0 || reviewIdx >= dueCards.length) {
    return (
      <div className="flex-grow flex items-center justify-center p-6 sm:p-12 bg-gradient-to-b from-slate-950 to-indigo-955/20 rounded-[2rem]">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[2rem] p-6 sm:p-8 text-center flex flex-col gap-5 shadow-2xl relative">
          <div className="w-16 h-16 mx-auto bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl flex items-center justify-center text-3xl mb-1 shadow-lg">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white font-sans tracking-wide">Dynamic Review Cleared!</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed font-sans">All pending spaced repeaters are up to date.</p>
          </div>

          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Current day calendar:</span>
            <span className="text-amber-500 font-sans">Day {activeDay}</span>
          </div>

          <button 
            onClick={onExit}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-extrabold py-3.5 px-6 rounded-2xl text-xs transition-transform active:scale-95 shadow-xl shadow-amber-600/10 uppercase tracking-widest font-sans"
          >
            Enter Dream City Map
          </button>
        </div>
      </div>
    );
  }

  // Resolve standard active choices preview based on level
  const getReviewChoices = () => {
    if (difficulty === 'Beginner') {
      if (activeCard.beginner_choices && activeCard.beginner_choices.length > 0) return activeCard.beginner_choices;
    } else if (difficulty === 'Intermediate') {
      if (activeCard.intermediate_choices && activeCard.intermediate_choices.length > 0) return activeCard.intermediate_choices;
    } else {
      if (activeCard.advanced_choices && activeCard.advanced_choices.length > 0) return activeCard.advanced_choices;
    }
    return [];
  };

  const choiceList = getReviewChoices();

  const handleRateCard = (grade: number) => {
    onReviewRating(activeCard.id, grade);
    setShowAnswer(false);
    // Advance review index
    setReviewIdx(reviewIdx + 1);
  };

  return (
    <div className="flex-grow flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden bg-gradient-to-b from-slate-950 to-indigo-950/25 w-full rounded-[2rem]">
      
      {/* Scroll indicator banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-slate-900 pb-4 mb-4 font-sans">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider font-sans leading-none">Spaced Repetition Review Panel</h3>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 rounded-xl text-[10px] text-amber-500 font-extrabold uppercase font-sans">
            Phrase {reviewIdx + 1} of {dueCards.length} Due
          </div>
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase text-rose-400 hover:text-rose-350 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/15 cursor-pointer transition-all"
            title="Exit Session"
          >
            Exit to Dashboard
          </button>
        </div>
      </div>

      {/* Main Flashcard Box Container */}
      <div className="my-auto max-w-2xl mx-auto w-full flex flex-col gap-5 py-4 font-sans">
        <div className="text-center mb-1">
          <span className="inline-flex items-center gap-1 text-[9px] bg-slate-900 text-amber-500 font-bold uppercase tracking-widest border border-slate-800 px-3 py-1 rounded-full">
            <Sparkles size={11} className="animate-pulse" /> Memory Curve Calibration
          </span>
        </div>

        {activeCard.historyContext && activeCard.historyContext.length > 0 && (
          <div className="bg-slate-950/80 rounded-2xl border border-slate-850 p-4 max-h-[170px] overflow-y-auto flex flex-col gap-2 shadow-inner">
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider block border-b border-indigo-950/40 pb-1 mb-1">
              💬 Dialogue Context (Previous Turns)
            </span>
            <div className="flex flex-col gap-2">
              {activeCard.historyContext.map((turn, i) => (
                <div key={i} className="flex flex-col text-left gap-0.5 text-xs bg-slate-900/30 p-2 rounded-xl border border-slate-850/40">
                  <p className="text-[#a1a1aa] italic">
                    <strong className="text-orange-400 not-italic font-bold font-sans">NPC:</strong> "{turn.npc}"
                  </p>
                  {motherTongue && motherTongue !== 'English' && (
                    <TranslatedText text={turn.npc} to={motherTongue} className="text-[10px] text-orange-400/80 mb-1 ml-4" />
                  )}
                  <p className="text-slate-300 font-medium">
                    <strong className="text-[#38bdf8] font-bold font-sans">You:</strong> "{turn.player}"
                  </p>
                  {motherTongue && motherTongue !== 'English' && (
                    <TranslatedText text={turn.player} to={motherTongue} className="text-[10px] text-sky-400/80 ml-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <motion.div 
          initial={{ rotateX: 0 }}
          animate={{ rotateX: showAnswer ? 360 : 0 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900/60 border border-slate-800/80 p-6 sm:p-8 rounded-[2rem] text-center shadow-2xl relative backdrop-blur-md"
        >
          <p className="text-xs text-slate-400 font-semibold mb-2 flex items-center justify-center gap-2 flex-wrap">
            <span>{activeCard?.context}</span>
            {activeCard && getPathBadge(activeCard.choiceType)}
          </p>
          <div className="flex flex-col items-center justify-center gap-3">
            <h4 className="text-lg sm:text-xl font-black text-white leading-relaxed italic font-serif text-center">
              "{activeCard?.front}"
            </h4>
            {motherTongue && motherTongue !== 'English' && activeCard && (
              <TranslatedText text={activeCard.front} to={motherTongue} className="text-sm text-amber-400 italic font-sans" />
            )}
            {activeCard && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  speakCardText(activeCard.front);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 transition-all text-[11px] font-black uppercase tracking-wider cursor-pointer font-sans"
                title="Play Audio"
              >
                <Volume2 size={13} className="animate-pulse" /> Listen to Audio
              </button>
            )}
          </div>
        </motion.div>

        {/* Choice preview or grading buttons */}
        <div className="relative mt-2">
          <AnimatePresence mode="wait">
            {!showAnswer ? (
              <motion.div 
                key="questions"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col gap-3"
              >
                {/* Reveal Answer action */}
                <button 
                  onClick={() => setShowAnswer(true)}
                  className="w-full flex items-center justify-center gap-2 p-4.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black rounded-2xl transition-all duration-200 shadow-lg text-xs tracking-wider uppercase font-sans"
                >
                  <Clock size={13} className="animate-spin" /> Reveal Recalled Phrase & Rate
                </button>

                <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-900 text-center text-[10px] text-slate-400 font-bold">
                  Take a moment to formulate the ideal reply inside your head, then click above.
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="ratings"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-slate-900/85 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 text-center shadow-inner"
              >
                <div>
                  <span className="inline-block text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block mb-1">Target Phrasing Answer</span>
                  <p className="text-base font-black text-rose-300 italic">"{activeCard?.text}"</p>
                  {motherTongue && motherTongue !== 'English' && activeCard && (
                    <TranslatedText text={activeCard.text} to={motherTongue} className="text-sm text-amber-500 italic mt-0.5" />
                  )}
                  {activeCard && (
                    <button 
                      onClick={() => speakCardText(activeCard.text)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all text-[9.5px] font-black uppercase tracking-wider mt-2.5 cursor-pointer font-sans"
                      title="Play answer audio"
                    >
                      <Volume2 size={11} /> Play Answer Audio
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-850 pt-4 mt-2">
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mb-3">Rate your memory retrieval effort (FSRS spacing updates):</p>
                  
                  {/* FSRS rating buttons */}
                  <div className="grid grid-cols-4 gap-2 font-semibold">
                    <button 
                      onClick={() => handleRateCard(1)}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/20 border border-slate-850 hover:border-rose-500/30 text-slate-300 transition-transform active:scale-95 text-center"
                    >
                      <span className="text-xs font-black text-rose-400">Again</span>
                      <span className="text-[8px] text-slate-500 mt-1">Retry</span>
                    </button>
                    <button 
                      onClick={() => handleRateCard(2)}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 hover:bg-amber-955/20 border border-slate-855 hover:border-amber-500/30 text-slate-300 transition-transform active:scale-95 text-center"
                    >
                      <span className="text-xs font-black text-amber-400">Hard</span>
                      <span className="text-[8px] text-slate-500 mt-1">2d Interval</span>
                    </button>
                    <button 
                      onClick={() => handleRateCard(3)}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 hover:bg-indigo-955/20 border border-slate-855 hover:border-indigo-500/30 text-slate-300 transition-transform active:scale-95 text-center"
                    >
                      <span className="text-xs font-black text-indigo-400">Good</span>
                      <span className="text-[8px] text-slate-500 mt-1">4d Interval</span>
                    </button>
                    <button 
                      onClick={() => handleRateCard(4)}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 hover:bg-emerald-955/20 border border-slate-855 hover:border-emerald-500/30 text-slate-300 transition-transform active:scale-95 text-center"
                    >
                      <span className="text-xs font-black text-emerald-400">Easy</span>
                      <span className="text-[8px] text-slate-500 mt-1">8d Interval</span>
                    </button>
                  </div>
                </div>

                {activeCard && (
                  <div className="border-t border-slate-850 pt-4 mt-2 text-left">
                    <IntonationGuide text={activeCard.text} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Spacing statistics footer */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold border-t border-rose-900/10 pt-4 mt-auto font-sans uppercase">
        <span className="flex items-center gap-1"><Clock size={11} /> Memory Strength: {activeCard.stability} Days</span>
        <span className="flex items-center gap-1"><Calendar size={11} /> Next Due Calendar: Day {activeCard.dueDay}</span>
      </div>

    </div>
  );
};
