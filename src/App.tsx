import { useState } from 'react';
import { Editor } from './components/Editor';
import { Quiz } from './components/Quiz';
import { Settings } from './components/Settings';
import { Settings as SettingsIcon } from 'lucide-react';

function App() {
  const [mode, setMode] = useState<'editor' | 'quiz' | 'settings'>('editor');

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center py-8">
      <div className="w-full max-w-4xl px-4 flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-900 font-sans">
          ⚽️ JO8 Inzicht Trainer
        </h1>
        
        <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm">
            <button 
                onClick={() => setMode('editor')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'editor' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
                Trainer
            </button>
            <button 
                 onClick={() => setMode('quiz')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'quiz' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
                Speler
            </button>
            <button 
                 onClick={() => setMode('settings')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'settings' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Instellingen"
            >
                <SettingsIcon size={18} />
            </button>
        </div>
      </div>
      
      <div className="w-full px-4">
        {mode === 'editor' && <Editor />}
        {mode === 'quiz' && <Quiz />}
        {mode === 'settings' && <Settings />}
      </div>
    </div>
  );
}

export default App;
