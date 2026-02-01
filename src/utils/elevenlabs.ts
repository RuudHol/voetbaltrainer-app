// ElevenLabs Text-to-Speech API
// Documentatie: https://elevenlabs.io/docs/api-reference

// API key wordt ALLEEN lokaal opgeslagen (veiliger - anderen kunnen het niet zien)
const ELEVENLABS_KEY_STORAGE = 'elevenlabs-api-key';
const ELEVENLABS_VOICE_STORAGE = 'elevenlabs-voice-id';

// Laad instellingen uit localStorage (blijft lokaal op dit device)
export const loadSettingsFromSupabase = async (): Promise<void> => {
  // Backwards compatible functienaam, maar laadt nu uit localStorage
  // Niks te doen - getters lezen direct uit localStorage
};

// Niet meer nodig - alles is lokaal
export const saveSettingsToSupabase = async (): Promise<void> => {
  // Backwards compatible functienaam, maar slaat nu lokaal op
  // Niks te doen - setters schrijven direct naar localStorage
};

export const getElevenLabsApiKey = (): string => {
  return localStorage.getItem(ELEVENLABS_KEY_STORAGE) || '';
};

export const setElevenLabsApiKey = async (key: string): Promise<void> => {
  if (key) {
    localStorage.setItem(ELEVENLABS_KEY_STORAGE, key);
  } else {
    localStorage.removeItem(ELEVENLABS_KEY_STORAGE);
  }
};

export const getSelectedVoiceId = (): string => {
  return localStorage.getItem(ELEVENLABS_VOICE_STORAGE) || '';
};

export const setSelectedVoiceId = async (id: string): Promise<void> => {
  if (id) {
    localStorage.setItem(ELEVENLABS_VOICE_STORAGE, id);
  } else {
    localStorage.removeItem(ELEVENLABS_VOICE_STORAGE);
  }
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
