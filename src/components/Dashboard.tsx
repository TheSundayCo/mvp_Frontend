'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle, Users, Phone, CheckCircle2,
  Loader2, Clock, ChevronRight, Activity,
  Shield, Zap
} from 'lucide-react';

interface Room {
  sid: string;
  name: string;
  numParticipants: number;
  metadata?: string;
}

interface ParsedMeta {
  status?: string;
  reason?: string;
  summary?: string;
  context?: string;
  customerName?: string;
  policyNumber?: string;
  issueType?: string;
  messages?: { role: string; content: string }[];
  escalatedAt?: string;
}

function parseMeta(m?: string): ParsedMeta {
  try { return m ? JSON.parse(m) : {}; } catch { return {}; }
}

export default function Dashboard({ onJoin }: { onJoin: (room: Room) => Promise<void> }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (Array.isArray(data)) setRooms(data);
    } catch (e) {
      console.error('Polling error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  // Issue #3 fix: strict separation — escalated ONLY in escalated, rest in queue
  const escalated = rooms.filter(r => parseMeta(r.metadata).status === 'escalated');
  const queue = rooms.filter(r => parseMeta(r.metadata).status !== 'escalated');

  const handleJoin = async (room: Room) => {
    setSelectedRoom(room);
    await onJoin(room);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#F5F4F0' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin" size={24} style={{ color: '#1A1A2E' }} />
          <span style={{ fontFamily: "'Geist Sans', 'Helvetica Neue', sans-serif", fontSize: 13, color: '#888', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Loading dashboard
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0', fontFamily: "'Geist Sans', 'Helvetica Neue', sans-serif" }}>

      {/* TOP NAV */}
      <nav style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E8E6E1',
        padding: '0 32px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
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
          <span style={{
            marginLeft: 4, fontSize: 11, color: '#888', background: '#F0EFE9',
            padding: '2px 8px', borderRadius: 4, letterSpacing: '0.06em',
            textTransform: 'uppercase', fontWeight: 500,
          }}>
            Supervisor
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: escalated.length > 0 ? '#E24B4A' : '#639922',
            boxShadow: escalated.length > 0 ? '0 0 0 3px #FCEBEB' : '0 0 0 3px #EAF3DE',
          }} />
          <span style={{ fontSize: 12, color: '#666', letterSpacing: '0.02em' }}>
            {escalated.length > 0 ? `${escalated.length} escalation${escalated.length > 1 ? 's' : ''} active` : 'All systems nominal'}
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px' }}>

        {/* PAGE HEADER */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 26, fontWeight: 600, color: '#1A1A2E',
            letterSpacing: '-0.03em', margin: 0, lineHeight: 1.2,
            fontFamily: "'Instrument Serif', 'Playfair Display', Georgia, serif",
          }}>
            Operations Centre
          </h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} &nbsp;·&nbsp; Insurance AI Supervisor Dashboard
          </p>
        </div>

        {/* METRIC CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          <MetricCard label="Active Queue" value={queue.length} accent="#1A1A2E" icon={<Users size={16} />} />
          <MetricCard label="Escalations" value={escalated.length} accent="#E24B4A" icon={<AlertCircle size={16} />} urgent={escalated.length > 0} />
          <MetricCard label="Resolved Today" value={138} accent="#639922" icon={<CheckCircle2 size={16} />} />
          <MetricCard label="Total Sessions" value={142} accent="#378ADD" icon={<Phone size={16} />} />
        </div>

        {/* MAIN GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* ESCALATIONS */}
          <QueuePanel
            title="Requires Attention"
            icon={<AlertCircle size={15} />}
            rooms={escalated}
            isUrgent
            onJoin={handleJoin}
            accentColor="#E24B4A"
            emptyMessage="No escalations at this time."
          />

          {/* ACTIVE QUEUE */}
          <QueuePanel
            title="Active Queue"
            icon={<Activity size={15} />}
            rooms={queue}
            isUrgent={false}
            onJoin={handleJoin}
            accentColor="#378ADD"
            emptyMessage="No active sessions."
          />
        </div>

      </div>
    </div>
  );
}

