'use client';

import {
  useParticipants,
  useRoomContext,
  useTracks,
  AudioTrack,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Shield, User, Bot, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import AgentHealthGuard from './AgentHealthGuard';

interface Message {
  role: 'agent' | 'customer' | 'system';
  content: string;
  timestamp?: string;
}

interface RoomMeta {
  status?: string;
  reason?: string;
  summary?: string;
  context?: string;
  customerName?: string;
  policyNumber?: string;
  issueType?: string;
  messages?: Message[];
  escalatedAt?: string;
}

function parseMeta(m?: string): RoomMeta {
  try { return m ? JSON.parse(m) : {}; } catch { return {}; }
}

export default function ActiveCallView({ onLeave }: { onLeave: () => void }) {
  const room = useRoomContext();
  const participants = useParticipants();
  const tracks = useTracks([{ source: Track.Source.Microphone, withPlaceholder: false }]);

  const [muted, setMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const meta: RoomMeta = parseMeta(room.metadata ?? undefined);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const toggleMic = async () => {
    await room.localParticipant.setMicrophoneEnabled(muted);
    setMuted(!muted);
  };

  // Build conversation from metadata
  const messages: Message[] = meta.messages || [];
  const escalatedAt = meta.escalatedAt
    ? new Date(meta.escalatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  // Count agents/customers
  const agentParticipant = participants.find(p => p.identity.toLowerCase().includes('agent'));
  const customerParticipant = participants.find(p =>
    !p.identity.toLowerCase().includes('agent') &&
    !p.identity.toLowerCase().includes('supervisor')
  );

  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      background: '#F5F4F0',
      fontFamily: "'Geist Sans', 'Helvetica Neue', sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>

      {!speakerMuted && tracks
        .filter(t => t.publication !== undefined && t.participant.identity !== room.localParticipant.identity)
        .map(t => <AudioTrack key={t.publication!.trackSid} trackRef={t as any} />)
      }

      {/* NAV BAR */}
      <nav style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E8E6E1',
        padding: '0 28px',
        height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: '#1A1A2E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={14} color="#FFFFFF" />
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#1A1A2E', letterSpacing: '-0.02em' }}>
            ResolveAI
          </span>
          <ChevronRight size={14} style={{ color: '#CCC' }} />
          <span style={{ fontSize: 13, color: '#666' }}>
            {meta.customerName || room.name}
          </span>
        </div>

        {/* Call Timer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#F5F4F0', padding: '5px 12px', borderRadius: 8,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#E24B4A',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{
            fontFamily: "'Geist Mono', 'SF Mono', monospace",
            fontSize: 13, fontWeight: 600, color: '#1A1A2E', letterSpacing: '0.05em',
          }}>
            {formatTime(elapsed)}
          </span>
        </div>
      </nav>

      {/* MAIN LAYOUT */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 0 }}>

        {/* LEFT: CALL CONTEXT */}
        <div style={{ padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Escalation Banner */}
          {meta.status === 'escalated' && (
            <div style={{
              background: '#FCEBEB', border: '1px solid #F7C1C1',
              borderRadius: 10, padding: '12px 16px',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <AlertCircle size={15} style={{ color: '#E24B4A', marginTop: 1, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#A32D2D', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Escalated to Human Agent
                </p>
                <p style={{ fontSize: 12, color: '#A32D2D', opacity: 0.8, margin: '3px 0 0' }}>
                  {meta.reason || 'Manual escalation requested'}{escalatedAt ? ` · ${escalatedAt}` : ''}
                </p>
              </div>
            </div>
          )}

          <AgentHealthGuard />

          {/* Customer Info Card */}
          <div style={{
            background: '#FFFFFF', border: '1px solid #E8E6E1',
            borderRadius: 12, padding: '18px 20px',
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', margin: '0 0 14px' }}>
              Customer Details
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InfoField label="Name" value={meta.customerName || '—'} />
              <InfoField label="Policy No." value={meta.policyNumber || '—'} mono />
              <InfoField label="Issue Type" value={meta.issueType || '—'} />
              <InfoField label="Room" value={room.name} mono />
            </div>
          </div>

          {/* AI Summary */}
          {(meta.summary || meta.context) && (
            <div style={{
              background: '#FFFFFF', border: '1px solid #E8E6E1',
              borderRadius: 12, padding: '18px 20px',
            }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', margin: '0 0 10px' }}>
                AI Summary
              </p>
              <p style={{ fontSize: 13, color: '#3A3A3A', lineHeight: 1.6, margin: 0 }}>
                {meta.summary || meta.context}
              </p>
            </div>
          )}

          {/* Participants */}
          <div style={{
            background: '#FFFFFF', border: '1px solid #E8E6E1',
            borderRadius: 12, padding: '18px 20px',
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', margin: '0 0 12px' }}>
              Participants
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ParticipantChip
                label={meta.customerName || 'Customer'}
                role="Customer"
                online={!!customerParticipant}
                icon={<User size={13} />}
                color="#378ADD"
              />
              <ParticipantChip
                label="AI Agent"
                role="ResolveAI"
                online={!!agentParticipant}
                icon={<Bot size={13} />}
                color="#639922"
              />
              <ParticipantChip
                label="You"
                role="Supervisor"
                online
                icon={<Shield size={13} />}
                color="#1A1A2E"
              />
            </div>
          </div>

        </div>

        {/* RIGHT: TRANSCRIPT */}
        <div style={{
          borderLeft: '1px solid #E8E6E1',
          background: '#FAFAF8',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #EEECE8',
            flexShrink: 0,
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E', margin: 0, letterSpacing: '-0.01em' }}>
              Conversation Transcript
            </p>
            <p style={{ fontSize: 11, color: '#999', margin: '2px 0 0' }}>
              {messages.length} message{messages.length !== 1 ? 's' : ''} captured
            </p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', gap: 8, opacity: 0.5,
              }}>
                <Clock size={20} style={{ color: '#CCC' }} />
                <p style={{ fontSize: 12, color: '#BBB', margin: 0 }}>No transcript available</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <TranscriptBubble key={i} message={msg} />
              ))
            )}
          </div>

          {/* CALL CONTROLS — pinned to bottom of transcript pane */}
          <div style={{
            borderTop: '1px solid #EEECE8',
            background: '#FFFFFF',
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <ControlButton
              onClick={toggleMic}
              active={!muted}
              label={muted ? 'Unmute' : 'Mute'}
              icon={muted ? <MicOff size={16} /> : <Mic size={16} />}
              color="#1A1A2E"
            />
            <ControlButton
              onClick={() => setSpeakerMuted(s => !s)}
              active={!speakerMuted}
              label={speakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
              icon={speakerMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              color="#378ADD"
            />
            <button
              onClick={onLeave}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', borderRadius: 8,
                background: '#E24B4A', border: 'none', color: '#FFFFFF',
                fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
                cursor: 'pointer', transition: 'opacity 0.15s',
                fontFamily: "'Geist Sans', 'Helvetica Neue', sans-serif",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <PhoneOff size={14} />
              Leave
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 2px', fontWeight: 600 }}>
        {label}
      </p>
      <p style={{
        fontSize: 13, color: '#1A1A2E', margin: 0, fontWeight: 500,
        fontFamily: mono ? "'Geist Mono', 'SF Mono', monospace" : 'inherit',
      }}>
        {value}
      </p>
    </div>
  );
}

function ParticipantChip({ label, role, online, icon, color }: {
  label: string; role: string; online: boolean; icon: React.ReactNode; color: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', borderRadius: 8, background: '#F5F4F0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: color + '14', color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E', margin: 0 }}>{label}</p>
          <p style={{ fontSize: 10, color: '#999', margin: 0 }}>{role}</p>
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 10, color: online ? '#639922' : '#E24B4A', fontWeight: 600,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: online ? '#639922' : '#E24B4A',
        }} />
        {online ? 'Live' : 'Away'}
      </div>
    </div>
  );
}

function TranscriptBubble({ message }: { message: Message }) {
  const isCustomer = message.role === 'customer';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center' }}>
        <span style={{
          fontSize: 10, color: '#BBB', background: '#EEECE8',
          padding: '3px 10px', borderRadius: 20, display: 'inline-block',
          letterSpacing: '0.04em',
        }}>
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isCustomer ? 'flex-start' : 'flex-end',
    }}>
      <span style={{
        fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.07em', color: '#BBB', marginBottom: 4,
        paddingLeft: isCustomer ? 2 : 0,
        paddingRight: isCustomer ? 0 : 2,
      }}>
        {isCustomer ? 'Customer' : 'AI Agent'}
      </span>
      <div style={{
        maxWidth: '80%',
        background: isCustomer ? '#FFFFFF' : '#1A1A2E',
        border: isCustomer ? '1px solid #EEECE8' : 'none',
        color: isCustomer ? '#2A2A2A' : '#FFFFFF',
        borderRadius: isCustomer ? '10px 10px 10px 3px' : '10px 10px 3px 10px',
        padding: '8px 12px',
        fontSize: 12, lineHeight: 1.55,
      }}>
        {message.content}
      </div>
      {message.timestamp && (
        <span style={{ fontSize: 9, color: '#CCC', marginTop: 3 }}>
          {message.timestamp}
        </span>
      )}
    </div>
  );
}

function ControlButton({ onClick, active, label, icon, color }: {
  onClick: () => void; active: boolean; label: string; icon: React.ReactNode; color: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 42, height: 42, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? color + '12' : '#F5F4F0',
        border: `1px solid ${active ? color + '30' : '#E8E6E1'}`,
        color: active ? color : '#AAA',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = color + '20'; }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? color + '12' : '#F5F4F0'; }}
    >
      {icon}
    </button>
  );
}