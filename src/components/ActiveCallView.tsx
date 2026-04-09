'use client';

import { useRoomContext, RoomAudioRenderer, VoiceAssistantControlBar } from '@livekit/components-react';
import { PhoneOff } from 'lucide-react';

export default function ActiveCallView({ onLeave }: { onLeave: () => void }) {
  const room = useRoomContext();

  return (
    <div className="w-full max-w-md bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl text-center">
      <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
        <PhoneOff className="text-white" size={24} />
      </div>
      <h2 className="text-white text-2xl font-black mb-1">{room.name}</h2>
      <p className="text-slate-400 text-sm mb-8">Human Supervisor Intervened</p>

      <RoomAudioRenderer />
      <VoiceAssistantControlBar />

      <button 
        onClick={onLeave}
        className="w-full mt-8 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-red-600 transition-colors"
      >
        Leave Session
      </button>
    </div>
  );
}