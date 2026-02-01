import { Situation } from '../types';
import { supabase } from './supabase';

// Trainer code opslaan/ophalen uit localStorage
const TRAINER_CODE_KEY = 'voetbal-trainer-code';

export const getTrainerCode = (): string => {
  return localStorage.getItem(TRAINER_CODE_KEY) || '';
};

export const setTrainerCode = (code: string): void => {
  localStorage.setItem(TRAINER_CODE_KEY, code);
};

// Haal alle situaties op uit Supabase (inclusief owner_code en audio)
export const getSituations = async (): Promise<(Situation & { ownerCode?: string })[]> => {
  const { data, error } = await supabase
    .from('situations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fout bij ophalen:', error);
    return [];
  }

  // Converteer database formaat naar app formaat
  return (data || []).map(row => ({
    id: row.id,
    question: row.question,
    questionAudio: row.question_audio || undefined,
    players: row.players,
    ball: row.ball,
    targetArea: row.target_area,
    ownerCode: row.owner_code,
  }));
};

// Sla een situatie op in Supabase (met owner_code en audio)
export const saveSituation = async (situation: Situation): Promise<void> => {
  const trainerCode = getTrainerCode();
  
  const { error } = await supabase
    .from('situations')
    .upsert({
      id: situation.id,
      question: situation.question,
      question_audio: situation.questionAudio || null,
      players: situation.players,
      ball: situation.ball,
      target_area: situation.targetArea,
      owner_code: trainerCode || null,
    });

  if (error) {
    console.error('Fout bij opslaan:', error);
  }
};

// Verwijder een situatie uit Supabase (alleen als owner_code klopt)
export const deleteSituation = async (id: string, ownerCode?: string): Promise<boolean> => {
  const trainerCode = getTrainerCode();
  
  // Check of je mag verwijderen (je code moet kloppen, of oefening heeft geen owner)
  if (ownerCode && ownerCode !== trainerCode) {
    return false; // Niet toegestaan
  }
  
  const { error } = await supabase
    .from('situations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Fout bij verwijderen:', error);
    return false;
  }
  
  return true;
};
