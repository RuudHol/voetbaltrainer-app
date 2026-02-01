import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Trash2 } from 'lucide-react';

interface AudioRecorderProps {
  audioData: string | undefined;
  onAudioChange: (audio: string | undefined) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ audioData, onAudioChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onAudioChange(base64);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop alle tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Kon microfoon niet gebruiken. Geef toestemming in je browser.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (audioData && !isPlaying) {
      const audio = new Audio(audioData);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    }
  };

  const deleteAudio = () => {
    onAudioChange(undefined);
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <span className="text-sm text-gray-600 mr-2">Audio:</span>
      
      {!audioData ? (
        // Geen audio - toon opneem knop
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isRecording 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {isRecording ? (
            <>
              <Square size={16} /> Stop opname
            </>
          ) : (
            <>
              <Mic size={16} /> Spreek in
            </>
          )}
        </button>
      ) : (
        // Audio aanwezig - toon afspeel en verwijder knoppen
        <>
          <button
            onClick={playAudio}
            disabled={isPlaying}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isPlaying 
                ? 'bg-green-200 text-green-700' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            <Play size={16} /> {isPlaying ? 'Speelt...' : 'Afspelen'}
          </button>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            {isRecording ? (
              <>
                <Square size={16} /> Stop
              </>
            ) : (
              <>
                <Mic size={16} /> Opnieuw
              </>
            )}
          </button>
          
          <button
            onClick={deleteAudio}
            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            title="Verwijder audio"
          >
            <Trash2 size={16} />
          </button>
          
          <span className="text-xs text-green-600 ml-2">✓ Audio opgenomen</span>
        </>
      )}
    </div>
  );
};
