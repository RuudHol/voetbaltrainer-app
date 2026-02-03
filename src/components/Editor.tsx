import React, { useState, useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { Player, PlayerColor, TargetArea, Ball, Situation, DraggableType, ExerciseType, Route } from '../types';
import { SoccerField } from './SoccerField';
import { DraggablePlayer } from './DraggablePlayer';
import { DraggableTarget } from './DraggableTarget';
import { DraggableBall } from './DraggableBall';
import { saveSituation, getSituations, deleteSituation, getTrainerCode, setTrainerCode } from '../utils/storage';
import { Plus, Trash2, Save, Edit2, X, Key, Route as RouteIcon, Target, Undo2 } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';

export const Editor: React.FC = () => {
  const [situations, setSituations] = useState<(Situation & { ownerCode?: string })[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [ball, setBall] = useState<Ball | null>(null);
  const [targetAreas, setTargetAreas] = useState<TargetArea[]>([{ id: '1', x: 50, y: 50, width: 15, height: 15, shape: 'rectangle' }]);
  const [question, setQuestion] = useState('');
  const [questionAudio, setQuestionAudio] = useState<string | undefined>(undefined);
  const [draggableType, setDraggableType] = useState<DraggableType>('team1');
  const [answerCount, setAnswerCount] = useState(1);
  const [trainerCode, setTrainerCodeState] = useState('');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('position');
  const [route, setRoute] = useState<Route | null>(null);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  // Laad situaties en trainer code bij start
  useEffect(() => {
    const loadData = async () => {
      const data = await getSituations();
      setSituations(data);
      setTrainerCodeState(getTrainerCode());
    };
    loadData();
  }, []);

  // Update trainer code in localStorage wanneer deze verandert
  const handleTrainerCodeChange = (code: string) => {
    setTrainerCodeState(code);
    setTrainerCode(code);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5,
        }
    }),
    useSensor(TouchSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    
    if (!fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const deltaXPercent = (delta.x / rect.width) * 100;
    const deltaYPercent = (delta.y / rect.height) * 100;

    const activeId = active.id.toString();
    
    // Check of het een target is (format: target-{id})
    if (activeId.startsWith('target-')) {
        const targetId = activeId.replace('target-', '');
        setTargetAreas(prev => prev.map(t => {
            if (t.id === targetId) {
                return {
                    ...t,
                    x: Math.max(0, Math.min(100, t.x + deltaXPercent)),
                    y: Math.max(0, Math.min(100, t.y + deltaYPercent)),
                };
            }
            return t;
        }));
    } else if (activeId === 'ball') {
        setBall(prev => prev ? {
            x: Math.max(0, Math.min(100, prev.x + deltaXPercent)),
            y: Math.max(0, Math.min(100, prev.y + deltaYPercent)),
        } : null);
    } else {
        setPlayers((currentPlayers) => 
          currentPlayers.map((p) => {
            if (p.id === active.id) {
              return {
                ...p,
                x: Math.max(0, Math.min(100, p.x + deltaXPercent)),
                y: Math.max(0, Math.min(100, p.y + deltaYPercent)),
              };
            }
            return p;
          })
        );
    }
  };

  const addPlayer = (color: PlayerColor) => {
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      x: 50,
      y: 50,
      color,
      number: players.filter(p => p.color === color).length + 1,
    };
    setPlayers([...players, newPlayer]);
  };

  const addBall = () => {
    if (!ball) {
      setBall({ x: 50, y: 50 });
    }
  };

  const deletePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const deleteBall = () => {
    setBall(null);
  };

  const clearAll = () => {
    setPlayers([]);
    setBall(null);
    setQuestion('');
    setQuestionAudio(undefined);
    setTargetAreas([{ id: '1', x: 50, y: 50, width: 15, height: 15, shape: 'rectangle' }]);
    setDraggableType('team1');
    setAnswerCount(1);
    setEditingId(null);
    setExerciseType('position');
    setRoute(null);
    setIsDrawingRoute(false);
  };

  // Route tekenen handlers
  const startDrawingRoute = () => {
    setIsDrawingRoute(true);
    setRoute({ id: Date.now().toString(), points: [], color: '#ff6b35' });
  };

  const handleFieldClickForRoute = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingRoute || !fieldRef.current) return;
    
    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Voeg punt toe aan route
    setRoute(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        points: [...prev.points, { x, y }]
      };
    });
  };

  const undoLastRoutePoint = () => {
    setRoute(prev => {
      if (!prev || prev.points.length === 0) return prev;
      return {
        ...prev,
        points: prev.points.slice(0, -1)
      };
    });
  };

  const finishDrawingRoute = () => {
    setIsDrawingRoute(false);
  };

  const clearRoute = () => {
    setRoute(null);
    setIsDrawingRoute(false);
  };

  // Voeg een nieuw doelvak toe
  const addTargetArea = (shape: 'rectangle' | 'circle' = 'rectangle') => {
    const newId = Date.now().toString();
    const size = shape === 'circle' ? 12 : 15;
    setTargetAreas(prev => [...prev, { 
        id: newId, 
        x: 30 + Math.random() * 40, 
        y: 30 + Math.random() * 40, 
        width: size,
        height: size,
        shape
    }]);
  };

  // Verwijder een doelvak
  const removeTargetArea = (id: string) => {
    if (targetAreas.length <= 1) return;
    setTargetAreas(prev => prev.filter(t => t.id !== id));
  };

  // Resize een doelvak
  const handleTargetResize = (id: string, width: number, height: number) => {
    setTargetAreas(prev => prev.map(t => 
        t.id === id ? { ...t, width, height } : t
    ));
  };

  const handleSave = async () => {
      if (!question.trim()) {
          alert('Vul eerst een vraag in!');
          return;
      }
      if (exerciseType === 'route' && (!route || route.points.length < 2)) {
          alert('Teken eerst een route met minimaal 2 punten!');
          return;
      }
      const situation: Situation = {
          id: editingId || Date.now().toString(),
          question,
          questionAudio,
          players,
          ball: ball || undefined,
          targetArea: targetAreas[0], // Backwards compatibility
          targetAreas: targetAreas,
          draggableType,
          answerCount,
          exerciseType,
          route: exerciseType === 'route' ? route || undefined : undefined,
      };
      await saveSituation(situation);
      const data = await getSituations();
      setSituations(data);
      clearAll();
      alert(editingId ? 'Situatie bijgewerkt!' : 'Situatie opgeslagen!');
  };

  const handleEdit = (s: Situation) => {
      setEditingId(s.id);
      setQuestion(s.question);
      setQuestionAudio(s.questionAudio);
      setPlayers(s.players);
      setBall(s.ball || null);
      // Gebruik targetAreas als die bestaat, anders converteer oude targetArea
      let areas: TargetArea[];
      if (s.targetAreas && s.targetAreas.length > 0) {
          // Converteer oude radius-based naar width/height als nodig
          areas = s.targetAreas.map(t => ({
              ...t,
              width: t.width ?? (t.radius || 8) * 1.5,
              height: t.height ?? (t.radius || 8) * 1.5,
          }));
      } else {
          const oldTarget = s.targetArea;
          const size = (oldTarget.radius || 8) * 1.5;
          areas = [{ 
              id: oldTarget.id || '1', 
              x: oldTarget.x,
              y: oldTarget.y,
              width: size,
              height: size,
              shape: oldTarget.shape || 'rectangle'
          }];
      }
      setTargetAreas(areas);
      setDraggableType(s.draggableType || 'team1');
      setAnswerCount(s.answerCount || 1);
      setExerciseType(s.exerciseType || 'position');
      setRoute(s.route || null);
      setIsDrawingRoute(false);
  };

  const handleDelete = async (id: string) => {
      const situation = situations.find(s => s.id === id);
      if (!situation) return;
      
      // Check of deze oefening een owner heeft en of je code klopt
      if (situation.ownerCode && situation.ownerCode !== trainerCode) {
          alert('Je kunt deze oefening niet verwijderen - je hebt niet de juiste trainer code.');
          return;
      }
      
      if (confirm('Weet je zeker dat je deze oefening wilt verwijderen?')) {
          const success = await deleteSituation(id, situation.ownerCode);
          if (success) {
              const data = await getSituations();
              setSituations(data);
              if (editingId === id) {
                  clearAll();
              }
          } else {
              alert('Verwijderen mislukt - geen toestemming.');
          }
      }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Trainer code sectie */}
      <div className="glass rounded-2xl p-4 shadow-playful flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
          <Key size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-bold text-amber-800 mb-1">Trainer code (geheim!) 🔐</label>
          <input 
            type="password"
            value={trainerCode}
            onChange={(e) => handleTrainerCodeChange(e.target.value)}
            placeholder="Vul je geheime code in..."
            className="w-full p-3 border-2 border-amber-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white/50"
          />
        </div>
        <div className="text-xs text-amber-700 bg-amber-100 px-3 py-2 rounded-lg max-w-48">
          💡 Met deze code kun je jouw oefeningen verwijderen
        </div>
      </div>

      {/* Editor sectie */}
      <div className="glass rounded-2xl p-5 shadow-playful">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gradient flex items-center gap-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            {editingId ? '✏️ Oefening bewerken' : '✨ Nieuwe oefening'}
          </h2>
          {editingId && (
            <button 
              onClick={clearAll}
              className="btn-bounce text-gray-500 hover:text-red-500 text-sm flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <X size={16} /> Annuleren
            </button>
          )}
        </div>
        
        {/* Vraag input */}
        <div className="mb-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">📝 Vraag voor de speler:</label>
            <input 
                type="text" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Bijv: Waar moet je staan als de keeper de bal heeft?"
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent text-lg"
            />
        </div>
        
        {/* Audio recorder */}
        <div className="mb-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">🎤 Spreek de vraag in (optioneel - beter voor kinderen!):</label>
            <AudioRecorder 
                audioData={questionAudio}
                onAudioChange={setQuestionAudio}
            />
        </div>

        {/* Draggable type selector */}
        <div className="mb-5 p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-bold text-gray-700 mb-3">🎯 Wat moet de speler verslepen?</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDraggableType('keeper1')}
                className={`btn-bounce px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${draggableType === 'keeper1' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105' : 'bg-white text-green-700 hover:bg-green-50 border-2 border-green-200'}`}
              >
                🟢 Keeper 1
              </button>
              <button
                type="button"
                onClick={() => setDraggableType('team1')}
                className={`btn-bounce px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${draggableType === 'team1' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg scale-105' : 'bg-white text-red-700 hover:bg-red-50 border-2 border-red-200'}`}
              >
                🔴 Team 1
              </button>
              <button
                type="button"
                onClick={() => setDraggableType('team2')}
                className={`btn-bounce px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${draggableType === 'team2' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' : 'bg-white text-blue-700 hover:bg-blue-50 border-2 border-blue-200'}`}
              >
                🔵 Team 2
              </button>
              <button
                type="button"
                onClick={() => setDraggableType('keeper2')}
                className={`btn-bounce px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${draggableType === 'keeper2' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-lg scale-105' : 'bg-white text-yellow-700 hover:bg-yellow-50 border-2 border-yellow-200'}`}
              >
                🟡 Keeper 2
              </button>
              <button
                type="button"
                onClick={() => setDraggableType('ball')}
                className={`btn-bounce px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${draggableType === 'ball' ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg scale-105' : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'}`}
              >
                ⚽ Bal
              </button>
            </div>
        </div>

        {/* Type oefening selector */}
        <div className="mb-5 p-4 bg-indigo-50 rounded-xl">
            <label className="block text-sm font-bold text-gray-700 mb-3">📋 Type oefening:</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setExerciseType('position')}
                className={`btn-bounce px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${exerciseType === 'position' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg scale-105' : 'bg-white text-indigo-700 hover:bg-indigo-50 border-2 border-indigo-200'}`}
              >
                <Target size={16} /> Positie (sleep naar doelvak)
              </button>
              <button
                type="button"
                onClick={() => setExerciseType('route')}
                className={`btn-bounce px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${exerciseType === 'route' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105' : 'bg-white text-orange-700 hover:bg-orange-50 border-2 border-orange-200'}`}
              >
                <RouteIcon size={16} /> Route (volg de lijn)
              </button>
            </div>
        </div>

        {/* Positie-specifieke opties */}
        {exerciseType === 'position' && (
          <>
            {/* Aantal antwoorden */}
            <div className="mb-5 p-4 bg-purple-50 rounded-xl">
                <label className="block text-sm font-bold text-gray-700 mb-3">🔢 Hoeveel symbolen moet de speler plaatsen?</label>
                <div className="flex items-center gap-3 max-w-xs mx-auto">
                    <button
                        type="button"
                        onClick={() => setAnswerCount(Math.max(1, answerCount - 1))}
                        className="btn-bounce w-10 h-10 bg-white rounded-xl text-purple-700 font-bold text-xl border-2 border-purple-200 hover:bg-purple-100"
                    >
                        −
                    </button>
                    <div className="flex-1 text-center">
                        <span className="text-3xl font-bold text-purple-700">{answerCount}</span>
                        <p className="text-xs text-purple-600 mt-1">{answerCount === 1 ? 'symbool' : 'symbolen'}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAnswerCount(Math.min(5, answerCount + 1))}
                        className="btn-bounce w-10 h-10 bg-white rounded-xl text-purple-700 font-bold text-xl border-2 border-purple-200 hover:bg-purple-100"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Doelvakken instellingen */}
        <div className="mb-5 p-4 bg-amber-50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-gray-700">🎯 Doelvakken ({targetAreas.length})</label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => addTargetArea('rectangle')}
                        className="btn-bounce px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 flex items-center gap-1"
                    >
                        <Plus size={14} /> ▭ Rechthoek
                    </button>
                    <button
                        type="button"
                        onClick={() => addTargetArea('circle')}
                        className="btn-bounce px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 flex items-center gap-1"
                    >
                        <Plus size={14} /> ⭕ Cirkel
                    </button>
                </div>
            </div>
            
            <p className="text-xs text-amber-700 mb-3">
                💡 <strong>Tip:</strong> Sleep de <span className="text-amber-900 font-bold">gele hoekjes</span> om het doelvak groter/kleiner te maken. 
                Bij rechthoeken kun je ook de zijkanten slepen voor breedte of hoogte apart.
            </p>

            {/* Overzicht doelvakken */}
            {targetAreas.length > 1 && (
                <div className="flex flex-wrap gap-2">
                    {targetAreas.map((t, i) => (
                        <div key={t.id} className="flex items-center gap-1">
                            <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-white text-amber-700 border-2 border-amber-200">
                                {i + 1} {t.shape === 'circle' ? '⭕' : '▭'}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeTargetArea(t.id)}
                                className="w-6 h-6 bg-red-100 text-red-600 rounded-full text-xs font-bold hover:bg-red-200"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
          </>
        )}

        {/* Route-specifieke opties */}
        {exerciseType === 'route' && (
          <div className="mb-5 p-4 bg-orange-50 rounded-xl">
            <label className="block text-sm font-bold text-gray-700 mb-3">🛤️ Teken de route op het veld:</label>
            
            {!isDrawingRoute && !route && (
              <button
                type="button"
                onClick={startDrawingRoute}
                className="btn-bounce px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 flex items-center gap-2"
              >
                <RouteIcon size={16} /> Start route tekenen
              </button>
            )}
            
            {isDrawingRoute && (
              <div className="space-y-3">
                <p className="text-sm text-orange-700">
                  👆 Klik op het veld om punten toe te voegen. De route wordt automatisch getekend tussen de punten.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={undoLastRoutePoint}
                    disabled={!route || route.points.length === 0}
                    className="btn-bounce px-3 py-1.5 bg-white text-orange-700 rounded-lg text-sm font-bold hover:bg-orange-100 border-2 border-orange-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Undo2 size={14} /> Ongedaan maken
                  </button>
                  <button
                    type="button"
                    onClick={finishDrawingRoute}
                    disabled={!route || route.points.length < 2}
                    className="btn-bounce px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✓ Route voltooien
                  </button>
                  <button
                    type="button"
                    onClick={clearRoute}
                    className="btn-bounce px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Wis route
                  </button>
                </div>
                {route && (
                  <p className="text-xs text-orange-600">
                    📍 {route.points.length} punt{route.points.length !== 1 ? 'en' : ''} geplaatst
                  </p>
                )}
              </div>
            )}
            
            {!isDrawingRoute && route && route.points.length >= 2 && (
              <div className="space-y-3">
                <p className="text-sm text-green-700">
                  ✓ Route getekend met {route.points.length} punten
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={startDrawingRoute}
                    className="btn-bounce px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 flex items-center gap-1"
                  >
                    <RouteIcon size={14} /> Opnieuw tekenen
                  </button>
                  <button
                    type="button"
                    onClick={clearRoute}
                    className="btn-bounce px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Wis route
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Spelers toevoegen toolbar */}
        <div className="mb-5 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <label className="block text-sm font-bold text-gray-700 mb-3">👥 Voeg spelers toe op het veld:</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => addPlayer('keeper1')} className="btn-bounce flex items-center gap-2 px-4 py-2.5 bg-white text-green-700 rounded-xl hover:bg-green-100 transition-colors text-sm font-bold border-2 border-green-200">
                <Plus size={16} /> Keeper 1
              </button>
              <button onClick={() => addPlayer('team1')} className="btn-bounce flex items-center gap-2 px-4 py-2.5 bg-white text-red-700 rounded-xl hover:bg-red-100 transition-colors text-sm font-bold border-2 border-red-200">
                <Plus size={16} /> Team 1
              </button>
              
              <div className="w-px bg-gray-300 mx-1 hidden sm:block" />
              
              <button onClick={() => addPlayer('team2')} className="btn-bounce flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-sm font-bold border-2 border-blue-200">
                <Plus size={16} /> Team 2
              </button>
              <button onClick={() => addPlayer('keeper2')} className="btn-bounce flex items-center gap-2 px-4 py-2.5 bg-white text-yellow-700 rounded-xl hover:bg-yellow-100 transition-colors text-sm font-bold border-2 border-yellow-200">
                <Plus size={16} /> Keeper 2
              </button>

              <div className="w-px bg-gray-300 mx-1 hidden sm:block" />
              
              <button 
                onClick={addBall} 
                disabled={ball !== null}
                className={`btn-bounce flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors text-sm font-bold ${ball ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'}`}
              >
                <Plus size={16} /> Bal
              </button>
            </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex-1" />
          <button onClick={clearAll} className="btn-bounce flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-bold">
            <Trash2 size={18} /> Wis alles
          </button>
          <button onClick={handleSave} className="btn-bounce flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-colors shadow-lg font-bold">
            <Save size={18} /> {editingId ? 'Bijwerken' : 'Opslaan'}
          </button>
        </div>

        {/* Voetbalveld */}
        <div 
          ref={fieldRef} 
          className={`relative touch-none ${isDrawingRoute ? 'cursor-crosshair' : ''}`}
          onClick={isDrawingRoute ? handleFieldClickForRoute : undefined}
        > 
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SoccerField>
                {players.map((p) => (
                    <DraggablePlayer key={p.id} player={p} onDelete={() => deletePlayer(p.id)} />
                ))}
                {ball && <DraggableBall ball={ball} onDelete={deleteBall} />}
                
                {/* Doelvakken alleen bij position type */}
                {exerciseType === 'position' && targetAreas.map((t, i) => (
                    <DraggableTarget 
                        key={t.id} 
                        target={t} 
                        index={i}
                        onDelete={targetAreas.length > 1 ? () => removeTargetArea(t.id) : undefined}
                        onResize={handleTargetResize}
                        fieldRef={fieldRef as React.RefObject<HTMLDivElement>}
                    />
                ))}
                
                {/* Route visualisatie */}
                {route && route.points.length > 0 && (
                  <svg 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none" 
                    style={{ zIndex: 50 }}
                  >
                    {/* Route lijn */}
                    {route.points.length > 1 && (
                      <polyline
                        points={route.points.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke={route.color || '#ff6b35'}
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={isDrawingRoute ? "2,1" : "none"}
                        style={{ filter: 'drop-shadow(0 0.5px 1px rgba(0,0,0,0.3))' }}
                      />
                    )}
                    {/* Route punten */}
                    {route.points.map((point, i) => (
                      <g key={i}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="2"
                          fill={i === 0 ? '#22c55e' : i === route.points.length - 1 ? '#ef4444' : route.color || '#ff6b35'}
                          stroke="white"
                          strokeWidth="0.5"
                        />
                        <text
                          x={point.x}
                          y={point.y}
                          dy="0.7"
                          textAnchor="middle"
                          fill="white"
                          fontSize="2"
                          fontWeight="bold"
                        >
                          {i + 1}
                        </text>
                      </g>
                    ))}
                    {/* Pijl aan het einde */}
                    {route.points.length > 1 && !isDrawingRoute && (
                      <polygon
                        points={(() => {
                          const last = route.points[route.points.length - 1];
                          const prev = route.points[route.points.length - 2];
                          const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
                          const arrowSize = 2;
                          const tipX = last.x + Math.cos(angle) * 1.5;
                          const tipY = last.y + Math.sin(angle) * 1.5;
                          return `${tipX},${tipY} ${tipX - arrowSize * Math.cos(angle - 0.5)},${tipY - arrowSize * Math.sin(angle - 0.5)} ${tipX - arrowSize * Math.cos(angle + 0.5)},${tipY - arrowSize * Math.sin(angle + 0.5)}`;
                        })()}
                        fill={route.color || '#ff6b35'}
                      />
                    )}
                  </svg>
                )}
            </SoccerField>
            </DndContext>
        </div>
        
        <p className="text-center text-gray-500 mt-4 font-medium">
            {isDrawingRoute ? (
              <>👆 Klik op het veld om punten aan de route toe te voegen</>
            ) : exerciseType === 'route' ? (
              <>🛤️ De <span className="text-orange-600 font-bold">oranje route</span> toont het pad dat de speler moet volgen</>
            ) : (
              <>👆 Sleep de spelers, bal en de <span className="text-amber-600 font-bold">gele doelvakken</span> naar de juiste posities</>
            )}
        </p>
      </div>

      {/* Overzicht van oefeningen */}
      <div className="glass rounded-2xl p-5 shadow-playful">
        <h2 className="text-2xl font-bold text-gradient mb-5 flex items-center gap-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            📚 Opgeslagen oefeningen
        </h2>
        
        {situations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">📝</div>
            <p className="text-gray-500 font-medium">Nog geen oefeningen opgeslagen.</p>
            <p className="text-sm text-gray-400 mt-1">Maak hierboven je eerste oefening!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {situations.map((s, index) => {
              const canDelete = !s.ownerCode || s.ownerCode === trainerCode;
              return (
                <div 
                  key={s.id} 
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${editingId === s.id ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 truncate">{s.question}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                      <span>{s.players.length} spelers</span>
                      {s.ball && <span>+ bal</span>}
                      {s.ownerCode && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${canDelete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {canDelete ? '✓ Jouw oefening' : '🔒 Van iemand anders'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button 
                      onClick={() => handleEdit(s)}
                      className="btn-bounce p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                      title="Bewerken"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id)}
                      className={`btn-bounce p-2.5 rounded-xl transition-colors ${canDelete ? 'text-red-600 hover:bg-red-100' : 'text-gray-300 cursor-not-allowed'}`}
                      title={canDelete ? 'Verwijderen' : 'Niet jouw oefening'}
                      disabled={!canDelete}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
