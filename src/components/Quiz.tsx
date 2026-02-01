import React, { useState, useEffect, useRef } from 'react';
import { getSituations } from '../utils/storage';
import { Situation } from '../types';
import { SoccerField } from './SoccerField';
import { BallToken } from './BallToken';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import confetti from 'canvas-confetti';
import { ArrowLeft, CheckCircle, Volume2 } from 'lucide-react';
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

const UserPlayerToken = ({ x, y }: { x: number, y: number }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: 'user-player',
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : undefined;

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
             <div style={{ transform: 'translate(-50%, -50%)' }} className="relative">
                <div className="w-12 h-12 bg-orange-400 border-4 border-orange-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <span className="font-bold text-orange-900 text-xs">JIJ</span>
                </div>
             </div>
        </div>
    );
};

export const Quiz: React.FC = () => {
  const [situations, setSituations] = useState<Situation[]>([]);
  const [currentSituation, setCurrentSituation] = useState<Situation | null>(null);
  const [userPos, setUserPos] = useState({ x: 50, y: 90 });
  const [feedback, setFeedback] = useState<'none' | 'success' | 'fail'>('none');
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
          const timer = setTimeout(() => setFeedback('none'), 2000);
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
          speakText('Super goed!');
          confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
          });
      } else {
          setFeedback('fail');
          speakText('Helaas pindakaas!');
      }
  };

  const selectSituation = (s: Situation) => {
      setCurrentSituation(s);
      setUserPos({ x: 50, y: 90 });
      setFeedback('none');
  };

  if (!currentSituation) {
      return (
          <div className="w-full max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-green-900 mb-6 text-center">Kies een oefening</h2>
              {situations.length === 0 ? (
                  <div className="bg-white p-6 rounded-xl text-center text-gray-500 shadow-sm">
                      Nog geen oefeningen gemaakt in de Editor!
                  </div>
              ) : (
                  <div className="grid gap-3">
                      {situations.map(s => (
                          <button 
                            key={s.id}
                            onClick={() => selectSituation(s)}
                            className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500 text-left hover:shadow-md transition-shadow"
                          >
                              <div className="flex items-center gap-2">
                                  <div className="font-bold text-lg text-gray-800 flex-1">{s.question}</div>
                                  {s.questionAudio && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">🎤 Audio</span>
                                  )}
                              </div>
                              <div className="text-sm text-gray-500">{s.players.length} spelers</div>
                          </button>
                      ))}
                  </div>
              )}
          </div>
      );
  }

  return (
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
          <button 
            onClick={() => {
                window.speechSynthesis.cancel();
                setCurrentSituation(null);
            }}
            className="self-start flex items-center text-gray-600 hover:text-green-700 font-medium"
          >
              <ArrowLeft size={20} className="mr-1" /> Terug
          </button>

          <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-green-100">
              {/* Vraag met audio knop */}
              <div className="flex items-center justify-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-green-900 text-center">{currentSituation.question}</h2>
                  <button 
                    onClick={() => playQuestion(currentSituation)}
                    className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    title="Lees voor"
                  >
                      <Volume2 size={24} />
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
                              <UserPlayerToken x={userPos.x} y={userPos.y} />
                          )}
                          
                          {/* Feedback Overlay */}
                          {feedback === 'success' && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg z-50">
                                  <div className="bg-white p-6 rounded-full shadow-2xl transform scale-110">
                                      <CheckCircle size={80} className="text-green-500" />
                                  </div>
                              </div>
                          )}
                          
                           {feedback === 'fail' && (
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
                                  <div className="bg-amber-100 text-amber-900 px-6 py-4 rounded-2xl font-bold shadow-lg flex flex-col items-center gap-2 animate-bounce">
                                      <img src="/pindakaas.png" alt="Boterham met pindakaas" className="w-24 h-20 object-contain" />
                                      Helaas pindakaas!
                                  </div>
                              </div>
                          )}
                      </SoccerField>
                  </DndContext>
              </div>
              
              <p className="text-center text-gray-500 mt-3 text-sm">
                  Sleep het oranje bolletje (JIJ) naar de juiste plek!
              </p>
          </div>
      </div>
  );
};
