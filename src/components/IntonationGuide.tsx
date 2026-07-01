/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, HelpCircle, Volume2, ChevronDown, ChevronUp } from 'lucide-react';

interface IntonationGuideProps {
  text: string;
  className?: string;
  gender?: 'male' | 'female';
  accent?: 'US' | 'UK';
  voiceName?: string;
}

interface SyllableInfo {
  text: string;
  isStressed: boolean;
  pitch: number; // 1 (low/reduced), 2 (mid), 3 (high)
}

interface WordPhonetics {
  syllables: SyllableInfo[];
  isContent: boolean;
}

// Predefined syllable breakdown and stress map for common cafe vocabulary
const CAFE_PHONETIC_DICT: Record<string, string[]> = {
  "coffee": ["ˈcof", "fee"],
  "latte": ["lat", "ˈte"],
  "muffin": ["ˈmuf", "fin"],
  "muffins": ["ˈmuf", "fins"],
  "croissant": ["crois", "ˈsant"],
  "croissants": ["crois", "ˈsants"],
  "espresso": ["es", "ˈpres", "so"],
  "americano": ["a", "me", "ri", "ˈca", "no"],
  "macchiato": ["mac", "chi", "ˈa", "to"],
  "caramel": ["ˈcar", "a", "mel"],
  "morning": ["ˈmor", "ning"],
  "welcome": ["ˈwel", "come"],
  "today": ["to", "ˈday"],
  "payment": ["ˈpay", "ment"],
  "receipt": ["re", "ˈceipt"],
  "pastry": ["ˈpas", "try"],
  "pastries": ["ˈpas", "tries"],
  "laptop": ["ˈlap", "top"],
  "perfect": ["ˈper", "fect"],
  "excellent": ["ˈex", "cel", "lent"],
  "water": ["ˈwa", "ter"],
  "sugar": ["ˈsu", "gar"],
  "cookie": ["ˈcoo", "kie"],
  "cookies": ["ˈcoo", "kies"],
  "double": ["ˈdou", "ble"],
  "dollar": ["ˈdol", "lar"],
  "dollars": ["ˈdol", "lars"],
  "twenty": ["ˈtwen", "ty"],
  "thirty": ["ˈthir", "ty"],
  "forty": ["ˈfor", "ty"],
  "fifty": ["ˈfif", "ty"],
  "afternoon": ["af", "ter", "ˈnoon"],
  "evening": ["ˈeve", "ning"],
  "customer": ["ˈcus", "to", "mer"],
  "counter": ["ˈcoun", "ter"],
  "register": ["ˈreg", "is", "ter"],
  "condiment": ["ˈcon", "di", "ment"],
  "bathroom": ["ˈbath", "room"],
  "restroom": ["ˈrest", "room"],
  "seating": ["ˈseat", "ing"],
  "station": ["ˈsta", "tion"],
  "napkin": ["ˈnap", "kin"],
  "napkins": ["ˈnap", "kins"],
  "delicious": ["de", "ˈli", "cious"],
  "recommend": ["re", "com", "ˈmend"],
  "decaf": ["ˈde", "caf"],
  "hazelnut": ["ˈha", "zel", "nut"],
  "vanilla": ["va", "ˈnil", "la"],
  "signature": ["ˈsig", "na", "ture"],
  "cappuccino": ["cap", "puc", "ˈci", "no"],
  "chocolate": ["ˈchoc", "o", "late"],
};

// Words that are unstressed structure/function words in sentence flow
const STRUCTURE_WORDS = new Set([
  'a', 'an', 'the', 'some', 'any', 'my', 'your', 'his', 'her', 'their', 'our',
  'to', 'for', 'in', 'on', 'at', 'by', 'with', 'from', 'of', 'about', 'as',
  'and', 'but', 'or', 'so', 'yet',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'them', 'us',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
  'would', 'could', 'should', 'can', 'will', 'may', 'might', 'must', 'shall'
]);

/**
 * Breakdown a word into syllables, marking stress and pitch heights.
 */
