/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PlayerProfile, CharacterProficiency } from '../types';
import { User, Shield, Sparkles, BookOpen, UserCheck, Heart } from 'lucide-react';

// Import our beautiful custom generated anime avatars
import davidAvatar from '../assets/images/david_anime_avatar_1782570662342.jpg';
import elenaAvatar from '../assets/images/elena_anime_avatar_1782570676312.jpg';
import marcusAvatar from '../assets/images/marcus_anime_avatar_1782570693075.jpg';
import chloeAvatar from '../assets/images/chloe_anime_avatar_1782570705681.jpg';

interface CharacterCreationProps {
  onComplete: (profile: PlayerProfile, baseline: CharacterProficiency) => void;
}

// Predefined Anime Characters with rich details
const ANIME_ARCHETYPES = [
  {
    id: 'chloe',
    name: 'Chloe',
    role: 'Creative Designer',
    gender: 'female' as const,
    path: 'Student',
    image: chloeAvatar,
    bg: 'bg-indigo-950/40 border-pink-500/35 shadow-pink-500/10',
    color: 'text-pink-400',
    borderColor: 'border-pink-500/40',
    badgeBg: 'bg-pink-500/10 text-pink-400 border border-pink-500/25',
    description: 'A cheerful, imaginative artist with friendly, expressive visual dialogue patterns.',
    tag: 'Designer'
  },
  {
    id: 'david',
    name: 'David',
    role: 'Friendly Academic',
    gender: 'male' as const,
    path: 'Student',
    image: davidAvatar,
    bg: 'bg-slate-900 border-blue-500/35 shadow-blue-500/10',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    badgeBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/25',
    description: 'A studious, helpful school student with a passion for academic speech styles.',
    tag: 'Academic'
  },
  {
    id: 'elena',
    name: 'Elena',
    role: 'Confident Executive',
    gender: 'female' as const,
    path: 'Intern',
    image: elenaAvatar,
    bg: 'bg-indigo-950/40 border-amber-500/35 shadow-amber-500/10',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    badgeBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    description: 'A sharp, elegant corporate professional specializing in clear, executive business dialogues.',
    tag: 'Executive'
  },
  {
    id: 'marcus',
    name: 'Marcus',
    role: 'Tech Maverick',
    gender: 'male' as const,
    path: 'Tourist',
    image: marcusAvatar,
    bg: 'bg-slate-900 border-emerald-500/35 shadow-emerald-500/10',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    description: 'An innovative tech coder who prefers casual, modern street speech and direct slang.',
    tag: 'Innovator'
  }
];

