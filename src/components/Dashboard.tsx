'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Users, Phone, CheckCircle2, Loader2 } from 'lucide-react';

export default function Dashboard({ onJoin }: { onJoin: (name: string) => void }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (Array.isArray(data)) setRooms(data);
    } catch (e) {
      console.error("Polling error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const parseMeta = (m?: string) => {
    try { return m ? JSON.parse(m) : {}; } catch { return {}; }
  };

  const escalated = rooms.filter(r => parseMeta(r.metadata).status === 'escalated');
  const queue = rooms.filter(r => parseMeta(r.metadata).status !== 'escalated');

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* RESTORED TOP BAR STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Active Queue" val={queue.length} color="bg-[#6366F1]" icon={<Users size={20}/>} />
          <MetricCard label="Escalations" val={escalated.length} color="bg-[#FF0000]" icon={<AlertCircle size={20}/>} />
          <MetricCard label="Successful" val="138" color="bg-[#10B981]" icon={<CheckCircle2 size={20}/>} />
          <MetricCard label="Total Today" val="142" color="bg-[#1E293B]" icon={<Phone size={20}/>} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Urgent Section */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[400px]">
            <h2 className="flex items-center gap-2 mb-6 text-lg font-bold text-red-600">
              <AlertCircle size={20}/> Urgent Attention
            </h2>
            <div className="space-y-3">
              {escalated.length === 0 && <p className="text-slate-400 text-sm italic">No flagged calls.</p>}
              {escalated.map(r => <RoomRow key={r.sid} room={r} onJoin={onJoin} isUrgent />)}
            </div>
          </section>

          {/* Standard Section */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[400px]">
            <h2 className="flex items-center gap-2 mb-6 text-lg font-bold text-slate-700">
              <Users size={20}/> Active Queue
            </h2>
            <div className="space-y-3">
              {queue.length === 0 && <p className="text-slate-400 text-sm italic">No active sessions.</p>}
              {queue.map(r => <RoomRow key={r.sid} room={r} onJoin={onJoin} />)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, val, color, icon }: any) {
  return (
    <div className="bg-white p-5 border rounded-2xl shadow-sm flex justify-between items-center">
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
        <p className="text-3xl font-black text-slate-800">{val}</p>
      </div>
      <div className={`${color} text-white p-3 rounded-2xl shadow-lg`}>{icon}</div>
    </div>
  );
}

function RoomRow({ room, onJoin, isUrgent }: any) {
  const meta = room.metadata ? JSON.parse(room.metadata) : {};
  const isAgentActive = room.numParticipants >= 2;

  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isUrgent ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center gap-3">
        {/* STATUS DOT */}
        <div className="relative flex h-3 w-3">
          {isAgentActive && (
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-3 w-3 ${isAgentActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </div>

        <div>
          <p className="font-bold text-sm leading-tight text-slate-900">{room.name}</p>
          {isUrgent && <p className="text-[10px] text-red-600 font-bold uppercase mt-0.5">{meta.reason || 'Manual Flag'}</p>}
        </div>
      </div>

      <button 
        onClick={() => onJoin(room.name)} 
        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-colors ${
          isUrgent ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-900 text-white hover:bg-black'
        }`}
      >
        Join Call
      </button>
    </div>
  );
}