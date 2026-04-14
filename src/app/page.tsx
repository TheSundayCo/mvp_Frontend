'use client';

import { useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import Dashboard from '../components/Dashboard';
import ActiveCallView from '../components/ActiveCallView';
import '@livekit/components-styles';

interface Room {
  sid: string;
  name: string;
  numParticipants: number;
  metadata?: string;
}

export default function Page() {
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [token, setToken] = useState<string>('');

  // onJoin now receives the full room object (not just name)
  // so ActiveCallView can read metadata immediately on entry
  async function handleJoin(room: Room) {
    const res = await fetch(`/api/token?room=${room.name}`);
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
      setActiveRoom(room);
    }
  }

  const reset = () => { setToken(''); setActiveRoom(null); };

  if (activeRoom && token) {
    return (
      <LiveKitRoom
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        onDisconnected={reset}
        style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        <ActiveCallView onLeave={reset} />
      </LiveKitRoom>
    );
  }

  return <Dashboard onJoin={handleJoin} />;
}