import React, { useState, useEffect, useRef } from 'react';
import { getSituations } from '../utils/storage';
import { Situation, DraggableType, PlayerColor } from '../types';
import { SoccerField } from './SoccerField';
import { BallToken } from './BallToken';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import confetti from 'canvas-confetti';
import { ArrowLeft, CheckCircle, Volume2, Star, Trophy, Target, Sparkles } from 'lucide-react';
import { playElevenLabsAudio, isElevenLabsAvailable } from '../utils/elevenlabs';

// Speel opgenomen audio af
const playRecordedAudio = (audioData: string): Promise<void> => {
    return new Promise((resolve) => {
        const audio = new Audio(audioData);
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
    });
};

// Browser Text-to-speech als laatste fallback
const speakTextBrowser = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'nl-NL';
        utterance.rate = 1.0;  
        utterance.pitch = 1.1; 
        
        const voices = window.speechSynthesis.getVoices();
        const bestVoice = 
            voices.find(v => v.name.includes('Online') && v.lang.startsWith('nl')) ||
            voices.find(v => v.name.includes('Colette')) ||
            voices.find(v => v.name.includes('Fenna')) ||
            voices.find(v => v.name.includes('Google') && v.lang.startsWith('nl')) ||
            voices.find(v => v.lang.startsWith('nl'));
        
        if (bestVoice) {
            utterance.voice = bestVoice;
        }
        
        window.speechSynthesis.speak(utterance);
    }
};

// Smart TTS: probeer ElevenLabs, val terug op browser TTS
const speakText = async (text: string) => {
    if (isElevenLabsAvailable()) {
        const success = await playElevenLabsAudio(text);
        if (success) return;
    }
    // Fallback naar browser TTS
    speakTextBrowser(text);
};

// Slim afspelen: 1) opname, 2) ElevenLabs, 3) browser TTS
const playQuestion = async (situation: Situation) => {
    if (situation.questionAudio) {
        await playRecordedAudio(situation.questionAudio);
    } else {
        await speakText(situation.question);
    }
};

// Kleuren voor de shirts (zelfde als PlayerToken)
const shirtColors: Record<PlayerColor, { fill: string; stroke: string; text: string }> = {
  keeper1: { fill: '#22c55e', stroke: '#15803d', text: 'white' },
  team1: { fill: '#ef4444', stroke: '#b91c1c', text: 'white' },
  team2: { fill: '#3b82f6', stroke: '#1d4ed8', text: 'white' },
  keeper2: { fill: '#facc15', stroke: '#ca8a04', text: 'black' },
};

// Draggable token dat shirt of bal toont op basis van type
const DraggableUserToken = ({ x, y, type }: { x: number, y: number, type: DraggableType }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: 'user-player',
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : undefined;

    // Render een voetbal
    if (type === 'ball') {
        return (
            <div
                ref={setNodeRef}
                style={{
                    ...style,
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                }}
                {...listeners}
                {...attributes}
                className="touch-none cursor-move"
            >
                <div style={{ transform: 'translate(-50%, -50%)' }} className="relative animate-pulse">
                    <svg viewBox="0 0 50 50" className="w-12 h-12 drop-shadow-lg">
                        {/* Voetbal basis */}
                        <circle cx="25" cy="25" r="23" fill="white" stroke="#333" strokeWidth="2"/>
                        {/* Zwarte vlakken */}
                        <path d="M25 2 L30 12 L25 18 L20 12 Z" fill="#333"/>
                        <path d="M48 25 L38 30 L38 20 Z" fill="#333"/>
                        <path d="M2 25 L12 20 L12 30 Z" fill="#333"/>
                        <path d="M15 45 L20 38 L25 42 L30 38 L35 45 Z" fill="#333"/>
                        {/* JIJ tekst */}
                        <text x="25" y="29" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">JIJ</text>
                    </svg>
                </div>
            </div>
        );
    }

    // Render een shirt in de juiste kleur
    const colors = shirtColors[type as PlayerColor];
    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
            }}
            {...listeners}
            {...attributes}
            className="touch-none cursor-move"
        >
            <div style={{ transform: 'translate(-50%, -50%)' }} className="relative animate-pulse">
                <svg viewBox="0 0 40 44" className="w-12 h-14 drop-shadow-lg">
                    {/* Shirt body */}
                    <path
                        d="M8 12 L2 8 L6 2 L14 6 L16 4 L24 4 L26 6 L34 2 L38 8 L32 12 L32 42 L8 42 Z"
                        fill={colors.fill}
                        stroke={colors.stroke}
                        strokeWidth="2"
                    />
                    {/* Kraag */}
                    <path
                        d="M16 4 Q20 8 24 4"
                        fill="none"
                        stroke={colors.stroke}
                        strokeWidth="1.5"
                    />
                    {/* JIJ tekst */}
                    <text
                        x="20"
                        y="28"
                        textAnchor="middle"
                        fill={colors.text}
                        fontSize="11"
                        fontWeight="bold"
                    >
                        JIJ
                    </text>
                </svg>
            </div>
        </div>
    );
};

