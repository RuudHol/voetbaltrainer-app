import React, { useState, useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { Player, PlayerColor, TargetArea, Ball, Situation, DraggableType, TargetShape } from '../types';
import { SoccerField } from './SoccerField';
import { DraggablePlayer } from './DraggablePlayer';
import { DraggableTarget } from './DraggableTarget';
import { DraggableBall } from './DraggableBall';
import { saveSituation, getSituations, deleteSituation, getTrainerCode, setTrainerCode } from '../utils/storage';
import { Plus, Trash2, Save, Edit2, X, Key } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';

export const Editor: React.FC = () => {
  const [situations, setSituations] = useState<(Situation & { ownerCode?: string })[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [ball, setBall] = useState<Ball | null>(null);
  const [targetAreas, setTargetAreas] = useState<TargetArea[]>([{ id: '1', x: 50, y: 50, radius: 8, shape: 'circle' }]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('1'); // Welk doelvak wordt bewerkt
  const [question, setQuestion] = useState('');
  const [questionAudio, setQuestionAudio] = useState<string | undefined>(undefined);
  const [draggableType, setDraggableType] = useState<DraggableType>('team1');
  const [answerCount, setAnswerCount] = useState(1);
  const [trainerCode, setTrainerCodeState] = useState('');
  
  // Haal geselecteerde target op
  const selectedTarget = targetAreas.find(t => t.id === selectedTargetId) || targetAreas[0];
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
        setSelectedTargetId(targetId); // Selecteer deze target
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

  const clearAll = () => {
    setPlayers([]);
    setBall(null);
    setQuestion('');
    setQuestionAudio(undefined);
    setTargetAreas([{ id: '1', x: 50, y: 50, radius: 8, shape: 'circle' }]);
    setSelectedTargetId('1');
    setDraggableType('team1');
    setAnswerCount(1);
    setEditingId(null);
  };

  // Voeg een nieuw doelvak toe
  const addTargetArea = () => {
    const newId = Date.now().toString();
    setTargetAreas(prev => [...prev, { 
        id: newId, 
        x: 30 + Math.random() * 40, 
        y: 30 + Math.random() * 40, 
        radius: 8, 
        shape: 'circle' 
    }]);
    setSelectedTargetId(newId);
  };

  // Verwijder een doelvak
  const removeTargetArea = (id: string) => {
    if (targetAreas.length <= 1) return; // Minstens 1 doelvak
    setTargetAreas(prev => prev.filter(t => t.id !== id));
    if (selectedTargetId === id) {
        setSelectedTargetId(targetAreas[0].id);
    }
  };

  // Update geselecteerde target
  const updateSelectedTarget = (updates: Partial<TargetArea>) => {
    setTargetAreas(prev => prev.map(t => 
        t.id === selectedTargetId ? { ...t, ...updates } : t
    ));
  };

  const handleSave = async () => {
      if (!question.trim()) {
          alert('Vul eerst een vraag in!');
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
      // Gebruik targetAreas als die bestaat, anders maak array van targetArea
      const areas = s.targetAreas || [{ ...s.targetArea, id: s.targetArea.id || '1', shape: s.targetArea.shape || 'circle' }];
      setTargetAreas(areas);
      setSelectedTargetId(areas[0].id);
      setDraggableType(s.draggableType || 'team1');
      setAnswerCount(s.answerCount || 1);
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
                <button
                    type="button"
                    onClick={addTargetArea}
                    className="btn-bounce px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 flex items-center gap-1"
                >
                    <Plus size={14} /> Doelvak
                </button>
            </div>
            
            {/* Doelvak selector */}
            {targetAreas.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {targetAreas.map((t, i) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTargetId(t.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                selectedTargetId === t.id 
                                    ? 'bg-amber-500 text-white shadow-lg' 
                                    : 'bg-white text-amber-700 border-2 border-amber-200 hover:bg-amber-100'
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* Instellingen voor geselecteerd doelvak */}
            {selectedTarget && (
                <div className="space-y-4">
                    {/* Vorm */}
                    <div>
                        <label className="block text-xs font-bold text-amber-800 mb-2">Vorm</label>
                        <div className="flex gap-2">
                            {(['circle', 'square', 'rectangle'] as TargetShape[]).map(shape => (
                                <button
                                    key={shape}
                                    type="button"
                                    onClick={() => updateSelectedTarget({ shape })}
                                    className={`btn-bounce flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                                        selectedTarget.shape === shape || (!selectedTarget.shape && shape === 'circle')
                                            ? 'bg-amber-500 text-white shadow-lg' 
                                            : 'bg-white text-amber-700 border-2 border-amber-200 hover:bg-amber-100'
                                    }`}
                                >
                                    {shape === 'circle' && '⭕ Cirkel'}
                                    {shape === 'square' && '⬜ Vierkant'}
                                    {shape === 'rectangle' && '▭ Rechthoek'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grootte */}
                    <div>
                        <label className="block text-xs font-bold text-amber-800 mb-2">Grootte</label>
                        <input
                            type="range"
                            min="3"
                            max="30"
                            step="1"
                            value={selectedTarget.radius}
                            onChange={(e) => updateSelectedTarget({ radius: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <div className="flex justify-between text-xs text-amber-700 font-medium mt-1">
                            <span>Klein</span>
                            <span className="text-amber-900 font-bold">{selectedTarget.radius}</span>
                            <span>Groot</span>
                        </div>
                    </div>

                    {/* Verwijder knop */}
                    {targetAreas.length > 1 && (
                        <button
                            type="button"
                            onClick={() => removeTargetArea(selectedTarget.id)}
                            className="w-full py-2 bg-red-100 text-red-600 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors"
                        >
                            <Trash2 size={14} className="inline mr-1" /> Dit doelvak verwijderen
                        </button>
                    )}
                </div>
            )}
        </div>

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
        <div ref={fieldRef} className="relative touch-none"> 
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SoccerField>
                {players.map((p) => (
                    <DraggablePlayer key={p.id} player={p} />
                ))}
                {ball && <DraggableBall ball={ball} />}
                {targetAreas.map((t, i) => (
                    <DraggableTarget 
                        key={t.id} 
                        target={t} 
                        index={i}
                        onDelete={targetAreas.length > 1 ? () => removeTargetArea(t.id) : undefined}
                    />
                ))}
            </SoccerField>
            </DndContext>
        </div>
        
        <p className="text-center text-gray-500 mt-4 font-medium">
            👆 Sleep de spelers, bal en de <span className="text-amber-600 font-bold">gele doelvakken</span> naar de juiste posities
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
