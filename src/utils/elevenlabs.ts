// ElevenLabs Text-to-Speech API
// Documentatie: https://elevenlabs.io/docs/api-reference

import { supabase } from './supabase';
import { getTrainerCode } from './storage';

// Lokale cache voor snelle toegang (wordt gesynchroniseerd met Supabase)
let cachedApiKey = '';
let cachedVoiceId = '';

// Laad instellingen uit Supabase (op basis van trainer code)
export const loadSettingsFromSupabase = async (): Promise<void> => {
  const trainerCode = getTrainerCode();
  if (!trainerCode) return;

  try {
    const { data, error } = await supabase
      .from('trainer_settings')
      .select('elevenlabs_api_key, elevenlabs_voice_id')
      .eq('trainer_code', trainerCode)
      .single();

    if (!error && data) {
      cachedApiKey = data.elevenlabs_api_key || '';
      cachedVoiceId = data.elevenlabs_voice_id || '';
    }
  } catch {
    // Tabel bestaat mogelijk nog niet, negeer fout
  }
};

// Sla instellingen op in Supabase
export const saveSettingsToSupabase = async (): Promise<void> => {
  const trainerCode = getTrainerCode();
  if (!trainerCode) return;

  try {
    await supabase
      .from('trainer_settings')
      .upsert({
        trainer_code: trainerCode,
        elevenlabs_api_key: cachedApiKey,
        elevenlabs_voice_id: cachedVoiceId,
      });
  } catch {
    // Tabel bestaat mogelijk nog niet, negeer fout
  }
};

export const getElevenLabsApiKey = (): string => {
  return cachedApiKey;
};

export const setElevenLabsApiKey = async (key: string): Promise<void> => {
  cachedApiKey = key;
  await saveSettingsToSupabase();
};

export const getSelectedVoiceId = (): string => {
  return cachedVoiceId;
};

export const setSelectedVoiceId = async (id: string): Promise<void> => {
  cachedVoiceId = id;
  await saveSettingsToSupabase();
};

// Haal beschikbare stemmen op van ElevenLabs
export interface Voice {
  voice_id: string;
  name: string;
}

export const getAvailableVoices = async (): Promise<Voice[]> => {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    console.log('ElevenLabs: Geen API key');
    return [];
  }

  try {
    console.log('ElevenLabs: Stemmen ophalen...');
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ElevenLabs voices error:', response.status, JSON.stringify(errorData));
      console.error('Foutmelding:', errorData?.detail?.message || errorData?.detail || 'Onbekende fout');
      return [];
    }

    const data = await response.json();
    console.log('ElevenLabs: Gevonden stemmen:', data.voices?.length || 0);
    return data.voices || [];
  } catch (err) {
    console.error('ElevenLabs voices fout:', err);
    return [];
  }
};

interface ElevenLabsResponse {
  audio?: ArrayBuffer;
  error?: string;
}

export const speakWithElevenLabs = async (text: string): Promise<ElevenLabsResponse> => {
  const apiKey = getElevenLabsApiKey();
  
  if (!apiKey) {
    return { error: 'Geen API key ingesteld' };
  }

  // Haal voice ID op, of gebruik eerste beschikbare stem
  let voiceId = getSelectedVoiceId();
  
  if (!voiceId) {
    // Geen stem geselecteerd, haal beschikbare stemmen op
    const voices = await getAvailableVoices();
    if (voices.length > 0) {
      voiceId = voices[0].voice_id;
      setSelectedVoiceId(voiceId);
    } else {
      return { error: 'Geen stemmen beschikbaar' };
    }
  }
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2', // Ondersteunt Nederlands
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ElevenLabs:', errorData.detail?.message || `API fout: ${response.status}`);
      return { error: errorData.detail?.message || `API fout: ${response.status}` };
    }

    const audioBuffer = await response.arrayBuffer();
    return { audio: audioBuffer };
    
  } catch (err) {
    console.error('ElevenLabs fout:', err);
    return { error: 'Kon geen verbinding maken met ElevenLabs' };
  }
};

// Helper functie om audio af te spelen
export const playElevenLabsAudio = async (text: string): Promise<boolean> => {
  const result = await speakWithElevenLabs(text);
  
  if (result.error) {
    console.error('ElevenLabs:', result.error);
    return false;
  }
  
  if (result.audio) {
    const blob = new Blob([result.audio], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    return new Promise((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve(true);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      audio.play().catch(() => resolve(false));
    });
  }
  
  return false;
};

// Check of ElevenLabs beschikbaar is (API key ingesteld)
export const isElevenLabsAvailable = (): boolean => {
  return !!getElevenLabsApiKey();
};