// Trigger awesome confetti burst
const triggerSuccessConfetti = () => {
    // Eerste burst
    confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6, x: 0.5 },
        colors: ['#22c55e', '#16a34a', '#fbbf24', '#f59e0b', '#ffffff'],
    });
    
    // Zijkanten
    setTimeout(() => {
        confetti({
            particleCount: 40,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: ['#22c55e', '#fbbf24'],
        });
        confetti({
            particleCount: 40,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: ['#16a34a', '#f59e0b'],
        });
    }, 150);
    
    // Sterren
    setTimeout(() => {
        confetti({
            particleCount: 30,
            spread: 360,
            ticks: 100,
            gravity: 0.5,
            decay: 0.94,
            startVelocity: 20,
            shapes: ['star'],
            colors: ['#fbbf24', '#f59e0b'],
            origin: { y: 0.5 },
        });
    }, 300);
};

export const Quiz: React.FC = () => {
  const [situations, setSituations] = useState<Situation[]>([]);
  const [currentSituation, setCurrentSituation] = useState<Situation | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userPos, setUserPos] = useState({ x: 50, y: 90 });
  const [feedback, setFeedback] = useState<'none' | 'success' | 'fail'>('none');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const fieldRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor)
  );

  useEffect(() => {
    const loadSituations = async () => {
      const data = await getSituations();
      setSituations(data);
    };
    loadSituations();
  }, []);

  useEffect(() => {
      if (feedback === 'fail') {
          const timer = setTimeout(() => setFeedback('none'), 2500);
          return () => clearTimeout(timer);
      }
  }, [feedback]);

  // Speel de vraag af wanneer een situatie wordt geselecteerd
  useEffect(() => {
      if (currentSituation) {
          playQuestion(currentSituation);
      }
  }, [currentSituation]);

  const handleDragEnd = (event: DragEndEvent) => {
      const { delta } = event;
      if (!fieldRef.current || !currentSituation) return;

      const rect = fieldRef.current.getBoundingClientRect();
      const deltaXPercent = (delta.x / rect.width) * 100;
      const deltaYPercent = (delta.y / rect.height) * 100;
      
      const newX = Math.max(0, Math.min(100, userPos.x + deltaXPercent));
      const newY = Math.max(0, Math.min(100, userPos.y + deltaYPercent));
      
      setUserPos({ x: newX, y: newY });

      const target = currentSituation.targetArea;
      
      const pX = (newX / 100) * rect.width;
      const pY = (newY / 100) * rect.height;
      
      const tX = (target.x / 100) * rect.width;
      const tY = (target.y / 100) * rect.height;
      
      const distance = Math.sqrt(Math.pow(pX - tX, 2) + Math.pow(pY - tY, 2));
      const radiusPixels = (target.radius / 100) * rect.width;

      if (distance <= radiusPixels) {
          setFeedback('success');
          setScore(prev => prev + 1);
          setStreak(prev => prev + 1);
          setAttempts(prev => prev + 1);
          speakText('Super goed!');
          triggerSuccessConfetti();
      } else {
          setFeedback('fail');
          setStreak(0);
          setAttempts(prev => prev + 1);
          speakText('Helaas pindakaas!');
      }
  };

  const selectSituation = (s: Situation, index: number) => {
      setCurrentSituation(s);
      setCurrentIndex(index);
      setUserPos({ x: 50, y: 90 });
      setFeedback('none');
  };

  const goToNextExercise = () => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < situations.length) {
          selectSituation(situations[nextIndex], nextIndex);
      } else {
          // Terug naar overzicht
          setCurrentSituation(null);
      }
  };

  if (!currentSituation) {
      return (
          <div className="w-full max-w-2xl mx-auto">
              {/* Score overzicht */}
              {attempts > 0 && (
                  <div className="glass rounded-2xl p-6 mb-6 shadow-playful animate-pop-in">
                      <div className="flex items-center justify-center gap-8">
                          <div className="text-center">
                              <div className="flex items-center justify-center gap-2 text-amber-500 mb-1">
                                  <Trophy size={24} />
                                  <span className="text-3xl font-bold">{score}</span>
                              </div>
                              <p className="text-sm text-gray-600 font-medium">Goed</p>
                          </div>
                          <div className="w-px h-12 bg-gray-200" />
                          <div className="text-center">
                              <div className="flex items-center justify-center gap-2 text-green-500 mb-1">
                                  <Target size={24} />
                                  <span className="text-3xl font-bold">{attempts > 0 ? Math.round((score / attempts) * 100) : 0}%</span>
                              </div>
                              <p className="text-sm text-gray-600 font-medium">Score</p>
                          </div>
                          {streak >= 3 && (
                              <>
                                  <div className="w-px h-12 bg-gray-200" />
                                  <div className="text-center">
                                      <div className="flex items-center justify-center gap-2 text-orange-500 mb-1">
                                          <Sparkles size={24} />
                                          <span className="text-3xl font-bold">{streak}x</span>
                                      </div>
                                      <p className="text-sm text-gray-600 font-medium">Streak!</p>
                                  </div>
                              </>
                          )}
                      </div>
                  </div>
              )}

              {/* Titel */}
              <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gradient mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                      Kies een oefening
                  </h2>
                  <p className="text-green-700">Laat zien waar jij moet staan! 🎯</p>
              </div>

              {situations.length === 0 ? (
                  <div className="glass rounded-2xl p-8 text-center shadow-playful">
                      <div className="text-6xl mb-4">📝</div>
                      <p className="text-gray-600 font-medium">Nog geen oefeningen gemaakt!</p>
                      <p className="text-sm text-gray-500 mt-2">Ga naar "Trainer" om oefeningen te maken.</p>
                  </div>
              ) : (
                  <div className="grid gap-4">
                      {situations.map((s, index) => (
                          <button 
                            key={s.id}
                            onClick={() => selectSituation(s, index)}
                            className="glass rounded-2xl p-5 text-left btn-bounce shadow-playful group"
                          >
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
                                      {index + 1}
                                  </div>
                                  <div className="flex-1">
                                      <div className="font-bold text-lg text-gray-800 group-hover:text-green-700 transition-colors">
                                          {s.question}
                                      </div>
                                      <div className="flex items-center gap-3 mt-1">
                                          <span className="text-sm text-gray-500">{s.players.length} spelers</span>
                                          {s.questionAudio && (
                                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">🎤 Audio</span>
                                          )}
                                      </div>
                                  </div>
                                  <div className="text-green-500 group-hover:translate-x-1 transition-transform">
                                      <ArrowLeft size={24} className="rotate-180" />
                                  </div>
                              </div>
                          </button>
                      ))}
                  </div>
              )}
          </div>
      );
  }

  return (
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
          {/* Top bar met navigatie en score */}
          <div className="flex items-center justify-between">
              <button 
                onClick={() => {
                    window.speechSynthesis.cancel();
                    setCurrentSituation(null);
                }}
                className="btn-bounce flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-xl text-gray-600 hover:text-green-700 font-medium shadow-sm"
              >
                  <ArrowLeft size={20} /> Terug
              </button>
              
              {/* Score indicator */}
              <div className="flex items-center gap-4">
                  {streak >= 2 && (
                      <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full font-bold animate-pulse">
                          <Sparkles size={16} />
                          {streak}x streak!
                      </div>
                  )}
                  <div className="flex items-center gap-1 bg-amber-100 text-amber-600 px-3 py-1.5 rounded-full font-bold">
                      <Star size={16} fill="currentColor" />
                      {score} / {attempts}
                  </div>
              </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
              <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                  style={{ width: `${((currentIndex + 1) / situations.length) * 100}%` }}
              />
          </div>

          {/* Main quiz card */}
          <div className="glass rounded-2xl p-5 shadow-playful">
              {/* Vraag met audio knop */}
              <div className="flex items-center justify-center gap-3 mb-5">
                  <h2 className="text-2xl font-bold text-gray-800 text-center" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                      {currentSituation.question}
                  </h2>
                  <button 
                    onClick={() => playQuestion(currentSituation)}
                    className="btn-bounce p-3 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
                    title="Lees voor"
                  >
                      <Volume2 size={22} />
                  </button>
              </div>
              
              <div ref={fieldRef} className="relative touch-none">
                  <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                      <SoccerField players={currentSituation.players}>
                          {/* Bal weergeven als die er is */}
                          {currentSituation.ball && (
                              <BallToken ball={currentSituation.ball} />
                          )}
                          
                          {feedback !== 'success' && (
                              <DraggableUserToken x={userPos.x} y={userPos.y} type={currentSituation.draggableType || 'team1'} />
                          )}
                          
                          {/* Success Overlay */}
                          {feedback === 'success' && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl z-50 animate-pop-in">
                                  <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                                      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce">
                                          <CheckCircle size={50} className="text-white" />
                                      </div>
                                      <div className="text-center">
                                          <p className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>Super goed!</p>
                                          <p className="text-gray-500 mt-1">Je staat op de juiste plek! ⭐</p>
                                      </div>
                                      <button 
                                          onClick={goToNextExercise}
                                          className="btn-bounce mt-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-shadow"
                                      >
                                          {currentIndex + 1 < situations.length ? 'Volgende oefening →' : 'Bekijk resultaten'}
                                      </button>
                                  </div>
                              </div>
                          )}
                          
                          {/* Fail Overlay */}
                          {feedback === 'fail' && (
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 animate-pop-in">
                                  <div className="bg-gradient-to-br from-amber-50 to-orange-100 text-amber-900 px-8 py-6 rounded-3xl font-bold shadow-2xl flex flex-col items-center gap-3 border-2 border-amber-200">
                                      <img src="/pindakaas.png" alt="Boterham met pindakaas" className="w-28 h-24 object-contain drop-shadow-md" />
                                      <p className="text-xl" style={{ fontFamily: 'Fredoka, sans-serif' }}>Helaas pindakaas!</p>
                                      <p className="text-sm text-amber-700 font-normal">Probeer het nog eens!</p>
                                  </div>
                              </div>
                          )}
                      </SoccerField>
                  </DndContext>
              </div>
              
              <p className="text-center text-gray-500 mt-4 font-medium">
                  👆 Sleep het shirt naar de juiste positie!
              </p>
          </div>
      </div>
  );
};
