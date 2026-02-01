import React, { useState, useEffect } from 'react';
import { 
  getElevenLabsApiKey, 
  setElevenLabsApiKey, 
  playElevenLabsAudio, 
  isElevenLabsAvailable,
  getAvailableVoices,
  getSelectedVoiceId,
  setSelectedVoiceId,
  loadSettingsFromSupabase,
  Voice
} from '../utils/elevenlabs';
import { getTrainerCode } from '../utils/storage';
import { Key, Volume2, Check, X, RefreshCw, Cloud } from 'lucide-react';

export const Settings: React.FC = () => {
  const [apiKey, setApiKeyState] = useState('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error' | 'loading'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [trainerCode, setTrainerCodeState] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      // Laad trainer code
      const code = getTrainerCode();
      setTrainerCodeState(code);
      
      // Laad instellingen uit Supabase
      await loadSettingsFromSupabase();
      
      // Update lokale state
      setApiKeyState(getElevenLabsApiKey());
      setSelectedVoice(getSelectedVoiceId());
    };
    loadSettings();
  }, []);

  const loadVoices = async () => {
    setStatus('loading');
    const availableVoices = await getAvailableVoices();
    setVoices(availableVoices);
    
    if (availableVoices.length > 0) {
      // Als er nog geen stem geselecteerd is, selecteer de eerste
      if (!selectedVoice) {
        setSelectedVoice(availableVoices[0].voice_id);
        await setSelectedVoiceId(availableVoices[0].voice_id);
      }
      setStatus('idle');
    } else {
      setStatus('error');
      setErrorMessage('Geen stemmen gevonden. Check je API key permissies.');
    }
  };

  const handleSave = async () => {
    if (!trainerCode) {
      setStatus('error');
      setErrorMessage('Vul eerst een trainer code in bij de Trainer pagina!');
      return;
    }
    
    await setElevenLabsApiKey(apiKey);
    setStatus('idle');
    
    // Na opslaan, laad beschikbare stemmen
    if (apiKey) {
      await loadVoices();
    }
  };

  const handleVoiceChange = async (voiceId: string) => {
    setSelectedVoice(voiceId);
    await setSelectedVoiceId(voiceId);
  };

  const handleTest = async () => {
    if (!apiKey) {
      setStatus('error');
      setErrorMessage('Vul eerst een API key in');
      return;
    }
    
    setStatus('testing');
    
    const success = await playElevenLabsAudio('Hallo! Dit is een test. Klinkt dit goed?');
    
    if (success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMessage('Test mislukt. Check je API key en permissies.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Key size={24} /> Instellingen
        </h2>

        {/* Cloud sync info */}
        {trainerCode ? (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-2">
            <Cloud size={18} className="text-blue-600" />
            <span className="text-sm text-blue-700">
              Instellingen worden opgeslagen in de cloud (trainer code: <strong>{trainerCode}</strong>)
            </span>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <span className="text-sm text-orange-700">
              ⚠️ Vul eerst een <strong>trainer code</strong> in bij de Trainer pagina om instellingen in de cloud op te slaan!
            </span>
          </div>
        )}

        {/* ElevenLabs sectie */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-bold text-purple-800 mb-2">ElevenLabs Stem</h3>
          <p className="text-sm text-purple-700 mb-3">
            Voor natuurlijke stemmen. Gratis account op{' '}
            <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="underline font-medium">
              elevenlabs.io
            </a>
          </p>
          
          {/* API Key input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-purple-800 mb-1">API Key:</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKeyState(e.target.value);
                  setStatus('idle');
                }}
                placeholder="Plak hier je API key..."
                className="flex-1 p-2 border border-purple-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Opslaan
              </button>
            </div>
          </div>

          {/* Stem selectie */}
          {voices.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-purple-800 mb-1">Kies een stem:</label>
              <select
                value={selectedVoice}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="w-full p-2 border border-purple-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
              >
                {voices.map((voice) => (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Knoppen */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={loadVoices}
              disabled={status === 'loading' || !isElevenLabsAvailable()}
              className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw size={16} className={status === 'loading' ? 'animate-spin' : ''} />
              {status === 'loading' ? 'Laden...' : 'Laad stemmen'}
            </button>
            
            <button
              onClick={handleTest}
              disabled={status === 'testing' || !isElevenLabsAvailable()}
              className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm disabled:opacity-50"
            >
              <Volume2 size={16} />
              {status === 'testing' ? 'Bezig...' : 'Test stem'}
            </button>
          </div>

          {/* Status feedback */}
          {status === 'success' && (
            <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-100 p-2 rounded-lg text-sm">
              <Check size={16} /> Werkt! Je hoort de ElevenLabs stem.
            </div>
          )}
          {status === 'error' && (
            <div className="mt-3 flex items-center gap-2 text-red-700 bg-red-100 p-2 rounded-lg text-sm">
              <X size={16} /> {errorMessage}
            </div>
          )}
        </div>

        {/* Status overzicht */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Status:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              {isElevenLabsAvailable() ? (
                <><Check size={14} className="text-green-600" /> ElevenLabs API key ingesteld</>
              ) : (
                <><X size={14} className="text-gray-400" /> ElevenLabs niet ingesteld</>
              )}
            </li>
            <li className="flex items-center gap-2">
              {voices.length > 0 ? (
                <><Check size={14} className="text-green-600" /> {voices.length} stemmen beschikbaar</>
              ) : (
                <><X size={14} className="text-gray-400" /> Nog geen stemmen geladen</>
              )}
            </li>
          </ul>
        </div>

        {/* Instructies */}
        <div className="mt-4 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <h4 className="font-medium mb-1 text-yellow-800">⚠️ Belangrijk bij API key aanmaken:</h4>
          <ol className="list-decimal list-inside space-y-1">
            <li>Ga naar elevenlabs.io → Profile → API Keys</li>
            <li>Klik <strong>"Create API key"</strong></li>
            <li>Zorg dat <strong>"Text-to-Speech"</strong> permissie AAN staat!</li>
            <li>Kopieer de key en plak hierboven</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
