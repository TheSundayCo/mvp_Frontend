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

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Active Queue" val={queue.length} color="bg-blue-600" icon={<Users size={18}/>} />
          <MetricCard label="Escalations" val={escalated.length} color="bg-red-600" icon={<AlertCircle size={18}/>} />
          <MetricCard label="Successful" val="138" color="bg-emerald-600" icon={<CheckCircle2 size={18}/>} />
          <MetricCard label="Total Today" val="142" color="bg-slate-800" icon={<Phone size={18}/>} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Section title="Urgent Attention" icon={<AlertCircle className="text-red-600"/>} rooms={escalated} onJoin={onJoin} urgent />
          <Section title="Standard Queue" icon={<Users className="text-slate-600"/>} rooms={queue} onJoin={onJoin} />
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
        <p className="text-3xl font-black">{val}</p>
      </div>
      <div className={`${color} text-white p-3 rounded-xl`}>{icon}</div>
    </div>
  );
}

function Section({ title, icon, rooms, onJoin, urgent }: any) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[400px]">
      <div className="flex items-center gap-2 mb-6 text-lg font-bold">{icon} {title}</div>
      <div className="space-y-3">
        {rooms.length === 0 && <p className="text-slate-400 text-sm italic">No active calls.</p>}
        {rooms.map((r: any) => {
          const m = r.metadata ? JSON.parse(r.metadata) : {};
          return (
            <div key={r.sid} className={`flex justify-between items-center p-4 rounded-2xl border ${urgent ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <p className="font-bold text-slate-800">{r.name}</p>
                {urgent && <p className="text-xs text-red-600 font-bold uppercase">{m.reason || "Intervention needed"}</p>}
              </div>
              <button onClick={() => onJoin(r.name)} className="bg-slate-900 text-white text-xs px-5 py-2.5 rounded-xl font-bold hover:bg-black">Join</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}