function MetricCard({ label, value, accent, icon, urgent }: {
  label: string; value: number; accent: string; icon: React.ReactNode; urgent?: boolean;
}) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: urgent && (value as number) > 0 ? '1px solid #F7C1C1' : '1px solid #E8E6E1',
      borderRadius: 12,
      padding: '20px 22px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      transition: 'border-color 0.2s',
    }}>
      <div>
        <p style={{
          fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: '#999', margin: '0 0 8px',
        }}>
          {label}
        </p>
        <p style={{ fontSize: 32, fontWeight: 600, color: '#1A1A2E', margin: 0, letterSpacing: '-0.03em' }}>
          {value}
        </p>
      </div>
      <div style={{
        width: 34, height: 34, borderRadius: 8,
        background: accent + '12',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent,
      }}>
        {icon}
      </div>
    </div>
  );
}

function QueuePanel({ title, icon, rooms, isUrgent, onJoin, accentColor, emptyMessage }: {
  title: string;
  icon: React.ReactNode;
  rooms: Room[];
  isUrgent: boolean;
  onJoin: (room: Room) => Promise<void>;
  accentColor: string;
  emptyMessage: string;
}) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E8E6E1',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* Panel Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #F0EFE9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: accentColor }}>
          {icon}
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', color: '#1A1A2E' }}>
            {title}
          </span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600,
          background: rooms.length > 0 ? accentColor + '14' : '#F5F4F0',
          color: rooms.length > 0 ? accentColor : '#999',
          padding: '3px 10px', borderRadius: 20,
          letterSpacing: '0.04em',
        }}>
          {rooms.length}
        </span>
      </div>

      {/* Room List */}
      <div style={{ minHeight: 340, padding: '8px 0' }}>
        {rooms.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: 280, gap: 8,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#F5F4F0', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#CCC',
            }}>
              {isUrgent ? <AlertCircle size={18} /> : <Users size={18} />}
            </div>
            <p style={{ fontSize: 13, color: '#BBB', margin: 0 }}>{emptyMessage}</p>
          </div>
        ) : (
          rooms.map(r => (
            <RoomRow
              key={r.sid}
              room={r}
              isUrgent={isUrgent}
              onJoin={() => onJoin(r)}
              accentColor={accentColor}
            />
          ))
        )}
      </div>
    </div>
  );
}

function RoomRow({ room, isUrgent, onJoin, accentColor }: {
  room: Room;
  isUrgent: boolean;
  onJoin: () => void;
  accentColor: string;
}) {
  const meta = parseMeta(room.metadata);
  const isAgentActive = room.numParticipants >= 2;

  // Format escalation time
  const escalatedTime = meta.escalatedAt
    ? new Date(meta.escalatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid #F5F4F0',
        transition: 'background 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        {/* Live dot */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {isAgentActive && (
            <span style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: '#639922', opacity: 0.4,
              animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
            }} />
          )}
          <span style={{
            display: 'block', width: 10, height: 10, borderRadius: '50%',
            background: isAgentActive ? '#639922' : '#E24B4A',
            position: 'relative',
          }} />
        </div>

        {/* Info */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{
              fontSize: 13, fontWeight: 600, color: '#1A1A2E',
              margin: 0, letterSpacing: '-0.01em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {meta.customerName || room.name}
            </p>
            {meta.policyNumber && (
              <span style={{
                fontSize: 10, color: '#999',
                fontFamily: "'Geist Mono', 'SF Mono', monospace",
                background: '#F5F4F0', padding: '1px 6px', borderRadius: 4,
              }}>
                {meta.policyNumber}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            {isUrgent && meta.reason && (
              <span style={{
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: '#E24B4A',
              }}>
                {meta.reason}
              </span>
            )}
            {!isUrgent && meta.issueType && (
              <span style={{ fontSize: 11, color: '#888' }}>{meta.issueType}</span>
            )}
            {escalatedTime && (
              <span style={{ fontSize: 10, color: '#BBB', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={9} />
                {escalatedTime}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Join Button */}
      <button
        onClick={onJoin}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 14px',
          borderRadius: 7,
          border: 'none',
          background: isUrgent ? '#E24B4A' : '#1A1A2E',
          color: '#FFFFFF',
          fontSize: 11, fontWeight: 600,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'opacity 0.15s, transform 0.1s',
          fontFamily: "'Geist Sans', 'Helvetica Neue', sans-serif",
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        Join
        <ChevronRight size={12} />
      </button>
    </div>
  );
}