
import React, { useEffect, useState, useRef } from 'react';
import { AppConfig, ChatMessage, Theme, Role } from '../types';
import { createLiveSession, LiveSessionController } from '../services/liveService';
import { TRANSLATIONS } from '../constants';
import { Mic, MicOff, PhoneOff, Activity, User, Bot } from 'lucide-react';

interface Props {
  config: AppConfig;
  theme: Theme;
  onEndSession: (history: ChatMessage[]) => void;
}

const LiveInterface: React.FC<Props> = ({ config, theme, onEndSession }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const controllerRef = useRef<LiveSessionController | null>(null);
  const t = TRANSLATIONS[config.language];

  useEffect(() => {
    const controller = createLiveSession(config, {
      onStatusChange: (s) => setStatus(s),
      onAudioActivity: (isUser) => setIsUserTurn(isUser),
    });
    
    controllerRef.current = controller;
    controller.connect();

    const timer = setInterval(() => {
       if (status === 'connected') setDuration(d => d + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      controller.disconnect();
    };
  }, []); // Run once on mount

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    const history = controllerRef.current?.getTranscript() || [];
    controllerRef.current?.disconnect();
    onEndSession(history);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] items-center justify-center relative overflow-hidden bg-slate-900 rounded-xl shadow-2xl">
      
      {/* Background Pulse Effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`w-64 h-64 rounded-full bg-opacity-20 transition-all duration-1000 ${status === 'connected' ? 'animate-ping opacity-20' : 'opacity-0'}`} 
             style={{ backgroundColor: theme.secondary }}></div>
        <div className={`absolute w-96 h-96 rounded-full bg-opacity-10 transition-all duration-1000 delay-150 ${status === 'connected' ? 'animate-ping opacity-10' : 'opacity-0'}`}
             style={{ backgroundColor: theme.primary }}></div>
      </div>

      {/* Main Content */}
      <div className="z-10 flex flex-col items-center space-y-12 w-full max-w-md p-8">
        
        {/* Header Info */}
        <div className="text-center space-y-2">
           <h2 className="text-2xl font-bold text-white font-['Prompt']">
             {config.userRole === Role.COACH ? 'Client Call' : 'Dr.LiveCoach'}
           </h2>
           <p className="text-slate-400 text-sm">{formatTime(duration)}</p>
           <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
             status === 'connected' ? 'bg-green-500/20 text-green-400' : 
             status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
           }`}>
             <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
             {status === 'connecting' ? t.connecting : status === 'connected' ? t.activeNow : status === 'error' ? t.liveError : 'Disconnected'}
           </div>
        </div>

        {/* Visualizer / Avatar */}
        <div className="relative">
          <div className={`w-40 h-40 rounded-full flex items-center justify-center border-4 shadow-[0_0_40px_rgba(0,0,0,0.3)] transition-all duration-500
            ${!isUserTurn ? 'scale-110 border-opacity-100' : 'scale-100 border-opacity-30 border-slate-600'}`}
            style={{ 
              borderColor: !isUserTurn ? theme.accent : undefined,
              backgroundColor: theme.primary
            }}
          >
             {config.userRole === Role.COACH ? <User size={64} className="text-white opacity-80" /> : <Bot size={64} className="text-white opacity-80" />}
          </div>
          
          {/* Speaking Indicator */}
          {!isUserTurn && (
             <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-white/80 font-medium text-sm animate-bounce">
               {t.speaking}
             </div>
          )}
           {isUserTurn && status === 'connected' && (
             <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-white/50 font-medium text-sm">
               {t.listening}
             </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
           <button 
             onClick={() => setIsMuted(!isMuted)} // Note: Visual only for now, would need MediaStream track enabling in real impl
             className={`p-4 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-all ${isMuted ? 'bg-red-900/50 text-red-400' : ''}`}
           >
             {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
           </button>

           <button 
             onClick={handleEndCall}
             className="p-6 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 hover:scale-105 transition-all"
           >
             <PhoneOff size={32} />
           </button>
        </div>

        {/* Context Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 w-full border border-white/10 text-center">
           <h3 className="text-slate-300 text-xs uppercase tracking-wider font-bold mb-1">Current Topic</h3>
           <p className="text-white text-sm line-clamp-2">"{config.persona.topic}"</p>
        </div>

      </div>
    </div>
  );
};

export default LiveInterface;