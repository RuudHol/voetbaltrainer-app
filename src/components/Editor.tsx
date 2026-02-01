import React, { useState, useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { Player, PlayerColor, TargetArea, Ball, Situation } from '../types';
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
  const [targetArea, setTargetArea] = useState<TargetArea>({ x: 50, y: 50, radius: 10 });
  const [question, setQuestion] = useState('');
  const [questionAudio, setQuestionAudio] = useState<string | undefined>(undefined);
  const [trainerCode, setTrainerCodeState] = useState('');
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

    if (active.id === 'target-area') {
        setTargetArea(prev => ({
            ...prev,
            x: Math.max(0, Math.min(100, prev.x + deltaXPercent)),
            y: Math.max(0, Math.min(100, prev.y + deltaYPercent)),
        }));
    } else if (active.id === 'ball') {
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
    setTargetArea({ x: 50, y: 50, radius: 10 });
    setEditingId(null);
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
          targetArea,
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
      setTargetArea(s.targetArea);
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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Trainer code sectie */}
      <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 flex items-center gap-3">
        <Key size={20} className="text-yellow-600" />
        <div className="flex-1">
          <label className="block text-sm font-medium text-yellow-800">Trainer code (geheim!)</label>
          <input 
            type="password"
            value={trainerCode}
            onChange={(e) => handleTrainerCodeChange(e.target.value)}
            placeholder="Vul je geheime code in..."
            className="w-full mt-1 p-2 border border-yellow-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
        <div className="text-xs text-yellow-600 max-w-32">
          Met deze code kun je jouw oefeningen verwijderen
        </div>
      </div>

      {/* Editor sectie */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-green-800">
            {editingId ? 'Oefening bewerken' : 'Nieuwe oefening'}
          </h2>
          {editingId && (
            <button 
              onClick={clearAll}
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
            >
              <X size={16} /> Annuleren
            </button>
          )}
        </div>
        
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vraag voor de speler:</label>
            <input 
                type="text" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Bijv: Waar moet je staan als de keeper de bal heeft?"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
        </div>
        
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Spreek de vraag in (optioneel - beter voor kinderen!):</label>
            <AudioRecorder 
                audioData={questionAudio}
                onAudioChange={setQuestionAudio}
            />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {/* Team 1 */}
          <button onClick={() => addPlayer('keeper1')} className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm">
            <Plus size={16} /> Keeper 1
          </button>
          <button onClick={() => addPlayer('team1')} className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm">
            <Plus size={16} /> Team 1
          </button>
          
          <div className="w-px bg-gray-300 mx-1" />
          
          {/* Team 2 */}
          <button onClick={() => addPlayer('team2')} className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm">
            <Plus size={16} /> Team 2
          </button>
          <button onClick={() => addPlayer('keeper2')} className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm">
            <Plus size={16} /> Keeper 2
          </button>

          <div className="w-px bg-gray-300 mx-1" />
          
          {/* Bal */}
          <button 
            onClick={addBall} 
            disabled={ball !== null}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${ball ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          >
            <Plus size={16} /> Bal
          </button>
          
          <div className="flex-1" />
          
          <button onClick={clearAll} className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm">
            <Trash2 size={16} /> Wis
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-bold text-sm">
            <Save size={16} /> {editingId ? 'Bijwerken' : 'Opslaan'}
          </button>
        </div>

        <div ref={fieldRef} className="relative touch-none"> 
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SoccerField>
                {players.map((p) => (
                    <DraggablePlayer key={p.id} player={p} />
                ))}
                {ball && <DraggableBall ball={ball} />}
                <DraggableTarget target={targetArea} />
            </SoccerField>
            </DndContext>
        </div>
        
        <p className="text-sm text-gray-500 mt-2 text-center">
            Sleep de spelers, bal en het <span className="text-yellow-600 font-bold">gele doelvak</span> naar de juiste posities.
        </p>
      </div>

      {/* Overzicht van oefeningen */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
        <h2 className="text-xl font-bold text-green-800 mb-4">Opgeslagen oefeningen</h2>
        
        {situations.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nog geen oefeningen opgeslagen.</p>
        ) : (
          <div className="space-y-2">
            {situations.map((s) => {
              const canDelete = !s.ownerCode || s.ownerCode === trainerCode;
              return (
                <div 
                  key={s.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${editingId === s.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{s.question}</div>
                    <div className="text-sm text-gray-500">
                      {s.players.length} spelers {s.ball ? '+ bal' : ''}
                      {s.ownerCode && (
                        <span className={`ml-2 ${canDelete ? 'text-green-600' : 'text-yellow-600'}`}>
                          {canDelete ? '• jouw oefening' : '• van iemand anders'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(s)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Bewerken"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id)}
                      className={`p-2 rounded-lg transition-colors ${canDelete ? 'text-red-600 hover:bg-red-100' : 'text-gray-300 cursor-not-allowed'}`}
                      title={canDelete ? 'Verwijderen' : 'Niet jouw oefening'}
                      disabled={!canDelete}
                    >
                      <Trash2 size={18} />
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
