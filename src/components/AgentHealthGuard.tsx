'use client';

import { useRemoteParticipants, useRoomContext } from '@livekit/components-react';
import { useEffect, useState } from 'react';
import { AlertTriangle, Activity } from 'lucide-react';

export default function AgentHealthGuard() {
  const participants = useRemoteParticipants();
  const room = useRoomContext();
  const [status, setStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');

  useEffect(() => {
    // Identify participants by your naming convention
    const agent = participants.find(p => p.identity.toLowerCase().includes('agent'));
    const customer = participants.find(p => !p.identity.toLowerCase().includes('agent') && !p.identity.toLowerCase().includes('supervisor'));

    if (room.state === 'connected') {
      if (customer && !agent) {
        // Customer is alone: Agent crashed or disconnected
        setStatus('error');
      } else if (agent && agent.connectionQuality === 'poor') {
        // Agent is present but lagging
        setStatus('warning');
      } else {
        setStatus('healthy');
      }
    }
  }, [participants, room.state]);

  if (status === 'healthy') return null;

  return (
    <div className={`mt-4 p-3 rounded-xl border flex items-center gap-3 transition-all ${
      status === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
    }`}>
      <AlertTriangle size={18} className={status === 'error' ? 'animate-pulse' : ''} />
      <div className="flex flex-col">
        <p className="text-xs font-bold uppercase tracking-tight">
          {status === 'error' ? 'Agent Failure Detected' : 'Agent Connection Weak'}
        </p>
        <p className="text-[10px] opacity-80">
          {status === 'error' ? 'AI has left the room. Immediate takeover required.' : 'AI may experience high latency.'}
        </p>
      </div>
    </div>
  );
}