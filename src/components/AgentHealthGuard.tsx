'use client';

import { useRemoteParticipants, useRoomContext } from '@livekit/components-react';
import { useEffect, useState } from 'react';
import { AlertTriangle, Wifi } from 'lucide-react';

export default function AgentHealthGuard() {
  const participants = useRemoteParticipants();
  const room = useRoomContext();
  const [status, setStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');

  useEffect(() => {
    const agent = participants.find(p => p.identity.toLowerCase().includes('agent'));
    const customer = participants.find(
      p => !p.identity.toLowerCase().includes('agent') &&
           !p.identity.toLowerCase().includes('supervisor')
    );

    if (room.state === 'connected') {
      if (customer && !agent) {
        setStatus('error');
      } else if (agent && agent.connectionQuality === 'poor') {
        setStatus('warning');
      } else {
        setStatus('healthy');
      }
    }
  }, [participants, room.state]);

  if (status === 'healthy') return null;

  const isError = status === 'error';

  return (
    <div style={{
      background: isError ? '#FCEBEB' : '#FAEEDA',
      border: `1px solid ${isError ? '#F7C1C1' : '#FAC775'}`,
      borderRadius: 10,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      fontFamily: "'Geist Sans', 'Helvetica Neue', sans-serif",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: isError ? '#F7C1C1' : '#FAC775',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isError ? '#A32D2D' : '#854F0B',
      }}>
        {isError
          ? <AlertTriangle size={14} style={{ animation: 'pulse 1.5s infinite' }} />
          : <Wifi size={14} />
        }
      </div>
      <div>
        <p style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', margin: 0,
          color: isError ? '#A32D2D' : '#854F0B',
        }}>
          {isError ? 'Agent Failure Detected' : 'Agent Connection Degraded'}
        </p>
        <p style={{
          fontSize: 11, margin: '3px 0 0',
          color: isError ? '#A32D2D' : '#854F0B',
          opacity: 0.8,
        }}>
          {isError
            ? 'AI has disconnected. Immediate takeover required.'
            : 'AI agent experiencing high latency. Monitor closely.'
          }
        </p>
      </div>
    </div>
  );
}