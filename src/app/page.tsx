'use client';

import { useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import Dashboard from '../components/Dashboard';
import ActiveCallView from '../components/ActiveCallView';
import '@livekit/components-styles';

export default function Page() {
  const [roomName, setRoomName] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');

  async function handleJoin(name: string) {
    const res = await fetch(`/api/token?room=${name}`);
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
      setRoomName(name);
    }
  }

  const reset = () => { setToken(''); setRoomName(null); };

  if (roomName && token) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
        <LiveKitRoom
          audio={true}
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          onDisconnected={reset}
        >
          <ActiveCallView onLeave={reset} />
        </LiveKitRoom>
      </div>
    );
  }

  return <Dashboard onJoin={handleJoin}/>;
}