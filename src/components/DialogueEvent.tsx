/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DialogueScenario, DialogueChoice, CharacterProficiency } from '../types';
import { Volume2, HelpCircle, Check, Mic, Play, ArrowLeft, ArrowRight, Star, Heart, Shield, Compass, Sparkles, Award, Coffee, Languages, Coins } from 'lucide-react';
import { CafeAmbientGenerator } from '../utils/cafeAmbient';
import { TranslatedText } from './TranslatedText';
import { IntonationGuide } from './IntonationGuide';
import { toast } from './Toast';
import { recordChoice, getChoiceStats } from '../utils/firebase';

interface DialogueEventProps {
  locationKey: string;
  scenario: DialogueScenario;
  difficulty: CharacterProficiency;
  motherTongue?: 'English' | 'Mandarin Chinese' | 'Spanish' | 'Vietnamese';
  onChoiceSelect: (
    choice: DialogueChoice, 
    isCorrect: boolean, 
    turnIndexNum: number, 
    currentSelections: { npcMessage: string; choiceSelected: DialogueChoice }[]
  ) => void;
  onExit: () => void;
}

export const DialogueEvent: React.FC<DialogueEventProps> = ({
  locationKey,
  scenario,
  difficulty,
  motherTongue,
  onChoiceSelect,
  onExit
}) => {
  const [turnIndex, setTurnIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [evaluation, setEvaluation] = useState<{ score: number; spoken: string; wordsHtml: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedbackScreen, setShowFeedbackScreen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<{ npcMessage: string; choiceSelected: DialogueChoice }[]>([]);
  const [showCorrection, setShowCorrection] = useState(false);
  const [incorrectSelected, setIncorrectSelected] = useState<DialogueChoice | null>(null);
  const [dbChoiceStats, setDbChoiceStats] = useState<Record<string, number> | null>(null);
  const [loadingDbStats, setLoadingDbStats] = useState(false);

  const ambientGeneratorRef = useRef<CafeAmbientGenerator | null>(null);
  const [ambientPlaying, setAmbientPlaying] = useState(false);

  // Advanced Voice Practice States
  const [advancedTranscript, setAdvancedTranscript] = useState<string | null>(null);
  const [advancedScores, setAdvancedScores] = useState<Record<string, number>>({});
  const [closestChoiceId, setClosestChoiceId] = useState<string | null>(null);
  const [typedFallbackText, setTypedFallbackText] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [showNpcIntonation, setShowNpcIntonation] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any | null>(null);

  const currentTurn = scenario.turns[turnIndex] || scenario.turns[0];

  // Resolve active choice list based on player level
  const getLevelChoices = () => {
    if (difficulty === 'Beginner') {
      if (currentTurn.beginner_choices && currentTurn.beginner_choices.length > 0) return currentTurn.beginner_choices;
    } else if (difficulty === 'Intermediate') {
      if (currentTurn.intermediate_choices && currentTurn.intermediate_choices.length > 0) return currentTurn.intermediate_choices;
    } else {
      if (currentTurn.advanced_choices && currentTurn.advanced_choices.length > 0) return currentTurn.advanced_choices;
    }
    // Deep fallback if custom scenarios are set
    const corrIdx = currentTurn.choices?.[0] || { id: 'A', text: 'Good morning. I would like a hot latte, please.', type: 'correct', feedback: 'Correct', explanation: 'Nice construction.', fluency: 10, confidence: 5, money: 0, nextTurnIndex: -1 };
    return [corrIdx];
  };

  const choices = getLevelChoices();

  const totalVotes = dbChoiceStats 
    ? Object.values(dbChoiceStats).reduce((a: any, b: any) => (a as number) + (b as number), 0) as number 
    : 0;
  let maxVotes = 0;
  let mostPopularId: string | null = null;
  if (dbChoiceStats) {
    Object.entries(dbChoiceStats).forEach(([id, val]) => {
      const numVal = val as number;
      if (numVal > maxVotes) {
        maxVotes = numVal;
        mostPopularId = id;
      }
    });
  }

  // Trigger TTS dialogue voice
  const speakDialogueText = (phrase: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'en-US';
      utterance.pitch = 1.0;
      utterance.rate = 0.95;

      const voices = window.speechSynthesis.getVoices();
      if (scenario.npc_voice_name) {
        const found = voices.find(v => v.name === scenario.npc_voice_name);
        if (found) {
          utterance.voice = found;
          if (found.lang) utterance.lang = found.lang;
        }
      } else if (scenario.npc_gender) {
        const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
        const searchVoices = englishVoices.length > 0 ? englishVoices : voices;
        
        let accentFiltered = searchVoices;
        if (scenario.npc_accent) {
          const isUS = scenario.npc_accent === 'US';
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
        if (scenario.npc_gender === 'male') {
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

  // Auto-read NPC dialogue onload
  useEffect(() => {
    speakDialogueText(currentTurn.npc_message);
    setEvaluation(null);
    setShowHint(false);
    setShowCorrection(false);
    setIncorrectSelected(null);
    setShowTranslation(false);
    setShowNpcIntonation(false);

    // Fetch database choice stats for this node
    setDbChoiceStats(null);
    setLoadingDbStats(true);
    getChoiceStats(scenario.id, turnIndex, difficulty)
      .then((stats) => {
        setDbChoiceStats(stats);
        setLoadingDbStats(false);
      })
      .catch((err) => {
        console.error("Error loading choice stats:", err);
        setLoadingDbStats(false);
      });
  }, [turnIndex, currentTurn, scenario.id, difficulty]);

  // Cleanup microphones
  useEffect(() => {
    return () => {
      cancelAudioVisualization();
      stopVoiceRecording();
    };
  }, []);

  // Manage Cafe Ambient procedural background generator
  useEffect(() => {
    if (locationKey && locationKey.startsWith('cafe')) {
      const generator = new CafeAmbientGenerator();
      ambientGeneratorRef.current = generator;

      // Try playing automatically - standard browser permissions might block until user clicks elsewhere,
      // which is why the toggle is provided or will gain activation upon interactive clicks.
      try {
        generator.start();
        if (generator.getPlaybackState()) {
          setAmbientPlaying(true);
        }
      } catch (err) {
        console.debug('Cafe audio autoplay deferred due to browser gesture requirements.', err);
      }
    }

    return () => {
      if (ambientGeneratorRef.current) {
        ambientGeneratorRef.current.stop();
        ambientGeneratorRef.current = null;
        setAmbientPlaying(false);
      }
    };
  }, [locationKey]);

  const toggleAmbientSound = () => {
    if (!ambientGeneratorRef.current) {
      if (locationKey && locationKey.startsWith('cafe')) {
        const generator = new CafeAmbientGenerator();
        ambientGeneratorRef.current = generator;
        generator.start();
        setAmbientPlaying(generator.getPlaybackState());
      }
      return;
    }

    if (ambientPlaying) {
      ambientGeneratorRef.current.stop();
      setAmbientPlaying(false);
    } else {
      ambientGeneratorRef.current.start();
      setAmbientPlaying(ambientGeneratorRef.current.getPlaybackState());
    }
  };

  // Simple visual audio waves
  const startAudioVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const drawWave = () => {
      if (!isRecording) return;
      animationFrameRef.current = requestAnimationFrame(drawWave);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#e0b36c';

      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);

      const slices = 20;
      const sliceWidth = canvas.width / slices;
      for (let i = 0; i <= slices; i++) {
        const amplitude = Math.random() * (canvas.height * 0.4);
        const y = canvas.height / 2 + (i % 2 === 0 ? amplitude : -amplitude);
        const x = i * sliceWidth;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    drawWave();
  };

  const cancelAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startVoiceRecording = (targetPhrase: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Offline fallback simulator
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        const randScore = Math.floor(Math.random() * 20) + 80;
        setEvaluation({
          score: randScore,
          spoken: targetPhrase,
          wordsHtml: targetPhrase.split(' ').map(w => `<span class="text-emerald-400 font-bold px-1">${w}</span>`).join(' ')
        });
      }, 1500);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsRecording(true);
        setEvaluation(null);
        startAudioVisualization();
      };

      rec.onerror = (e: any) => {
        setIsRecording(false);
        cancelAudioVisualization();
        if (e && e.error === 'no-speech') {
          toast.warning("No speech was detected. Please make sure your microphone is working and speak clearly!");
          return;
        }
        if (e && e.error === 'not-allowed') {
          toast.error("Microphone permission denied. Please allow microphone access in your browser settings to use Phonetic Coach Mode!");
          return;
        }
        toast.info("Audio capture context not active. Simulating evaluation...");
        const randScore = Math.floor(Math.random() * 15) + 75;
        setEvaluation({
          score: randScore,
          spoken: targetPhrase,
          wordsHtml: targetPhrase.split(' ').map(w => `<span class="text-emerald-400 font-bold px-1">${w}</span>`).join(' ')
        });
      };

      rec.onresult = (e: any) => {
        setIsRecording(false);
        cancelAudioVisualization();
        const spoken = e.results[0][0].transcript;
        
        // Calculate dynamic matching index
        const clean = (s: string) => s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").trim();
        const tWords = clean(targetPhrase).split(/\s+/);
        const sWords = clean(spoken).split(/\s+/);
        
        let matches = 0;
        tWords.forEach(w => {
          if (sWords.includes(w)) matches++;
        });

        const scoreValue = Math.round((matches / tWords.length) * 100);
        const finalScore = Math.min(Math.max(scoreValue, 30), 100);

        const wordsHtmlArray = targetPhrase.split(/\s+/).map(word => {
          const isMatched = sWords.includes(clean(word));
          return isMatched 
            ? `<span class="text-emerald-400 font-black px-0.5">${word}</span>`
            : `<span class="text-rose-400 underline decoration-wavy px-0.5" title="Failed patternMatch">${word}</span>`;
        }).join(' ');

        setEvaluation({
          score: finalScore,
          spoken,
          wordsHtml: wordsHtmlArray
        });
      };

      rec.start();
      recognitionRef.current = rec;
    } catch {
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsRecording(false);
    cancelAudioVisualization();
  };

  const handleChoiceClick = (choice: DialogueChoice) => {
    // Record user choice in database asynchronously
    recordChoice(scenario.id, turnIndex, difficulty, choice.id);

    if (difficulty === 'Beginner' && choice.type === 'incorrect') {
      setIncorrectSelected(choice);
      setShowCorrection(true);
      return;
    }

    const nextSelections = [...selectedHistory, { npcMessage: currentTurn.npc_message, choiceSelected: choice }];
    setSelectedHistory(nextSelections);
    onChoiceSelect(choice, choice.type !== 'incorrect', turnIndex, nextSelections);
    
    if (choice.nextTurnIndex !== -1 && scenario.turns[choice.nextTurnIndex]) {
      setTurnIndex(choice.nextTurnIndex);
    } else {
      setShowFeedbackScreen(true);
    }
  };

  const handleLearnCorrection = () => {
    const correctOpt = choices.find(c => c.type === 'correct' || c.type === 'friendly') || choices[0];
    
    // Record learned correction in database too
    recordChoice(scenario.id, turnIndex, difficulty, correctOpt.id);

    let nextSelections = [...selectedHistory];
    if (incorrectSelected) {
      nextSelections = [
        ...nextSelections,
        { npcMessage: currentTurn.npc_message, choiceSelected: incorrectSelected },
        { npcMessage: `Learned correction for "${scenario.npc_name}"`, choiceSelected: { ...correctOpt, type: 'recalled_correction' } }
      ];
    } else {
      nextSelections = [...nextSelections, { npcMessage: currentTurn.npc_message, choiceSelected: correctOpt }];
    }
    setSelectedHistory(nextSelections);

    onChoiceSelect(correctOpt, false, turnIndex, nextSelections); // Learn correction rewards adjusted xp
    if (correctOpt.nextTurnIndex !== -1 && scenario.turns[correctOpt.nextTurnIndex]) {
      setTurnIndex(correctOpt.nextTurnIndex);
    } else {
      setShowFeedbackScreen(true);
    }
  };

  const processAdvancedSpokenResult = (spoken: string) => {
    setAdvancedTranscript(spoken);

    const clean = (s: string) => s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").trim();
    const cleanWordList = (text: string) => clean(text).split(/\s+/).filter(Boolean);
    const spokenWords = cleanWordList(spoken);

    const scores: Record<string, number> = {};
    let topChoiceId: string | null = null;
    let topScore = -1;

    choices.forEach(ch => {
      const targetWords = cleanWordList(ch.text);
      if (targetWords.length === 0) {
        scores[ch.id] = 0;
        return;
      }
      let matches = 0;
      targetWords.forEach(w => {
        if (spokenWords.includes(w)) {
          matches++;
        }
      });
      const scoreValue = Math.round((matches / targetWords.length) * 100);
      
      let bidirMatches = 0;
      spokenWords.forEach(w => {
        if (targetWords.includes(w)) bidirMatches++;
      });
      const bidirScore = spokenWords.length > 0 ? Math.round((bidirMatches / spokenWords.length) * 100) : 0;
      
      const finalScore = Math.min(Math.max(Math.round((scoreValue * 0.7) + (bidirScore * 0.3)), 10), 100);
      scores[ch.id] = finalScore;

      if (finalScore > topScore) {
        topScore = finalScore;
        topChoiceId = ch.id;
      }
    });

    setAdvancedScores(scores);
    setClosestChoiceId(topChoiceId);
  };

  const startAdvancedVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsRecording(true);
      startAudioVisualization();
      setTimeout(() => {
        setIsRecording(false);
        cancelAudioVisualization();
        
        // Grab a randomly chosen target path to simulate speech output cleanly
        const randomChoice = choices[Math.floor(Math.random() * choices.length)] || choices[0];
        processAdvancedSpokenResult(randomChoice.text);
      }, 2000);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsRecording(true);
        setAdvancedTranscript(null);
        startAudioVisualization();
      };

      rec.onerror = () => {
        setIsRecording(false);
        cancelAudioVisualization();
        toast.info("Audio capture context not active. Simulating advanced spoken phrasing comparison!");
        const randomChoice = choices[Math.floor(Math.random() * choices.length)] || choices[0];
        processAdvancedSpokenResult(randomChoice.text);
      };

      rec.onresult = (e: any) => {
        setIsRecording(false);
        cancelAudioVisualization();
        const spoken = e.results[0][0].transcript;
        processAdvancedSpokenResult(spoken);
      };

      rec.start();
      recognitionRef.current = rec;
    } catch {
      setIsRecording(false);
    }
  };

  const handleAdvancedChoiceClick = (choice: DialogueChoice, finalMatchedScore: number) => {
    // Record user choice in database asynchronously
    recordChoice(scenario.id, turnIndex, difficulty, choice.id);

    // Enriching the recorded text in history to indicate high-fidelity voice match
    const customizedChoice = {
      ...choice,
      text: `${choice.text} [Voice Similarity: ${finalMatchedScore}%]`
    };
    const nextSelections = [...selectedHistory, { npcMessage: currentTurn.npc_message, choiceSelected: customizedChoice }];
    setSelectedHistory(nextSelections);
    
    onChoiceSelect(choice, choice.type !== 'incorrect', turnIndex, nextSelections);

    // Reset loop
    setAdvancedTranscript(null);
    setAdvancedScores({});
    setClosestChoiceId(null);
    setTypedFallbackText("");

    if (choice.nextTurnIndex !== -1 && scenario.turns[choice.nextTurnIndex]) {
      setTurnIndex(choice.nextTurnIndex);
    } else {
      setShowFeedbackScreen(true);
    }
  };

  // UI Assets Resolvers
  const getBgImage = () => {
    if (scenario.bgImageUrl) return scenario.bgImageUrl;
    if (scenario.bgClass.includes('cafe')) return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200';
    if (scenario.bgClass.includes('office')) return 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200';
    return 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=1200';
  };

  const getNpcPortrait = (choice?: DialogueChoice | null) => {
    if (choice?.npc_expression_url) return choice.npc_expression_url;

    const isEmma = scenario.npc_portrait_class?.includes('emma') || scenario.npc_name?.toLowerCase().includes('emma');
    const isBrian = scenario.npc_portrait_class?.includes('brian') || scenario.npc_name?.toLowerCase().includes('brian');
    const type = choice?.type?.toLowerCase() || 'neutral';

    if (isEmma) {
      if (type === 'friendly' || type === 'correct') {
        return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600'; // Smiling Emma
      }
      if (type === 'direct' || type === 'confident') {
        return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600'; // Confident Arms Crossed Emma
      }
      if (type === 'incorrect') {
        return 'https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=600'; // Shocked / Confused
      }
      return 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600'; // Neutral Business Class Emma
    }

    if (isBrian) {
      if (type === 'friendly' || type === 'correct') {
        return 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600'; // Smiling Executive Brian
      }
      if (type === 'direct' || type === 'confident') {
        return 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600'; // Confident Manager
      }
      if (type === 'incorrect') {
        return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600'; // Frustrated / Shocked
      }
      return 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600'; // Neutral Brian
    }

    // Default: Barista Alex
    if (type === 'friendly' || type === 'correct') {
      return 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600'; // Happy Bearded Barista Alex
    }
    if (type === 'direct' || type === 'confident') {
      return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600'; // Strong Look Alex
    }
    if (type === 'incorrect') {
      return 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600'; // Concerned Barista Alex
    }
    if (scenario.npcOpenSceneUrl) return scenario.npcOpenSceneUrl;
    return 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=600'; // Standard Alex
  };

  const designChoices = choices[0] || null;

  // Stats and evaluation processing
  const friendlyCount = selectedHistory.filter(h => h.choiceSelected.type === 'friendly').length;
  const neutralCount = selectedHistory.filter(h => h.choiceSelected.type === 'neutral' || h.choiceSelected.type === 'professional').length;
  const directCount = selectedHistory.filter(h => h.choiceSelected.type === 'direct' || h.choiceSelected.type === 'confident').length;
  const correctCount = selectedHistory.filter(h => h.choiceSelected.type === 'correct').length;
  const incorrectCount = selectedHistory.filter(h => h.choiceSelected.type === 'incorrect').length;
  const correctionCount = selectedHistory.filter(h => h.choiceSelected.type === 'recalled_correction').length;

  const totalSelections = selectedHistory.length || 1;

  // Let's determine dominant archetype
  let dominantArchetype = "Balanced Communicator";
  let dominantColor = "from-indigo-900 to-slate-950 border-indigo-500/25";
  let dominantDesc = "You adapt smoothly to the context, balancing warm relation building with clear transactional queries.";
  let dominantEmoji = "🎭";

  if (difficulty === 'Beginner') {
    const scorePct = Math.round((correctCount / totalSelections) * 100);
    if (scorePct >= 80) {
      dominantArchetype = "Natural Anglophone";
      dominantColor = "from-emerald-950 to-slate-950 border-emerald-500/25";
      dominantDesc = "Incredible grammar and phrasing stability! You chose highly polite and grammatically pristine lines.";
      dominantEmoji = "🌟";
    } else if (scorePct >= 50) {
      dominantArchetype = "Grammar Explorer";
      dominantColor = "from-amber-950 to-slate-950 border-amber-500/25";
      dominantDesc = "You are picking up the structure quickly! Continue practicing correct patterns to refine conversational habit.";
      dominantEmoji = "📚";
    } else {
      dominantArchetype = "Determined Starter";
      dominantColor = "from-rose-950 to-slate-950 border-rose-500/25";
      dominantDesc = "No worries! Speech simulated practice is key. Use the Grammar Partner suggestions to boost recall next time.";
      dominantEmoji = "💪";
    }
  } else {
    // Intermediate & Advanced Style evaluations
    const maxStyleVal = Math.max(friendlyCount, neutralCount, directCount);
    if (maxStyleVal > 0) {
      if (friendlyCount === maxStyleVal) {
        dominantArchetype = "Empathic Rapport Builder";
        dominantColor = "from-amber-950 to-slate-950 border-amber-500/25";
        dominantDesc = "You prioritize mutual comfort, pleasantries, and deep natural warmth. Counterparts feel highly welcomed by you!";
        dominantEmoji = "🌸";
      } else if (neutralCount === maxStyleVal) {
        dominantArchetype = "Polished Diplomat";
        dominantColor = "from-indigo-950 to-slate-950 border-indigo-500/25";
        dominantDesc = "You maintain precise, highly structured, and elegant formal lines. Perfect for professional negotiations or corporate environments.";
        dominantEmoji = "💼";
      } else if (directCount === maxStyleVal) {
        dominantArchetype = "Magnetic Goal-Getter";
        dominantColor = "from-emerald-950 to-slate-950 border-emerald-500/25";
        dominantDesc = "Highly efficient, secure, and commanding. You excel at direct transactions and brief natural declarations.";
        dominantEmoji = "⚡";
      }
    }
  }

  const friendlyPct = Math.round((friendlyCount / totalSelections) * 100);
  const neutralPct = Math.round((neutralCount / totalSelections) * 100);
  const directPct = Math.round((directCount / totalSelections) * 100);

  if (showFeedbackScreen) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-grow flex flex-col justify-between p-6 sm:p-8 bg-[#090d22] rounded-[2rem] border border-slate-900 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] -top-40 -left-40 pointer-events-none"></div>
        <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] -bottom-40 -right-40 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-6 flex-1 max-w-5xl mx-auto w-full">
          
          {/* Header section */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800 pb-5 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-amber-500/10">
                🎓
              </div>
              <div>
                <h2 className="text-xl font-black text-white leading-none font-sans">Scenario Completed!</h2>
                <p className="text-xs text-slate-400 mt-1.5 font-medium">Immersive speech loops & pragmatic performance analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-slate-300 border border-slate-800 text-[10px] px-3.5 py-1.5 rounded-xl font-bold font-mono tracking-wide uppercase">
                {scenario.title.split('•')[0] || "Interactive"}
              </span>
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] px-3.5 py-1.5 rounded-xl font-black uppercase">
                {difficulty} LEVEL
              </span>
            </div>
          </div>

          {/* Core Analytics Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Left Column: Archetype assessment */}
            <div className={`lg:col-span-5 bg-gradient-to-b ${dominantColor} p-6 rounded-[2rem] border flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden`}>
              <div className="absolute top-4 right-4 text-6xl opacity-20 pointer-events-none">{dominantEmoji}</div>
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">PRAGMATIC COMMUNICATOR TYPE</span>
                <h3 className="text-2xl font-black text-white leading-tight font-sans tracking-tight">
                  {dominantArchetype}
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed font-sans mt-1">
                  {dominantDesc}
                </p>
              </div>

              <div className="bg-slate-950/90 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h5 className="text-[10px] text-slate-400 font-bold uppercase leading-none">Coins Earned</h5>
                    <p className="text-sm font-extrabold text-white mt-1">
                      +{selectedHistory.reduce((sum, h) => sum + (h.choiceSelected.money || 0), 0)} 🪙
                    </p>
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-800"></div>
                <div>
                  <h5 className="text-[10px] text-slate-400 font-bold uppercase leading-none text-right">Mistake Lapses</h5>
                  <p className="text-sm font-extrabold text-rose-400 mt-1 text-right">
                    {incorrectCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Pragmatic Style break-downs */}
            <div className="lg:col-span-7 bg-slate-900/60 p-6 rounded-[2rem] border border-slate-850 flex flex-col gap-5 justify-between">
              
              <div className="flex flex-col gap-1.5">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider font-sans">Pragmatic Tonal Profile</h4>
                <p className="text-[11px] text-slate-400 font-medium">How your phrasing adapted across key transactional, friendly, and formal parameters:</p>
              </div>

              {difficulty === 'Beginner' ? (
                <div className="flex flex-col gap-4 py-2">
                  <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-200">First-Time Perfect Choices</h5>
                      <p className="text-[10px] text-slate-400 mt-1">Direct unassisted grammatical completions</p>
                    </div>
                    <span className="text-lg font-black text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                      {correctCount} / {totalSelections}
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-200">Grammar Partner Recalls</h5>
                      <p className="text-[10px] text-slate-400 mt-1">Assisted and completed with phonetic suggestions</p>
                    </div>
                    <span className="text-lg font-black text-amber-500 font-mono bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                      {correctionCount}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  
                  {/* Aspect A: Friendly */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold font-sans">
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <Heart className="w-3.5 h-3.5" /> Friendly & Rapport
                      </span>
                      <span className="text-slate-300 font-mono">{friendlyPct}% ({friendlyCount} select)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-400 h-full transition-all duration-500" style={{ width: `${friendlyPct}%` }}></div>
                    </div>
                  </div>

                  {/* Aspect B: Neutral / Professional */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold font-sans">
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <Shield className="w-3.5 h-3.5" /> Structured & Diplomatic
                      </span>
                      <span className="text-slate-300 font-mono">{neutralPct}% ({neutralCount} select)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-gradient-to-r from-indigo-500 to-sky-400 h-full transition-all duration-500" style={{ width: `${neutralPct}%` }}></div>
                    </div>
                  </div>

                  {/* Aspect C: Direct / Confident */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold font-sans">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Compass className="w-3.5 h-3.5" /> Assertive & Decisive
                      </span>
                      <span className="text-slate-300 font-mono">{directPct}% ({directCount} select)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500" style={{ width: `${directPct}%` }}></div>
                    </div>
                  </div>

                </div>
              )}

              <div className="bg-[#151c33]/50 p-3.5 rounded-xl border border-blue-500/10 text-slate-300 text-[10px] leading-relaxed flex items-center gap-2 font-medium font-sans">
                <Sparkles className="text-blue-400 w-4 h-4 flex-shrink-0 animate-pulse" />
                <span>
                  <strong>Algorithm Note:</strong> Your completed scenario sentences are now saved under core memory profiles and synced into your spaced repetition flashcard deck for periodic recall reviews!
                </span>
              </div>

            </div>

          </div>

          {/* Dialogue turns scroll section */}
          <div className="flex-grow flex flex-col min-h-0">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2 font-sans">
              📜 Conversation nodes transcript & choices
            </h4>
            
            <div className="flex-1 bg-slate-950/80 border border-slate-850 rounded-[1.5rem] p-4 overflow-y-auto max-h-[180px] flex flex-col gap-3 font-sans">
              {selectedHistory.map((node, index) => {
                let nodeStyleBg = "border-slate-800 hover:border-slate-700 bg-slate-900/40";
                let styleBadge = "text-slate-400 bg-slate-800 border-slate-700";

                if (node.choiceSelected.type === 'incorrect') {
                  nodeStyleBg = "border-rose-500/20 bg-rose-950/10 hover:border-rose-500/30";
                  styleBadge = "text-rose-400 bg-rose-500/5 border-rose-500/10";
                } else if (node.choiceSelected.type === 'correct') {
                  nodeStyleBg = "border-emerald-500/20 bg-emerald-950/5 hover:border-emerald-500/35";
                  styleBadge = "text-emerald-400 bg-emerald-500/5 border-emerald-500/10";
                } else if (node.choiceSelected.type === 'friendly') {
                  styleBadge = "text-amber-400 bg-amber-500/5 border-amber-500/10";
                } else if (node.choiceSelected.type === 'neutral' || node.choiceSelected.type === 'professional') {
                  styleBadge = "text-indigo-400 bg-indigo-500/5 border-indigo-500/10";
                } else if (node.choiceSelected.type === 'direct' || node.choiceSelected.type === 'confident') {
                  styleBadge = "text-emerald-400 bg-emerald-500/5 border-emerald-500/10";
                } else if (node.choiceSelected.type === 'recalled_correction') {
                  nodeStyleBg = "border-amber-500/20 bg-amber-950/5 hover:border-amber-500/30";
                  styleBadge = "text-amber-400 bg-amber-500/5 border-amber-500/10";
                }

                return (
                  <div key={index} className={`border p-3.5 rounded-xl flex flex-col gap-2 transition-all ${nodeStyleBg}`}>
                    <div className="flex items-center justify-between gap-2.5">
                      <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider font-sans">
                        Turn {index + 1} • {node.npcMessage.includes("Learned correction") ? "Phonetic Coach Hint" : `Counterpart Context`}
                      </span>
                      <span className={`text-[8px] font-black uppercase border tracking-wider px-2 py-0.5 rounded-full ${styleBadge}`}>
                        {node.choiceSelected.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="text-slate-400 font-medium">
                        <span className="text-[9px] text-[#8b6508] font-extrabold uppercase mr-1">Prompt:</span>
                        "{node.npcMessage}"
                      </div>
                      <div className="text-slate-100 font-bold">
                        <span className="text-[9px] text-amber-500 font-extrabold uppercase mr-1">You said:</span>
                        "{node.choiceSelected.text}"
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Action controls footer */}
        <div className="relative z-10 border-t border-slate-850 pt-5 mt-4 flex justify-end gap-3 font-sans">
          <button 
            onClick={onExit}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black py-4 px-10 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 flex items-center gap-2 font-sans"
          >
            Complete Simulation & Return to City map <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </motion.div>
    );
  }

  return (
    <div className="flex-grow flex flex-col justify-between relative overflow-hidden min-h-[580px] w-full bg-slate-950 rounded-[2rem]">
      {/* Immersive background layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 filter brightness-[0.4]" 
        style={{ backgroundImage: `url('${getBgImage()}')` }}
      ></div>
      <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent z-10 pointer-events-none"></div>

      {/* Dynamic character portrait aligned right */}
      <div className="absolute right-2 sm:right-10 md:right-24 bottom-0 w-[180px] h-[270px] xs:w-[220px] xs:h-[330px] sm:w-[320px] sm:h-[450px] md:w-[420px] md:h-[500px] z-20 opacity-60 sm:opacity-100 pointer-events-none transition-all duration-500 transform hover:scale-[1.015]">
        <img 
          src={getNpcPortrait(selectedHistory[selectedHistory.length - 1]?.choiceSelected || incorrectSelected || null)} 
          alt={scenario.npc_name}
          className="w-full h-full object-contain object-bottom filter contrast-[1.03] drop-shadow-[0_15px_15px_rgba(0,0,0,0.85)]"
        />
      </div>

      {/* Top action context bar */}
      <div className="relative z-30 p-5 flex flex-wrap gap-3 justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={onExit}
            className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-bold px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-1.5 text-xs transition-transform active:scale-95"
          >
            <ArrowLeft size={13} /> Exit Situation
          </button>
          
          {locationKey && locationKey.startsWith('cafe') && (
            <button
              onClick={toggleAmbientSound}
              className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                ambientPlaying 
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-black' 
                  : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-300 font-semibold'
              }`}
              title={ambientPlaying ? "Mute Cafe Ambience" : "Play Cozy Cafe Background Ambience"}
            >
              <Coffee size={13} className={ambientPlaying ? "animate-pulse" : ""} />
              <span>{ambientPlaying ? "☕ Ambience: Playing" : "☕ Ambience: Muted"}</span>
            </button>
          )}
        </div>
        <span className="text-xs text-amber-500 font-extrabold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase flex items-center gap-1">
          <Star size={12} className="text-amber-500 fill-amber-500" /> {scenario.npc_name} • {difficulty} Mode
        </span>
      </div>

      {/* Narrative Dialogue Speech bubbles */}
      <div className="relative z-30 flex-grow flex items-center justify-center p-6 md:pr-96">
        <AnimatePresence mode="wait">
          {showCorrection ? (
            /* Partner Assistance Grammatical Help Box Triggered on Error Selection on Beginner Level */
            <motion.div 
              key="assist-bubble"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-sm bg-slate-900/95 border-2 border-amber-500/30 text-white p-6 rounded-[2rem] shadow-2xl text-center flex flex-col items-center gap-3 relative backdrop-blur-md"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl animate-bounce">
                🤗
              </div>
              <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest leading-none font-sans">Grammar Partner Advice</h4>
              <p className="text-xs text-slate-300 font-medium font-sans">You selected an unnatural phrasing. Let's learn the standard polite option pattern:</p>
              
              {incorrectSelected?.explanation && (
                <div className="bg-rose-950/40 p-3.5 border border-rose-500/25 rounded-2xl w-full text-left">
                  <span className="text-[7.5px] uppercase font-black tracking-wider text-rose-400 block mb-1">Partner Correction Note</span>
                  <p className="text-xs text-rose-100 font-sans leading-relaxed">
                    {incorrectSelected.explanation}
                  </p>
                  {motherTongue && motherTongue !== 'English' && (
                    <TranslatedText text={incorrectSelected.explanation} to={motherTongue} className="text-[10px] text-amber-500/90 mt-1" />
                  )}
                </div>
              )}

              <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl w-full text-left">
                <span className="text-[7.5px] uppercase font-black tracking-wider text-emerald-400 block mb-1">Standard Recommendation</span>
                <p className="text-xs font-black italic text-emerald-400 font-sans leading-relaxed">
                  "{choices.find(c => c.type === 'correct' || c.type === 'friendly')?.text || choices[0].text}"
                </p>
                {motherTongue && motherTongue !== 'English' && (
                  <TranslatedText 
                    text={choices.find(c => c.type === 'correct' || c.type === 'friendly')?.text || choices[0].text} 
                    to={motherTongue} 
                    className="text-[10px] text-emerald-400/85 mt-1" 
                  />
                )}
                <div className="mt-4 text-left">
                  <IntonationGuide text={choices.find(c => c.type === 'correct' || c.type === 'friendly')?.text || choices[0].text} />
                </div>
              </div>

              <div className="flex flex-col gap-1 w-full mt-1.5 font-sans">
                <button 
                  onClick={handleLearnCorrection}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-colors shadow-lg uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Yes, Learn Phrase & Continue
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={turnIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[310px] xs:max-w-sm sm:max-w-md bg-slate-950/90 backdrop-blur-md border border-amber-500/20 text-slate-100 p-4 sm:p-5 rounded-3xl shadow-2xl relative"
            >
              <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 rotate-45 w-4 h-4 bg-slate-950 border-r border-t border-amber-500/20 z-0"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2 gap-3">
                  <span className="text-[10px] font-black tracking-widest text-[#ea7c49] uppercase">{scenario.npc_name} (Spot Host)</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => speakDialogueText(currentTurn.npc_message)}
                      className="text-amber-400 hover:text-amber-300 p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                      title="Audio play speech synthesis"
                    >
                      <Volume2 size={13} />
                    </button>
                    <button 
                      onClick={() => setShowTranslation(!showTranslation)}
                      className={`p-1 rounded-lg border transition-all cursor-pointer ${
                        showTranslation 
                          ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' 
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-300'
                      }`}
                      title="Toggle translation text"
                    >
                      <Languages size={13} />
                    </button>
                    <button 
                      onClick={() => setShowNpcIntonation(!showNpcIntonation)}
                      className={`p-1 rounded-lg border transition-all cursor-pointer text-[10.5px] leading-none ${
                        showNpcIntonation 
                          ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' 
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-300'
                      }`}
                      title="Show vocal pitch contour map"
                    >
                      🗣️
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-bold leading-relaxed text-slate-100 font-sans">
                  {currentTurn.npc_message}
                </p>
                {showNpcIntonation && (
                  <div className="mt-3 text-left">
                    <IntonationGuide 
                      text={currentTurn.npc_message} 
                      gender={scenario.npc_gender}
                      accent={scenario.npc_accent}
                      voiceName={scenario.npc_voice_name}
                    />
                  </div>
                )}
                {motherTongue && motherTongue !== 'English' && (
                  <div className="mt-1 pt-1 border-t border-white/5">
                    <span className="text-[7.5px] uppercase font-bold text-amber-500/80 tracking-widest block mb-0.5">Mother Tongue ({motherTongue})</span>
                    <TranslatedText text={currentTurn.npc_message} to={motherTongue} className="text-xs text-amber-400 mt-0" />
                  </div>
                )}

                {/* Translate block expansion matching language learners mockup */}
                {showTranslation && (
                  <div className="border-t border-white/5 mt-3 pt-2">
                    <span className="text-[8px] font-black text-[#ea7c49] uppercase tracking-widest block mb-1">Pragmatic Translation Help</span>
                    <TranslatedText 
                      text={currentTurn.npc_message} 
                      to={motherTongue && motherTongue !== 'English' ? motherTongue : 'Spanish'} 
                      className="text-xs text-slate-300 not-italic font-sans" 
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Choice Selector Rail */}
      <div className="relative z-30 px-4 sm:px-6 max-w-3xl mx-auto w-full flex flex-col gap-3 pb-4">
        {!showCorrection && (
          difficulty === 'Advanced' ? (
            <div className="w-full bg-[#0d1224]/95 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5 font-sans">
              <div className="flex items-center justify-between border-b border-indigo-950 pb-3 gap-3">
                <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-extrabold uppercase tracking-wide">
                  <Sparkles size={14} className="text-amber-400 animate-pulse" /> Advanced Native Speech Hub
                </span>
                <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold uppercase">
                  Voice Match Activated
                </span>
              </div>

              {/* State A: Not spoken or currently recording */}
              {!advancedTranscript ? (
                <div className="flex flex-col items-center justify-center py-6 gap-4 bg-slate-950/60 rounded-xl border border-slate-900 p-5">
                  <div className="text-center max-w-md">
                    <p className="text-xs text-slate-300 font-semibold mb-2 leading-relaxed">
                      "Speak your custom verbal response to progress the simulation. Your speech is compared in real-time with 3 distinct pragmatic pathways."
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={startAdvancedVoiceRecording}
                      disabled={isRecording}
                      className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black py-3 px-6 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 disabled:opacity-40 animate-pulse"
                    >
                      <Mic size={14} /> {isRecording ? "Listening..." : "microphone • Record My Voice"}
                    </button>
                  </div>

                  {/* Fallback keyboard typing input box for accessibility */}
                  <div className="w-full mt-2 pt-3 border-t border-slate-900 flex flex-col gap-2">
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Or type your speech response here:</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={typedFallbackText}
                        onChange={(e) => setTypedFallbackText(e.target.value)}
                        placeholder="E.g., Good morning! May I get a flat white with oat milk, please?"
                        className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && typedFallbackText.trim()) {
                            processAdvancedSpokenResult(typedFallbackText);
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (typedFallbackText.trim()) processAdvancedSpokenResult(typedFallbackText);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* State B: User input successfully analyzed */
                <div className="flex flex-col gap-4 bg-slate-950/80 rounded-xl border border-slate-850 p-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-[9.5px] font-black text-amber-500 uppercase tracking-widest">Active Speech Captured:</span>
                    <button 
                      onClick={() => setAdvancedTranscript(null)}
                      className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider"
                    >
                      Clear & Try Again
                    </button>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <p className="text-xs text-emerald-400 font-black italic">
                      "{advancedTranscript}"
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Select your stylistic branch path below (weighted by voice match similarity):</div>
                  <div className="flex flex-col gap-2.5 font-sans">
                    {choices.map(ch => {
                      const matchPct = advancedScores[ch.id] || 0;
                      const isClosest = ch.id === closestChoiceId;
                      let optionBadge = "Friendly";
                      let optionTheme = "border-amber-400/20 hover:border-amber-500/50 hover:bg-amber-950/10";
                      
                      if (ch.type === 'professional' || ch.type === 'neutral') {
                        optionBadge = "Polished Formal";
                        optionTheme = "border-indigo-400/20 hover:border-indigo-500/50 hover:bg-indigo-950/10";
                      } else if (ch.type === 'confident' || ch.type === 'direct') {
                        optionBadge = "Assertive Direct";
                        optionTheme = "border-emerald-400/20 hover:border-emerald-500/50 hover:bg-emerald-950/10";
                      }

                      const chVotes = dbChoiceStats ? ((dbChoiceStats[ch.id] as number) || 0) : 0;
                      const chPercent = totalVotes > 0 ? Math.round((chVotes / totalVotes) * 100) : 0;
                      const isPopular = ch.id === mostPopularId && chVotes > 0;

                      return (
                        <div 
                          key={ch.id} 
                          onClick={() => handleAdvancedChoiceClick(ch, matchPct)}
                          className={`p-3.5 rounded-xl border bg-slate-950 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${optionTheme} ${isClosest ? 'ring-2 ring-amber-500/50' : ''}`}
                        >
                          <div className="flex-1 flex flex-col gap-1 w-full">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[8.5px] uppercase font-bold text-slate-400">{optionBadge} Pathway</span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {isPopular && (
                                  <span className="text-[7.5px] font-black uppercase text-pink-450 bg-pink-500/15 border border-pink-500/30 px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(236,72,153,0.25)]">
                                    🔥 Community Favorite
                                  </span>
                                )}
                                {chVotes > 0 && (
                                  <span className="text-[7.5px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                                    👤 {chPercent}% ({chVotes} votes)
                                  </span>
                                )}
                                {ch.type !== 'incorrect' && (
                                  <span className="text-[7.5px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                    ★ Recommended
                                  </span>
                                )}
                                {isClosest && (
                                  <span className="text-[7.5px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded animate-pulse">
                                    Closest Match!
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-200 font-bold leading-relaxed">
                              "{ch.text}"
                            </p>
                            {motherTongue && motherTongue !== 'English' && (
                              <TranslatedText text={ch.text} to={motherTongue} className="text-[10px] text-amber-500/85 italic font-sans" />
                            )}
                            {isClosest && (
                              <div className="mt-3 text-left w-full" onClick={(e) => e.stopPropagation()}>
                                <IntonationGuide text={ch.text} />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto font-mono text-xs">
                            <span className="text-slate-400 text-[10px]">Match:</span>
                            <span className={`font-black px-2 py-1 rounded-lg ${matchPct >= 70 ? 'text-emerald-400 bg-emerald-500/10' : matchPct >= 40 ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-900'}`}>
                              {matchPct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            choices.map((ch, idx) => {
              const chVotes = dbChoiceStats ? ((dbChoiceStats[ch.id] as number) || 0) : 0;
              const chPercent = totalVotes > 0 ? Math.round((chVotes / totalVotes) * 100) : 0;
              const isPopular = ch.id === mostPopularId && chVotes > 0;

              return (
                <motion.button 
                  key={ch.id}
                  onClick={() => handleChoiceClick(ch)}
                  className="w-full flex items-center gap-4 p-3.5 sm:p-4 border border-slate-800/80 bg-slate-900/90 hover:border-amber-500/40 hover:bg-[#111c3a]/75 rounded-2xl text-left shadow-2xl transition-all duration-150 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 text-amber-500 flex items-center justify-center text-xs font-black group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:border-amber-400 flex-shrink-0 transition-all font-mono shadow-inner">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div className="flex-grow flex flex-col gap-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white leading-relaxed">
                        {ch.text}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
                        {isPopular && (
                          <span className="text-[7.5px] font-black uppercase text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(236,72,153,0.15)] opacity-95">
                            🔥 Community Suggestion
                          </span>
                        )}
                        {chVotes > 0 && (
                          <span className="text-[7.5px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
                            👤 {chPercent}% ({chVotes} select)
                          </span>
                        )}
                      </div>
                    </div>
                    {motherTongue && motherTongue !== 'English' && (
                      <TranslatedText text={ch.text} to={motherTongue} className="text-[10.5px] text-amber-500/90 font-sans italic mt-0.5" />
                    )}
                  </div>
                </motion.button>
              );
            })
          )
        )}
      </div>

      {/* Sound practice widget footer */}
      <div className="relative z-30 px-6 pb-6 pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-900/60 bg-slate-950/80 backdrop-blur-md">
        
        {/* Dynamic Voice Practice Panel */}
        {difficulty === 'Advanced' ? (
          <div className="flex items-center gap-3 font-sans">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h5 className="text-[10px] font-black text-indigo-400 leading-none uppercase">Interactive Advanced Analyzer</h5>
              <p className="text-[9px] text-slate-400 mt-1">Your native style matches dynamically to progress options.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button 
              disabled={isRecording}
              onClick={() => {
                const properPhrase = choices.find(c => c.type === 'correct' || c.type === 'friendly') || choices[0];
                startVoiceRecording(properPhrase.text);
              }}
              className="w-12 h-12 rounded-full bg-amber-600 hover:bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Read recommended correct phrase into mic"
            >
              {isRecording ? <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" /> : <Mic className="w-5 h-5" />}
            </button>
            <div>
              <h5 className="text-[10px] font-black text-amber-400 leading-none">Phonetic Coach Mode</h5>
              <p className="text-[9px] text-slate-400 mt-1">Tap to speak the ideal answer and get feedback.</p>
            </div>
          </div>
        )}

        {/* Waves display during mic capture */}
        <div className="flex-1 max-w-xs h-10 bg-slate-900 border border-slate-850 rounded-xl overflow-hidden relative shadow-inner">
          <canvas ref={canvasRef} className="w-full h-full"></canvas>
          {!isRecording && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">Waveform analyzer inactive</span>
            </div>
          )}
        </div>

        {/* Real-time speech evaluation hud */}
        {evaluation && (
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-left max-w-sm flex items-center gap-2.5">
            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
              {evaluation.score}%
            </span>
            <div className="min-w-0">
              <div 
                className="text-[10px] text-slate-300 leading-relaxed font-semibold max-h-12 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: evaluation.wordsHtml }}
              ></div>
            </div>
          </div>
        )}

        {/* Easy vs Hard relative scale */}
        {designChoices && (
          <button 
            onClick={() => setShowHint(!showHint)}
            className="text-[10px] text-amber-500 hover:text-amber-400 font-bold bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20"
          >
            <span className="flex items-center gap-1">
              <HelpCircle size={12} /> {showHint ? 'Hide System Hint' : 'Get Context Hint'}
            </span>
          </button>
        )}
      </div>

      {/* In-app custom hint screen overlay card */}
      <AnimatePresence>
        {showHint && designChoices && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-6 right-6 z-40 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl"
          >
            <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Interactive Translation and Context guidance</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{designChoices.explanation}</p>
            {motherTongue && motherTongue !== 'English' && (
              <TranslatedText text={designChoices.explanation} to={motherTongue} className="text-[10px] text-amber-500/90 mt-1" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
