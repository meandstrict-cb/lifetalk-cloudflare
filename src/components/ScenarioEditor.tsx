/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DialogueScenario, DialogueChoice, CharacterProficiency } from '../types';
import { Plus, Trash, Download, Upload, RotateCcw, Edit3, Play, X, Sliders, CheckSquare } from 'lucide-react';
import { toast } from './Toast';

interface ScenarioEditorProps {
  library: Record<string, DialogueScenario[]>;
  onSaveScenario: (locationKey: string, scenario: DialogueScenario, originalIndex: number | null) => void;
  onDeleteScenario: (locationKey: string, index: number) => void;
  onResetLibrary: () => void;
  onImportLibrary: (data: Record<string, DialogueScenario[]>) => void;
  onPlayTest: (locationKey: string, scenario: DialogueScenario) => void;
  onExit: () => void;
}

export const ScenarioEditor: React.FC<ScenarioEditorProps> = ({
  library,
  onSaveScenario,
  onDeleteScenario,
  onResetLibrary,
  onImportLibrary,
  onPlayTest,
  onExit
}) => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'create'>('scenarios');
  const [filterLoc, setFilterLoc] = useState<string>('all');

  // Creation states
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formLocation, setFormLocation] = useState<string>('restaurant_entrance');
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formBgClass, setFormBgClass] = useState('sprite-bg-cafe');
  const [formBgUrl, setFormBgUrl] = useState('');
  const [formNpcName, setFormNpcName] = useState('Barista');
  const [formNpcGender, setFormNpcGender] = useState<'male' | 'female'>('female');
  const [formNpcAccent, setFormNpcAccent] = useState<'US' | 'UK'>('US');
  const [formNpcVoiceName, setFormNpcVoiceName] = useState<string>('');
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [formNpcPortrait, setFormNpcPortrait] = useState('portrait-barista');
  const [formNpcAvatar, setFormNpcAvatar] = useState('sprite-avatar-barista');
  const [formNpcUrl, setFormNpcUrl] = useState('');
  const [formDesc, setFormDescription] = useState('');

  // Load and listen to speechSynthesis system voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
        setSystemVoices(englishVoices.length > 0 ? englishVoices : voices);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);
  
  // Turns array for multi-turn building
  const [formTurns, setFormTurns] = useState<{
    npc_message: string;
    isNpcEnd: boolean;
    bCorrect: string;
    bIncorrect: string;
    bAdvice: string;
    iFriendly: string;
    iNeutral: string;
    iDirect: string;
    aFriendly: string;
    aProfessional: string;
    aConfident: string;
  }[]>([
    {
      npc_message: 'Hi context prompt...',
      isNpcEnd: false,
      bCorrect: 'Correct sentence...',
      bIncorrect: 'Incorrect sentence...',
      bAdvice: 'Syntax pattern correction or hint text.',
      iFriendly: 'Friendly conversational...',
      iNeutral: 'Neutral request sentence...',
      iDirect: 'Direct transaction sentence...',
      aFriendly: 'Advanced beautiful friendly conversational...',
      aProfessional: 'Professional corporate request...',
      aConfident: 'Confident bold command...'
    }
  ]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(library, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "lifetalk_custom_scenarios.json");
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re: any) => {
        try {
          const parsed = JSON.parse(re.target.result);
          onImportLibrary(parsed);
          toast.success("Dialogue Scenario library imported successfully!");
        } catch {
          toast.error("Failed parsing dialogue file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const startEdit = (locKey: string, idx: number) => {
    const sc = library[locKey][idx];
    setEditingIndex(idx);
    setFormLocation(locKey);
    setFormId(sc.id);
    setFormTitle(sc.title);
    setFormBgClass(sc.bgClass);
    setFormBgUrl(sc.bgImageUrl || '');
    setFormNpcName(sc.npc_name);
    setFormNpcGender(sc.npc_gender || 'female');
    setFormNpcAccent(sc.npc_accent || 'US');
    setFormNpcVoiceName(sc.npc_voice_name || '');
    setFormNpcPortrait(sc.npc_portrait_class);
    setFormNpcAvatar(sc.npc_avatar_class);
    setFormNpcUrl(sc.npcOpenSceneUrl || '');
    setFormDescription(sc.description);

    const turnsData = sc.turns.map(turn => {
      const bc = turn.beginner_choices || [];
      const ic = turn.intermediate_choices || [];
      const ac = turn.advanced_choices || [];

      return {
        npc_message: turn.npc_message,
        isNpcEnd: turn.isNpcEnd || false,
        bCorrect: bc.find(c => c.type === 'correct')?.text || '',
        bIncorrect: bc.find(c => c.type === 'incorrect')?.text || '',
        bAdvice: bc.find(c => c.type === 'incorrect')?.explanation || '',
        iFriendly: ic.find(c => c.type === 'friendly')?.text || '',
        iNeutral: ic.find(c => c.type === 'neutral')?.text || '',
        iDirect: ic.find(c => c.type === 'direct')?.text || '',
        aFriendly: ac.find(c => c.type === 'friendly')?.text || '',
        aProfessional: ac.find(c => c.type === 'professional')?.text || '',
        aConfident: ac.find(c => c.type === 'confident')?.text || ''
      };
    });

    setFormTurns(turnsData);
    setActiveTab('create');
  };

  const handleAddNewTurnField = () => {
    setFormTurns([
      ...formTurns,
      {
        npc_message: '',
        isNpcEnd: false,
        bCorrect: '',
        bIncorrect: '',
        bAdvice: '',
        iFriendly: '',
        iNeutral: '',
        iDirect: '',
        aFriendly: '',
        aProfessional: '',
        aConfident: ''
      }
    ]);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedTurns = formTurns.map((turn, tIdx) => {
      const nextTurnIndex = (tIdx + 1) >= formTurns.length ? -1 : (tIdx + 1);

      if (turn.isNpcEnd) {
        return {
          npc_message: turn.npc_message,
          isNpcEnd: true,
          beginner_choices: [],
          intermediate_choices: [],
          advanced_choices: []
        };
      }

      return {
        npc_message: turn.npc_message,
        isNpcEnd: false,
        beginner_choices: [
          {
            id: 'A',
            type: 'correct',
            text: turn.bCorrect || 'Splendid request phrasing.',
            feedback: 'Perfect grammar choice!',
            explanation: 'Clean polite request.',
            fluency: 12,
            confidence: 6,
            money: 0,
            nextTurnIndex
          },
          {
            id: 'B',
            type: 'incorrect',
            text: turn.bIncorrect || 'Me want option now.',
            feedback: 'Wrong construction chosen!',
            explanation: turn.bAdvice || 'Unnatural construction. Let\'s learn a more polite pattern.',
            fluency: 2,
            confidence: -3,
            money: 0,
            nextTurnIndex
          }
        ],
        intermediate_choices: [
          {
            id: 'A',
            type: 'friendly',
            text: turn.iFriendly || 'Hey! Mind if I check that out?',
            feedback: 'Splendid friendly tone!',
            explanation: 'Good slang and rapport modifier.',
            fluency: 13,
            confidence: 7,
            money: 0,
            nextTurnIndex
          },
          {
            id: 'B',
            type: 'neutral',
            text: turn.iNeutral || 'Hello, I request this option.',
            feedback: 'Nice standard polite response.',
            explanation: 'Crisp objective parameter phrasing.',
            fluency: 11,
            confidence: 5,
            money: 0,
            nextTurnIndex
          },
          {
            id: 'C',
            type: 'direct',
            text: turn.iDirect || 'I will take this, thanks.',
            feedback: 'Quick and solid statement.',
            explanation: 'Fast-paced ordering form.',
            fluency: 12,
            confidence: 6,
            money: 0,
            nextTurnIndex
          }
        ],
        advanced_choices: [
          {
            id: 'A',
            type: 'friendly',
            text: turn.aFriendly || 'Hi! I would appreciate it if you could assist me.',
            feedback: 'Stellar advanced companion bond!',
            explanation: 'Charm and rapport structures.',
            fluency: 16,
            confidence: 9,
            money: 0,
            nextTurnIndex
          },
          {
            id: 'B',
            type: 'professional',
            text: turn.aProfessional || 'Good afternoon. I request permission to undertake this task.',
            feedback: 'Highly articulate business output.',
            explanation: 'Elevated syntax patterns.',
            fluency: 15,
            confidence: 8,
            money: 0,
            nextTurnIndex
          },
          {
            id: 'C',
            type: 'confident',
            text: turn.aConfident || 'Let us lock this option in today directly.',
            feedback: 'Bold confident action.',
            explanation: 'Strong leadership command markers.',
            fluency: 16,
            confidence: 9,
            money: 0,
            nextTurnIndex
          }
        ]
      };
    });

    const finalScenario: DialogueScenario = {
      id: formId || 'scenario_' + Date.now(),
      title: formTitle || 'Custom Dialogue Situation',
      bgClass: formBgClass,
      bgImageUrl: formBgUrl,
      description: formDesc || 'Narration placeholder...',
      npc_name: formNpcName,
      npc_gender: formNpcGender,
      npc_accent: formNpcAccent,
      npc_voice_name: formNpcVoiceName,
      npc_avatar_class: formNpcAvatar,
      npc_portrait_class: formNpcPortrait,
      npcOpenSceneUrl: formNpcUrl,
      turns: formattedTurns
    };

    onSaveScenario(formLocation, finalScenario, editingIndex);
    toast.success("Scenario saved and refreshed inside database lists!");

    // Reset Creation form
    setEditingIndex(null);
    setFormLocation('restaurant_entrance');
    setFormId('');
    setFormTitle('');
    setFormBgUrl('');
    setFormNpcUrl('');
    setFormDescription('');
    setFormNpcGender('female');
    setFormNpcAccent('US');
    setFormNpcVoiceName('');
    setActiveTab('scenarios');
  };

  return (
    <div className="flex-grow flex flex-col p-5 w-full bg-slate-950 rounded-[2rem]">
      
      {/* Scroll Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4 font-sans">
        <button 
          onClick={onExit}
          className="bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold px-4 py-2.5 rounded-2xl border border-slate-850 flex items-center gap-1.5 text-xs transition-colors btn-bounce"
        >
          <X size={13} /> Exit Scenario Matrix
        </button>
        <span className="text-xs text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-2xl uppercase flex items-center gap-1.5 font-sans leading-none">
          <Sliders className="w-4 h-4" /> Comprehensive Scenarios Customizer
        </span>
      </div>

      {/* Editor Tabs bar */}
      <div className="flex border-b border-slate-900 pb-2 mb-4 gap-2 font-sans flex-wrap">
        <button 
          onClick={() => { setActiveTab('scenarios'); setEditingIndex(null); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'scenarios' ? 'bg-amber-600 text-slate-950 font-black' : 'bg-slate-900/50 text-slate-400 border border-slate-900'
          }`}
        >
          Scenario Library
        </button>
        <button 
          onClick={() => setActiveTab('create')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'create' ? 'bg-amber-600 text-slate-950 font-black' : 'bg-slate-900/50 text-slate-400 border border-slate-900'
          }`}
        >
          {editingIndex !== null ? 'Modify Dialogue' : 'Create Custom Dialogue'}
        </button>
      </div>

      {/* Main Panel View Swappers */}
      {activeTab === 'scenarios' ? (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm font-sans">
            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setFilterLoc('all')} 
                className={`px-3 py-1.5 text-xs font-medium rounded-xl ${filterLoc === 'all' ? 'bg-amber-600 text-slate-950 font-black' : 'bg-slate-950 text-slate-400'}`}
              >
                All
              </button>
               <button 
                onClick={() => setFilterLoc('restaurant_entrance')} 
                className={`px-3 py-1.5 text-xs font-medium rounded-xl ${filterLoc === 'restaurant_entrance' ? 'bg-amber-600 text-slate-950 font-black' : 'bg-slate-950 text-slate-400'}`}
              >
                1. Entrance
              </button>
              <button 
                onClick={() => setFilterLoc('restaurant_dining')} 
                className={`px-3 py-1.5 text-xs font-medium rounded-xl ${filterLoc === 'restaurant_dining' ? 'bg-amber-600 text-slate-950 font-black' : 'bg-slate-950 text-slate-400'}`}
              >
                2. Dining Table
              </button>
              <button 
                onClick={() => setFilterLoc('restaurant_service')} 
                className={`px-3 py-1.5 text-xs font-medium rounded-xl ${filterLoc === 'restaurant_service' ? 'bg-amber-600 text-slate-950 font-black' : 'bg-slate-950 text-slate-400'}`}
              >
                3. Service
              </button>
              <button 
                onClick={() => setFilterLoc('restaurant_help')} 
                className={`px-3 py-1.5 text-xs font-medium rounded-xl ${filterLoc === 'restaurant_help' ? 'bg-amber-600 text-slate-950 font-black' : 'bg-slate-950 text-slate-400'}`}
              >
                4. Help Desk
              </button>
              <button 
                onClick={() => setFilterLoc('restaurant_checkout')} 
                className={`px-3 py-1.5 text-xs font-medium rounded-xl ${filterLoc === 'restaurant_checkout' ? 'bg-amber-600 text-slate-950 font-black' : 'bg-slate-950 text-slate-400'}`}
              >
                5. Checkout
              </button>
            </div>

            {/* General Action elements */}
            <div className="flex items-center gap-2.5 font-sans">
              <button 
                onClick={handleExport}
                className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 font-bold"
              >
                <Download size={12} /> Export JSON
              </button>
              <button 
                onClick={handleImportClick}
                className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 font-bold"
              >
                <Upload size={12} /> Import JSON
              </button>
              <button 
                onClick={onResetLibrary}
                className="bg-rose-950/20 hover:bg-rose-955/40 border border-rose-500/20 text-rose-400 py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 font-bold"
              >
                <RotateCcw size={12} /> Reset Defaults
              </button>
            </div>
          </div>

          {/* Scenarios Grid list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[420px] pr-1.5">
            {Object.keys(library).flatMap((locationKey) => {
              if (filterLoc !== 'all' && filterLoc !== locationKey) return [];
              return library[locationKey].map((sc, idx) => (
                <div 
                  key={sc.id} 
                  className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 font-sans">
                      <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 uppercase font-bold">
                        {locationKey}
                      </span>
                      <span className="text-[9px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded font-bold">
                        {sc.turns.length} Turns
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1 leading-tight">{sc.title}</h4>
                    <p className="text-[10px] text-slate-400 mb-2 line-clamp-2 leading-relaxed font-sans">{sc.description}</p>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-950 justify-end font-sans">
                    <button 
                      onClick={() => onPlayTest(locationKey, sc)}
                      className="flex-1 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/20 text-emerald-400 font-bold py-1.5 px-2.5 rounded text-[10px] flex items-center justify-center gap-1"
                    >
                      <Play size={11} /> Test Play
                    </button>
                    <button 
                      onClick={() => startEdit(locationKey, idx)}
                      className="bg-amber-600/15 hover:bg-amber-550/25 border border-amber-500/20 text-amber-400 font-bold py-1.5 px-2.5 rounded text-[10px] flex items-center justify-center gap-1"
                    >
                      <Edit3 size={11} /> Edit
                    </button>
                    <button 
                      onClick={() => onDeleteScenario(locationKey, idx)}
                      className="bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 p-1.5 rounded transition active:scale-95"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                </div>
              ));
            })}
          </div>
        </div>
      ) : (
        /* CREATE OR EDIT SCENARIO SUBVIEW FORM */
        <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs font-semibold font-sans overflow-y-auto max-h-[460px] pr-2">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase font-black">Location Node Zone</label>
              <select 
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                disabled={editingIndex !== null}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
              >
                <option value="restaurant_entrance">1. Entrance</option>
                <option value="restaurant_dining">2. Dining Table</option>
                <option value="restaurant_service">3. Service</option>
                <option value="restaurant_help">4. Help Desk</option>
                <option value="restaurant_checkout">5. Checkout</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase font-black">Unique ID Reference</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. cafe_holiday" 
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase font-black">Situational Title Tag</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Café • Rainy Afternoon" 
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase font-black">Custom Background Image URL (Optional)</label>
              <input 
                type="text" 
                placeholder="https://images.unsplash.com/..." 
                value={formBgUrl}
                onChange={(e) => setFormBgUrl(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none text-[11px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase font-black">Companion NPC Name</label>
              <input 
                type="text" 
                required
                value={formNpcName}
                onChange={(e) => setFormNpcName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] text-slate-400 uppercase font-black">Custom NPC Portrait Image URL (Optional)</label>
              <input 
                type="text" 
                placeholder="https://images.unsplash.com/..." 
                value={formNpcUrl}
                onChange={(e) => setFormNpcUrl(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none text-[11px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase font-black">NPC Voice Gender</label>
              <select 
                value={formNpcGender}
                onChange={(e) => {
                  const val = e.target.value as 'male' | 'female';
                  setFormNpcGender(val);
                  // Auto-suggest a matching voice with both gender and current accent
                  const matched = systemVoices.find(v => {
                    const name = v.name.toLowerCase();
                    const lang = v.lang.toLowerCase();
                    const isCorrectGender = val === 'female' 
                      ? (name.includes('female') || name.includes('zira') || name.includes('samantha') || name.includes('hazel') || name.includes('susan') || name.includes('heather') || name.includes('karen') || (!name.includes('male') && !name.includes('david') && !name.includes('guy') && !name.includes('daniel') && !name.includes('george')))
                      : (name.includes('male') || name.includes('david') || name.includes('guy') || name.includes('daniel') || name.includes('george') || name.includes('mark') || name.includes('ravi') || name.includes('james'));
                    
                    const isCorrectAccent = formNpcAccent === 'US'
                      ? (lang === 'en-us' || lang === 'en_us' || name.includes('us') || name.includes('united states'))
                      : (lang === 'en-gb' || lang === 'en_gb' || name.includes('gb') || name.includes('uk') || name.includes('united kingdom') || name.includes('great britain'));

                    return isCorrectGender && isCorrectAccent;
                  });
                  if (matched) {
                    setFormNpcVoiceName(matched.name);
                  } else {
                    setFormNpcVoiceName('');
                  }
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
              >
                <option value="female">Female Voice Curve</option>
                <option value="male">Male Voice Curve</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase font-black">NPC Voice Accent</label>
              <select 
                value={formNpcAccent}
                onChange={(e) => {
                  const val = e.target.value as 'US' | 'UK';
                  setFormNpcAccent(val);
                  // Auto-suggest a matching voice with current gender and new accent
                  const matched = systemVoices.find(v => {
                    const name = v.name.toLowerCase();
                    const lang = v.lang.toLowerCase();
                    const isCorrectGender = formNpcGender === 'female' 
                      ? (name.includes('female') || name.includes('zira') || name.includes('samantha') || name.includes('hazel') || name.includes('susan') || name.includes('heather') || name.includes('karen') || (!name.includes('male') && !name.includes('david') && !name.includes('guy') && !name.includes('daniel') && !name.includes('george')))
                      : (name.includes('male') || name.includes('david') || name.includes('guy') || name.includes('daniel') || name.includes('george') || name.includes('mark') || name.includes('ravi') || name.includes('james'));
                    
                    const isCorrectAccent = val === 'US'
                      ? (lang === 'en-us' || lang === 'en_us' || name.includes('us') || name.includes('united states'))
                      : (lang === 'en-gb' || lang === 'en_gb' || name.includes('gb') || name.includes('uk') || name.includes('united kingdom') || name.includes('great britain'));

                    return isCorrectGender && isCorrectAccent;
                  });
                  if (matched) {
                    setFormNpcVoiceName(matched.name);
                  } else {
                    setFormNpcVoiceName('');
                  }
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
              >
                <option value="US">United States (US)</option>
                <option value="UK">United Kingdom (UK)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase font-black">Specific TTS Voice (Filtered)</label>
              <select 
                value={formNpcVoiceName}
                onChange={(e) => setFormNpcVoiceName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none text-[11px]"
              >
                <option value="">-- Auto Match Voice --</option>
                {systemVoices
                  .filter(voice => {
                    const name = voice.name.toLowerCase();
                    const lang = voice.lang.toLowerCase();
                    
                    const matchesGender = formNpcGender === 'female'
                      ? (name.includes('female') || name.includes('zira') || name.includes('samantha') || name.includes('hazel') || name.includes('susan') || name.includes('heather') || name.includes('karen') || (!name.includes('male') && !name.includes('david') && !name.includes('guy') && !name.includes('daniel') && !name.includes('george')))
                      : (name.includes('male') || name.includes('david') || name.includes('guy') || name.includes('daniel') || name.includes('george') || name.includes('mark') || name.includes('ravi') || name.includes('james'));
                    
                    const matchesAccent = formNpcAccent === 'US'
                      ? (lang === 'en-us' || lang === 'en_us' || name.includes('us') || name.includes('united states') || name.includes('zira') || name.includes('david'))
                      : (lang === 'en-gb' || lang === 'en_gb' || name.includes('gb') || name.includes('uk') || name.includes('united kingdom') || name.includes('great britain') || name.includes('daniel') || name.includes('hazel'));

                    return matchesGender && matchesAccent;
                  })
                  .map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 uppercase font-black">Arrival Narration Context text</label>
            <textarea 
              rows={2}
              required
              placeholder="Describe what the player experiences when starting..."
              value={formDesc}
              onChange={(e) => setFormDescription(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none resize-none"
            ></textarea>
          </div>

          {/* Turns stack */}
          <div className="border-t border-slate-900 pt-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Turns dialogue entries</h4>
              <button 
                type="button" 
                onClick={handleAddNewTurnField}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
              >
                + Add Turn Node
              </button>
            </div>

            <div className="space-y-4">
              {formTurns.map((turn, tIdx) => (
                <div key={tIdx} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 font-sans">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                    <span className="text-[10px] font-black tracking-wide text-amber-500 uppercase">Dialogue Turn #{tIdx + 1}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={turn.isNpcEnd}
                          onChange={(e) => {
                            const copy = [...formTurns];
                            copy[tIdx].isNpcEnd = e.target.checked;
                            setFormTurns(copy);
                          }}
                        />
                        <span>NPC terminates conversations here</span>
                      </label>
                      <button 
                        type="button"
                        onClick={() => {
                          const copy = [...formTurns];
                          copy.splice(tIdx, 1);
                          setFormTurns(copy);
                        }}
                        className="text-rose-400 hover:text-rose-300 font-bold text-[9px] uppercase"
                      >
                        Remove Turn
                      </button>
                    </div>
                  </div>

                  {/* Npc Dialog phrase */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 uppercase font-black">NPC Question text</label>
                    <input 
                      type="text" 
                      value={turn.npc_message}
                      onChange={(e) => {
                        const copy = [...formTurns];
                        copy[tIdx].npc_message = e.target.value;
                        setFormTurns(copy);
                      }}
                      required
                      placeholder="What does the Companion say?" 
                      className="bg-slate-900 border border-slate-850 rounded-xl px-2.5 py-1.5 text-slate-200"
                    />
                  </div>

                  {!turn.isNpcEnd && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-1.5">
                      {/* Beginner correctness pairs form */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
                        <span className="text-[9px] text-amber-400 font-black uppercase tracking-widest block">Beginner Class choices</span>
                        <div>
                          <label className="text-[8px] text-emerald-400 block font-bold mb-0.5">Correct Answer</label>
                          <input 
                            type="text" 
                            value={turn.bCorrect}
                            onChange={(e) => {
                              const copy = [...formTurns];
                              copy[tIdx].bCorrect = e.target.value;
                              setFormTurns(copy);
                            }}
                            placeholder="Polite, simple answer text" 
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-rose-400 block font-bold mb-0.5">Incorrect Answer</label>
                          <input 
                            type="text" 
                            value={turn.bIncorrect}
                            onChange={(e) => {
                              const copy = [...formTurns];
                              copy[tIdx].bIncorrect = e.target.value;
                              setFormTurns(copy);
                            }}
                            placeholder="Dramatic/Wrong phrasing" 
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-indigo-400 block font-bold mb-0.5 font-sans uppercase">Grammar Partner Advice</label>
                          <textarea 
                            value={turn.bAdvice || ''}
                            onChange={(e) => {
                              const copy = [...formTurns];
                              copy[tIdx].bAdvice = e.target.value;
                              setFormTurns(copy);
                            }}
                            placeholder="Why is this wrong? E.g., Use polite modals..." 
                            rows={2}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-[11px] resize-none focus:outline-none focus:border-amber-500/50"
                          />
                        </div>
                      </div>

                      {/* Intermediate level entries */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
                        <span className="text-[9px] text-amber-400 font-black uppercase tracking-widest block">Intermediate Class choices</span>
                        <div>
                          <label className="text-[8px] text-indigo-400 block font-bold mb-0.5 font-sans uppercase">Friendly Casual</label>
                          <input 
                            type="text" 
                            value={turn.iFriendly}
                            onChange={(e) => {
                              const copy = [...formTurns];
                              copy[tIdx].iFriendly = e.target.value;
                              setFormTurns(copy);
                            }}
                            placeholder="Friendly Casual phrase" 
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-indigo-400 block font-bold mb-0.5 font-sans uppercase">Standard Neutral</label>
                          <input 
                            type="text" 
                            value={turn.iNeutral}
                            onChange={(e) => {
                              const copy = [...formTurns];
                              copy[tIdx].iNeutral = e.target.value;
                              setFormTurns(copy);
                            }}
                            placeholder="Standard Neutral phrase" 
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-indigo-400 block font-bold mb-0.5 font-sans uppercase">Direct Transactional</label>
                          <input 
                            type="text" 
                            value={turn.iDirect}
                            onChange={(e) => {
                              const copy = [...formTurns];
                              copy[tIdx].iDirect = e.target.value;
                              setFormTurns(copy);
                            }}
                            placeholder="Direct transaction/request phrase" 
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px]"
                          />
                        </div>
                      </div>

                      {/* Advanced level entries */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
                        <span className="text-[9px] text-amber-400 font-black uppercase tracking-widest block">Advanced Class choices</span>
                        <div>
                          <label className="text-[8px] text-amber-500 block font-bold mb-0.5 font-sans uppercase">Eloquent Friendly</label>
                          <input 
                            type="text" 
                            value={turn.aFriendly}
                            onChange={(e) => {
                              const copy = [...formTurns];
                              copy[tIdx].aFriendly = e.target.value;
                              setFormTurns(copy);
                            }}
                            placeholder="Eloquent Friendly phrase" 
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-amber-500 block font-bold mb-0.5 font-sans uppercase">Professional Business</label>
                          <input 
                            type="text" 
                            value={turn.aProfessional}
                            onChange={(e) => {
                              const copy = [...formTurns];
                              copy[tIdx].aProfessional = e.target.value;
                              setFormTurns(copy);
                            }}
                            placeholder="Professional corporate phrase" 
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-amber-500 block font-bold mb-0.5 font-sans uppercase">Confident Leadership</label>
                          <input 
                            type="text" 
                            value={turn.aConfident}
                            onChange={(e) => {
                              const copy = [...formTurns];
                              copy[tIdx].aConfident = e.target.value;
                              setFormTurns(copy);
                            }}
                            placeholder="Confident commanding phrase" 
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-900 font-sans">
            <button 
              type="button" 
              onClick={() => { setActiveTab('scenarios'); setEditingIndex(null); }}
              className="bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold px-5 py-3 rounded-xl"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl shadow-lg uppercase tracking-wider"
            >
              Save Scenario Model
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
