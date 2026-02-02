import { useState } from 'react';
import { Editor } from './components/Editor';
import { Quiz } from './components/Quiz';
import { Settings } from './components/Settings';
import { Settings as SettingsIcon, Users, Gamepad2 } from 'lucide-react';

function App() {
  const [mode, setMode] = useState<'editor' | 'quiz' | 'settings'>('editor');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Decoratieve achtergrond elementen */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-300/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-48 h-48 bg-emerald-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-green-400/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="w-full py-4 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-2xl shadow-playful p-4 md:p-5">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Logo & Titel */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg animate-float">
                    <span className="text-3xl">⚽</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-xs font-bold text-amber-900 shadow">
                    8
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gradient" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    Inzicht Trainer
                  </h1>
                  <p className="text-sm text-green-700 font-medium -mt-1">
                    Leer waar je moet staan! 🎯
                  </p>
                </div>
              </div>
              
              {/* Navigatie */}
              <nav className="flex gap-2 bg-green-100/50 p-1.5 rounded-xl">
                <button 
                  onClick={() => setMode('editor')}
                  className={`btn-bounce flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    mode === 'editor' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg glow-green' 
                      : 'text-green-700 hover:bg-white/60'
                  }`}
                >
                  <Users size={18} />
                  <span className="hidden sm:inline">Trainer</span>
                </button>
                <button 
                  onClick={() => setMode('quiz')}
                  className={`btn-bounce flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    mode === 'quiz' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg glow-green' 
                      : 'text-green-700 hover:bg-white/60'
                  }`}
                >
                  <Gamepad2 size={18} />
                  <span className="hidden sm:inline">Speler</span>
                </button>
                <button 
                  onClick={() => setMode('settings')}
                  className={`btn-bounce flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    mode === 'settings' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg glow-green' 
                      : 'text-green-700 hover:bg-white/60'
                  }`}
                  title="Instellingen"
                >
                  <SettingsIcon size={18} />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 w-full px-4 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto animate-slide-up">
          {mode === 'editor' && <Editor />}
          {mode === 'quiz' && <Quiz />}
          {mode === 'settings' && <Settings />}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-4 text-center">
        <p className="text-green-700/60 text-sm font-medium">
          Gemaakt met ❤️ voor jonge voetballers
        </p>
      </footer>
    </div>
  );
}

export default App;