export const CharacterCreation: React.FC<CharacterCreationProps> = ({ onComplete }) => {
  const [selectedArchetypeId, setSelectedArchetypeId] = useState('chloe');
  const [customName, setCustomName] = useState('Chloe');
  const [path, setPath] = useState('Student');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [proficiency, setProficiency] = useState<CharacterProficiency>('Beginner');
  const [motherTongue, setMotherTongue] = useState<'English' | 'Mandarin Chinese' | 'Spanish' | 'Vietnamese'>('English');

  // Handle selecting an anime character
  const handleSelectArchetype = (id: string) => {
    setSelectedArchetypeId(id);
    const archetype = ANIME_ARCHETYPES.find(a => a.id === id);
    if (archetype) {
      setCustomName(archetype.name);
      setPath(archetype.path);
      setGender(archetype.gender);
    }
  };

  const handleCreate = () => {
    let masteredCount = 0;
    if (proficiency === 'Intermediate') masteredCount = 100;
    if (proficiency === 'Advanced') masteredCount = 500;

    const activeArchetype = ANIME_ARCHETYPES.find(a => a.id === selectedArchetypeId) || ANIME_ARCHETYPES[0];

    const initialProfile: PlayerProfile = {
      playerName: customName.trim() || activeArchetype.name,
      playerPath: path,
      playerGender: gender,
      motherTongue: motherTongue,
      avatarId: activeArchetype.id,
      avatarUrl: activeArchetype.image,
      day: 1,
      money: 500,
      fluencyXp: proficiency === 'Beginner' ? 0 : proficiency === 'Intermediate' ? 1200 : 5000,
      confidence: 50,
      energy: 100,
      streak: 1,
      streakFreezeCount: 1,
      lastActiveDate: new Date().toDateString(),
      sentencesMastered: masteredCount,
      conversationsToday: 0,
      objectives: [
        { id: 'obj1', text: 'Confirm reservation or get waited at Restaurant', category: 'Restaurant', done: false },
        { id: 'obj2', text: 'Review flashcards to lock in memory patterns', category: 'General', done: false },
        { id: 'obj3', text: 'Engage with a friend to share study parameters', category: 'Social', done: false }
      ]
    };

    onComplete(initialProfile, proficiency);
  };

  const activeArchetype = ANIME_ARCHETYPES.find(a => a.id === selectedArchetypeId) || ANIME_ARCHETYPES[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-3 sm:p-6 md:p-8 max-w-5xl mx-auto my-auto flex flex-col gap-6 w-full min-h-[600px] font-sans"
    >
      {/* Title Header for Mobile only */}
      <div className="md:hidden text-center mb-1 flex flex-col items-center">
        <span className="inline-flex items-center gap-1.5 text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
          <Sparkles size={11} /> High-Fidelity English Simulation Setup
        </span>
        <h3 className="text-2xl font-extrabold text-white leading-none font-sans">Initialize Your Profile</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">Select your cartoon/anime character model and customize starting parameters.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-stretch justify-center w-full">
        {/* LEFT: Avatar Preview Card */}
      <div className={`w-full md:w-[40%] flex flex-col items-center justify-between border p-5 sm:p-6 rounded-3xl relative backdrop-blur-md transition-all duration-300 ${activeArchetype.bg} flex-shrink-0 shadow-2xl`}>
        
        {/* Anime Title Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-black/40 border border-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
          <Heart size={11} className="text-pink-500 fill-pink-500 animate-pulse" />
          <span className="text-[9px] font-black text-slate-100 uppercase tracking-widest">Anime Style Sim</span>
        </div>

        {/* Floating Portrait Frame */}
        <motion.div 
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-40 h-52 sm:w-56 sm:h-72 rounded-2xl border-4 border-slate-700/45 shadow-2xl mb-4 bg-indigo-950/20 overflow-hidden relative mt-6"
        >
          <img 
            src={activeArchetype.image} 
            alt={`${activeArchetype.name} Portrait`} 
            className="w-full h-full object-cover object-top filter contrast-[1.05]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 text-center">
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${activeArchetype.color}`}>{activeArchetype.role}</span>
          </div>
        </motion.div>

        {/* Character Story Summary */}
        <div className="text-center mt-2 flex-grow flex flex-col justify-end">
          <h4 className="font-sans text-2xl font-black tracking-tight text-white mb-1.5">{customName || activeArchetype.name}</h4>
          <div className="flex justify-center gap-1.5 mb-3">
            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${activeArchetype.badgeBg}`}>
              {path}
            </span>
            <span className="text-[10px] font-extrabold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full capitalize">
              {gender}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto italic px-2">
            "{activeArchetype.description}"
          </p>
        </div>
      </div>

      {/* RIGHT: Character Archetype Choice & Setup Form */}
      <div className="w-full md:w-[60%] bg-slate-950/40 border border-slate-900 backdrop-blur-md p-5 sm:p-7 md:p-8 rounded-3xl flex flex-col gap-5 justify-between shadow-2xl relative">
        <div className="hidden md:block">
          <span className="inline-flex items-center gap-1.5 text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <Sparkles size={11} /> High-Fidelity English Simulation Setup
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-none font-sans">Initialize Your Profile</h3>
          <p className="text-xs text-slate-400 mt-1.5">Select your cartoon/anime character model and customize starting parameters.</p>
        </div>

        {/* ARCHETYPE SELECTOR */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-amber-500/90 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck size={11} /> Select Anime Style Model
          </label>
          <div className="grid grid-cols-4 gap-2.5">
            {ANIME_ARCHETYPES.map((arch) => {
              const isSelected = selectedArchetypeId === arch.id;
              return (
                <button
                  key={arch.id}
                  type="button"
                  onClick={() => handleSelectArchetype(arch.id)}
                  className={`p-1.5 sm:p-2 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1.5 relative overflow-hidden cursor-pointer ${
                    isSelected 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] scale-102' 
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {/* Circle Portrait Mini Thumbnail */}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 transition-transform duration-300 ${isSelected ? 'border-amber-400 scale-105' : 'border-slate-800'}`}>
                    <img 
                      src={arch.image} 
                      alt={arch.name} 
                      className="w-full h-full object-cover object-top filter contrast-[1.05]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black">{arch.name}</span>
                  <span className="text-[7.5px] opacity-75 font-black uppercase tracking-wider leading-none">{arch.tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <User size={12} className="text-slate-500" /> Character Name (Editable)
          </label>
          <input 
            type="text" 
            value={customName}
            onChange={(e) => setCustomName(e.target.value.slice(0, 18))}
            placeholder="e.g. Mia" 
            className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-2.5 sm:py-3 text-slate-200 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all w-full text-xs shadow-inner"
          />
        </div>

        {/* Mother Tongue Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-slate-500 font-sans text-xs">🌐</span> Choose Mother Tongue (L1)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['English', 'Mandarin Chinese', 'Spanish', 'Vietnamese'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setMotherTongue(lang)}
                className={`py-2 px-1 rounded-xl border text-[10px] sm:text-[11px] font-bold transition-all text-center cursor-pointer ${
                  motherTongue === lang 
                    ? 'bg-amber-500/10 border-amber-500/80 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.08)] font-black' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                {lang === 'Mandarin Chinese' ? 'Mandarin' : lang}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-slate-500 leading-none mt-0.5 font-sans">
            {motherTongue === 'English' 
              ? "All game objectives and dialogues will remain standard immersion English." 
              : `Translations in ${motherTongue} will appear underneath key dialogs.`}
          </p>
        </div>

        {/* Path Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={12} className="text-slate-500" /> Choose Career Path
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['Student', 'Intern', 'Tourist'].map((p) => (
              <button
                key={p}
                onClick={() => setPath(p)}
                className={`py-2 px-3 rounded-xl border text-[10px] sm:text-[11px] font-bold transition-all text-center cursor-pointer ${
                  path === p 
                    ? 'bg-amber-500/10 border-amber-500/80 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.08)] font-black' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Starting Vocabulary Standing */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Shield size={12} className="text-slate-500" /> Starting Proficiency Standing
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setProficiency(lvl)}
                className={`p-2.5 sm:p-3 rounded-xl border transition-all text-center flex flex-col gap-0.5 cursor-pointer ${
                  proficiency === lvl 
                    ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-xl font-black' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                <span className="text-xs uppercase tracking-wider">{lvl}</span>
                <span className="text-[8px] opacity-85 leading-tight">
                  {lvl === 'Beginner' ? '0 Cards' : lvl === 'Intermediate' ? '100 Vocab' : '500 Vocab'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Confirm Initialize */}
        <button 
          onClick={handleCreate}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-extrabold py-3.5 px-6 rounded-xl transition-all hover:scale-[1.015] active:scale-[0.985] shadow-xl shadow-amber-600/15 text-center text-xs w-full mt-2 tracking-widest font-sans uppercase cursor-pointer"
        >
          Initialize Sim Profile &rarr;
        </button>
      </div>
      </div>
    </motion.div>
  );
};