function parseWord(word: string): WordPhonetics {
  const clean = word.toLowerCase().replace(/[^a-z']/g, '');
  const isContent = !STRUCTURE_WORDS.has(clean) && clean.length > 0;
  
  // 1. Check in our customized cafe phonetic dictionary
  if (CAFE_PHONETIC_DICT[clean]) {
    const syllables = CAFE_PHONETIC_DICT[clean].map(syll => {
      const isStressed = syll.startsWith('ˈ');
      const cleanSyllable = isStressed ? syll.slice(1) : syll;
      return {
        text: cleanSyllable,
        isStressed,
        pitch: isStressed ? 3 : (isContent ? 2 : 1)
      };
    });
    return { syllables, isContent };
  }

  // 2. Generic fallback parser (Heuristic model)
  // Simple heuristic: count vowels to estimate syllables
  const vowels = "aeiouy";
  let parts: string[] = [];
  let current = "";
  
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    current += char;
    
    // Split-point heuristics
    if (vowels.includes(char)) {
      // Check if silent 'e' at end
      if (char === 'e' && i === clean.length - 1 && clean.length > 3 && !vowels.includes(clean[i - 1])) {
        // usually combined in previous syllable group
      } else if (i < clean.length - 1 && !vowels.includes(clean[i + 1])) {
        // Split after consonant if vowel was encountered
        parts.push(current);
        current = "";
      }
    }
  }
  if (current) {
    if (parts.length > 0) {
      parts[parts.length - 1] += current;
    } else {
      parts.push(current);
    }
  }

  // Double check parts are valid
  if (parts.length === 0) {
    parts = [clean];
  }

  // First syllable is primary stressed by default in simple English fallback nouns/verbs
  const syllables = parts.map((part, index) => {
    const isStressed = isContent && index === 0 && clean.length > 2;
    return {
      text: part,
      isStressed,
      pitch: isStressed ? 3 : (isContent ? 2 : 1)
    };
  });

  return { syllables, isContent };
}

export const IntonationGuide: React.FC<IntonationGuideProps> = ({ text, className = "", gender, accent, voiceName }) => {
  const [activeInstruction, setActiveInstruction] = useState<string | null>(null);
  const [isPronunciationTipExpanded, setIsPronunciationTipExpanded] = useState<boolean>(false);

  // Parse total sentence
  const rawWords = text.split(/\s+/).filter(w => w.trim().length > 0);
  const isQuestion = text.trim().endsWith('?');
  const isExclamation = text.trim().endsWith('!');

  const parsedWords = rawWords.map((wordStr, wIndex) => {
    const wordClean = wordStr.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    const phonetics = parseWord(wordClean);
    
    // If it's a question, raise the pitch of the final stressed syllable or word (rising intonation)
    if (isQuestion && wIndex === rawWords.length - 1) {
      phonetics.syllables = phonetics.syllables.map(syll => ({
        ...syll,
        pitch: Math.min(3, syll.pitch + 1)
      }));
    }
    // If it's an exclamation, emphasize the high pitch elements (falling with sharp contrast)
    if (isExclamation && phonetics.isContent) {
      phonetics.syllables = phonetics.syllables.map(syll => ({
        ...syll,
        pitch: syll.isStressed ? 3 : syll.pitch
      }));
    }

    return {
      original: wordStr,
      wordClean,
      phonetics,
    };
  });

  // Calculate points for the Bezier visualization curve representing total pitch speech melody
  const curvePoints: { x: number; y: number; label: string }[] = [];
  let runningX = 25;
  const wordWidth = 72;

  parsedWords.forEach((pw) => {
    const syllCount = pw.phonetics.syllables.length;
    const syllWidth = wordWidth / syllCount;

    pw.phonetics.syllables.forEach((syll, sIdx) => {
      const ptX = runningX + (sIdx * syllWidth) + (syllWidth / 2);
      // Pitch heights: 1 (low) => y=45, 2 (mid) => y=28, 3 (high) => y=12
      const ptY = syll.pitch === 3 ? 12 : syll.pitch === 2 ? 28 : 42;
      curvePoints.push({
        x: ptX,
        y: ptY,
        label: syll.text
      });
    });
    runningX += wordWidth + 10;
  });

  const svgWidth = Math.max(340, runningX + 20);

  // Construct SVG Path line
  let pathD = "";
  if (curvePoints.length > 0) {
    pathD = `M ${curvePoints[0].x} ${curvePoints[0].y}`;
    for (let i = 1; i < curvePoints.length; i++) {
      const prev = curvePoints[i - 1];
      const curr = curvePoints[i];
      // Smooth control points for Bezier curve matching intonation rise & fall
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }
  }

  const getSyllableExplanation = (syll: SyllableInfo, word: string) => {
    if (syll.isStressed) {
      return `"${syll.text}" is the stressed syllable in "${word}". Speak it higher, louder, and stretch the vowel.`;
    }
    if (syll.pitch === 3) {
      return `Final rising pitch on "${syll.text}" for conversational request or open question context.`;
    }
    return `"${syll.text}" is unstressed. Keep the tone natural, quiet, and blend quickly to the next syllable.`;
  };

  const speakAudioPrompt = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8; // Set to exactly 0.8 to match modeling rate label

      const voices = window.speechSynthesis.getVoices();
      if (voiceName) {
        const found = voices.find(v => v.name === voiceName);
        if (found) {
          utterance.voice = found;
          if (found.lang) utterance.lang = found.lang;
        }
      } else if (gender) {
        const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
        const searchVoices = englishVoices.length > 0 ? englishVoices : voices;
        
        let accentFiltered = searchVoices;
        if (accent) {
          const isUS = accent === 'US';
          accentFiltered = searchVoices.filter(v => {
            const lang = v.lang.toLowerCase();
            const name = v.name.toLowerCase();
            if (isUS) {
              return lang.startsWith('en-us') || lang.startsWith('en_us') || lang.includes('-us') || lang.includes('_us') || name.includes('us') || name.includes('united states') || name.includes('zira') || name.includes('david') || name.includes('alex') || name.includes('samantha');
            } else {
              return lang.startsWith('en-gb') || lang.startsWith('en_gb') || lang.includes('-gb') || lang.includes('_gb') || name.includes('gb') || name.includes('uk') || name.includes('united kingdom') || name.includes('great britain') || name.includes('daniel') || name.includes('hazel') || name.includes('serena') || name.includes('fiona');
            }
          });
          if (accentFiltered.length === 0) {
            accentFiltered = searchVoices;
          }
        }

        let foundVoice: SpeechSynthesisVoice | undefined;
        if (gender === 'male') {
          const maleKeywords = ['male', 'david', 'guy', 'daniel', 'george', 'mark', 'ravi', 'james', 'brian', 'richard', 'alex', 'sam', 'fred', 'junior', 'ralph', 'oliver', 'peter', 'harry', 'arthur', 'liam', 'ryan', 'marcus', 'william', 'charles'];
          foundVoice = accentFiltered.find(v => 
            maleKeywords.some(kw => v.name.toLowerCase().includes(kw))
          );
          if (!foundVoice) {
            foundVoice = searchVoices.find(v => 
              maleKeywords.some(kw => v.name.toLowerCase().includes(kw))
            );
          }
        } else {
          const femaleKeywords = ['female', 'zira', 'samantha', 'hazel', 'susan', 'heather', 'karen', 'linda', 'catherine', 'chloe', 'emma', 'elizabeth', 'victoria', 'mary', 'sara', 'sarah', 'fiona', 'emily', 'serena'];
          foundVoice = accentFiltered.find(v => 
            femaleKeywords.some(kw => v.name.toLowerCase().includes(kw))
          );
          if (!foundVoice) {
            foundVoice = searchVoices.find(v => 
              femaleKeywords.some(kw => v.name.toLowerCase().includes(kw))
            );
          }
        }
        if (foundVoice) {
          utterance.voice = foundVoice;
          if (foundVoice.lang) utterance.lang = foundVoice.lang;
        }
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`bg-[#0a0d20] border border-[#a855f7]/15 rounded-2xl p-4 sm:p-5 font-sans relative overflow-hidden flex flex-col gap-3.5 shadow-xl shadow-[#04060f]/65 ${className}`}>
      
      {/* Visual Accent Corner Radiance */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full pointer-events-none" />

      {/* Header Info Rail */}
      <div className="flex items-center justify-between gap-1.5 border-b border-white/5 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[8px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
            <Sparkles size={9} className="animate-pulse" /> Intonation & Stress Map
          </div>
          <span className="text-[9px] text-slate-400 font-semibold italic">Speak with native melody rhythm</span>
        </div>
        <button 
          onClick={speakAudioPrompt}
          className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg px-2 py-1 text-[9.5px] font-bold tracking-wide transition-all active:scale-95 cursor-pointer"
          title="Play Native audio modeling guide"
        >
          <Volume2 size={11} className="animate-pulse" /> Modeling Rate (0.8x)
        </button>
      </div>

      {/* SVG Intonation Curve Visualizer Container */}
      <div className="w-full overflow-x-auto pb-4 pt-1 flex flex-col justify-start select-none scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div style={{ width: `${svgWidth}px` }} className="relative h-20 bg-[#060814]/40 border border-slate-900 rounded-xl overflow-hidden mb-2">
          
          {/* Subtle grid lines background to indicate pitch ranges */}
          <div className="absolute inset-x-0 top-3 border-t border-slate-900/40 text-[7px] text-slate-500 tracking-wider pl-1.5 select-none pointer-events-none">HIGH PITCH • STRESSED KEYWORD</div>
          <div className="absolute inset-x-0 top-7.5 border-t border-slate-900/40 text-[7px] text-slate-500 tracking-wider pl-1.5 select-none pointer-events-none">MID PITCH • CONTEXT BODY</div>
          <div className="absolute inset-x-0 top-11 border-t border-slate-900/40 text-[7px] text-slate-500 tracking-wider pl-1.5 select-none pointer-events-none">LOW PITCH • REDUCED SYSTEM WORD</div>

          {/* Canvas SVG curve */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {pathD && (
              <path 
                d={pathD} 
                fill="none" 
                stroke="url(#pitchGradient)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                className="drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)] animate-dash"
              />
            )}
            
            {/* Draw curve anchors */}
            {curvePoints.map((pt, i) => (
              <circle 
                key={i} 
                cx={pt.x} 
                cy={pt.y} 
                r="3.5" 
                fill={pt.y < 15 ? "#f59e0b" : pt.y < 30 ? "#38bdf8" : "#64748b"} 
                className="transition-all hover:scale-125"
              />
            ))}

            <defs>
              <linearGradient id="pitchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Written breakdown alignment matching SVG coordinate width */}
        <div style={{ width: `${svgWidth}px` }} className="flex gap-2.5 px-6 pt-1">
          {parsedWords.map((pw, wIdx) => {
            const syllCount = pw.phonetics.syllables.length;
            const isContent = pw.phonetics.isContent;

            return (
              <div 
                key={wIdx} 
                className="flex flex-col items-center select-none" 
                style={{ width: `${wordWidth}px` }}
              >
                {/* Visual Height Markers above word */}
                <div className="flex items-center gap-0.5 mb-1 text-[8.5px] font-black uppercase text-amber-500 font-mono">
                  {isContent ? "★ stressed" : "reduced"}
                </div>

                {/* Main Raw English word output */}
                <span className={`text-xs font-black tracking-wide ${isContent ? 'text-[#fffdf9]' : 'text-slate-400 font-medium'}`}>
                  {pw.original}
                </span>

                {/* Syllable Breakdown and Primary stress mark */}
                <div className="flex items-center gap-0.5 mt-1">
                  {pw.phonetics.syllables.map((syll, sIdx) => {
                    const hasStressMarker = syll.isStressed;
                    return (
                      <span 
                        key={sIdx}
                        onClick={() => {
                          setActiveInstruction(getSyllableExplanation(syll, pw.wordClean));
                          setIsPronunciationTipExpanded(true);
                        }}
                        className={`text-[9.5px] font-mono font-extrabold px-1 py-0.5 rounded transition-all cursor-pointer ${
                          hasStressMarker 
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.1)]' 
                            : 'bg-slate-900 text-slate-400 border border-white/5 hover:border-slate-700'
                        }`}
                        title="Click to view Speech Syllable instructions"
                      >
                        {hasStressMarker ? "ˈ" : ""}{syll.text}
                        {sIdx < syllCount - 1 ? "-" : ""}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Collapsible toggle for Pronunciation Guide / Legend */}
      <div className="border-t border-white/5 pt-2 flex justify-between items-center">
        <button 
          onClick={() => setIsPronunciationTipExpanded(!isPronunciationTipExpanded)}
          className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover:text-amber-400 uppercase tracking-widest cursor-pointer transition-colors"
        >
          {isPronunciationTipExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          <span>{isPronunciationTipExpanded ? "Hide Pronunciation Tip & Legend" : "Show Pronunciation Tip & Legend"}</span>
        </button>
      </div>

      {isPronunciationTipExpanded && (
        <>
          {/* Syllable Interaction Instruction Banner */}
          <div className="bg-[#030612]/90 border border-slate-900 rounded-xl p-3 flex gap-2.5 items-start">
            <div className="w-5 h-5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <HelpCircle size={10.5} />
            </div>
            <div className="flex-grow">
              <span className="text-[7.5px] uppercase font-bold text-slate-500 tracking-wider block">Interactive Pronunciation Tip</span>
              <p className="text-[10px] text-slate-300 font-medium leading-relaxed mt-0.5">
                {activeInstruction || "Click on any syllable blocks above to see detailed speech pressure, vowel elongation, and vocal pitch guidance."}
              </p>
            </div>
          </div>

          {/* Intonation Rules Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-white/5 pt-1">
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/40 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <p className="text-[8.5px] text-slate-400 font-semibold"><span className="text-white font-black uppercase">Primary Stress (ˈ)</span> - Higher tone, longer vowel duration.</p>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/40 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <p className="text-[8.5px] text-slate-400 font-semibold"><span className="text-white font-black uppercase">Unstressed Body</span> - Standard conversational pacing tone.</p>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/40 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <p className="text-[8.5px] text-slate-400 font-semibold"><span className="text-white font-black uppercase">{isQuestion ? "Rising Contour" : "Falling Contour"}</span> - Voice pitch {isQuestion ? "raises" : "melts down"} at sentence end.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
