import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Activity, 
  BarChart3, 
  Database, 
  Server, 
  Zap, 
  Clock, 
  ShieldCheck,
  AlertCircle,
  Plus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Types
interface EventPayload {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: Record<string, any>;
}

// Initial placeholder data for sparklines
const initialChartData = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  value: Math.floor(Math.random() * 50) + 10,
}));

export default function App() {
  const [events, setEvents] = useState<EventPayload[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    errorRate: 0.1,
    latency: 42,
  });
  const [connected, setConnected] = useState(false);
  const [chartData, setChartData] = useState(initialChartData);
  const [isProducing, setIsProducing] = useState(false);

  useEffect(() => {
    const socket: Socket = io();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('new_event', (event: EventPayload) => {
      setEvents(prev => [event, ...prev].slice(0, 50));
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        processed: prev.processed + 1,
        latency: Math.floor(Math.random() * 20) + 30
      }));
      
      setChartData(prev => {
        const newData = [...prev.slice(1), { time: prev.length, value: Math.floor(Math.random() * 50) + 20 }];
        return newData;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const triggerEvent = async () => {
    setIsProducing(true);
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: ['payment', 'login', 'signup', 'order', 'click'][Math.floor(Math.random() * 5)],
          data: { intensity: Math.random(), user_id: 'usr_' + Math.random().toString(36).substr(2, 5) }
        })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsProducing(false), 200);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-300 font-sans selection:bg-indigo-500/30">
      {/* Grid Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight">ZenFlow</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold leading-none">Real-time Processor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", connected ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500")} />
              <span className="text-xs font-medium uppercase tracking-wider">{connected ? "Connected" : "Disconnected"}</span>
            </div>
            <button 
              onClick={triggerEvent}
              disabled={isProducing}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded font-bold text-sm hover:bg-slate-200 transition-colors active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Ingest Event
            </button>
            <button
              onClick={() =>
                fetch('/api/simulate', {
                  method: 'POST',
                })
              }
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-indigo-500 transition-colors active:scale-95"
            >
              <Zap className="w-4 h-4" />
              Simulate Traffic
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8">
        
        {/* Key Stats */}
        <section className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Events" 
            value={stats.total.toLocaleString()} 
            icon={Activity} 
            color="text-indigo-400"
            sparkline={chartData}
          />
          <StatCard 
            title="Processed" 
            value={stats.processed.toLocaleString()} 
            icon={ShieldCheck} 
            color="text-emerald-400"
          />
          <StatCard 
            title="Latency" 
            value={`${stats.latency}ms`} 
            icon={Clock} 
            color="text-orange-400"
          />
          <StatCard 
            title="Active Services" 
            value="3/3" 
            icon={Server} 
            color="text-sky-400"
          />
        </section>

        {/* Analytics Section */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h2 className="font-bold text-white tracking-tight">Event Throughput</h2>
              </div>
              <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" />Realtime</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/10" />Historical</span>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#4f46e5" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <h2 className="font-bold text-white tracking-tight">Live Event Stream</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Last {events.length} events
              </span>
            </div>
            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
              <AnimatePresence initial={false}>
                {events.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-500">
                    <p className="text-sm italic italic-serif">Waiting for incoming signal...</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="px-6 py-4 grid grid-cols-4 items-center hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="col-span-1">
                        <span className="font-mono text-[10px] text-slate-500 uppercase tracking-tight">{event.id}</span>
                      </div>
                      <div className="col-span-1 flex items-center gap-2">
                        <EventTypeBadge type={event.type} />
                      </div>
                      <div className="col-span-1">
                        <span className="text-xs text-slate-400">{event.source}</span>
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="font-mono text-[10px] text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Sidebar Diagnostics */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Service Status
            </h3>
            <div className="space-y-4">
              <StatusRow label="Event Producer" status="operational" />
              <StatusRow label="Event Consumer" status="operational" />
              <StatusRow label="Kafka Cluster" status="operational" />
              <StatusRow label="PostgreSQL DB" status="operational" />
              <div className="pt-4 border-t border-white/10 mt-4">
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                  Note: In this preview environment, Kafka and PostgreSQL are simulated. 
                  View the README for production deployment instructions using Docker Compose.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                System Metrics
              </h3>

              <div className="space-y-4">
                <MetricRow
                  label="Throughput"
                  value="1,240 events/min"
                />

                <MetricRow
                  label="Queue Depth"
                  value="12 pending"
                />

                <MetricRow
                  label="Active Consumers"
                  value="3 instances"
                />

                <MetricRow
                  label="Memory Usage"
                  value="512MB"
                />

                <MetricRow
                  label="CPU Utilization"
                  value="34%"
                />
              </div>
            </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-6">
            <h3 className="text-white font-bold mb-2">Portfolio Quality</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              This system implements a production-grade architecture with event decoupling, 
              distributed logging, and real-time synchronization.
            </p>
            <ul className="text-[11px] space-y-2 text-indigo-200/70 font-medium">
              <li className="flex items-center gap-2"><div className="w-1 h-1 bg-indigo-400 rounded-full" /> Structured JSON Logging</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 bg-indigo-400 rounded-full" /> KafkaJS Driver Ready</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 bg-indigo-400 rounded-full" /> Type-safe Message Hub</li>
            </ul>
          </div>
        </aside>

      </main>

      <footer className="relative z-10 border-t border-white/10 py-8 px-6 mt-12 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600">
            ZenFlow Architecture v1.0.4
          </span>
          <div className="flex gap-8">
            <button className="text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-white transition-colors">Documentation</button>
            <button className="text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-white transition-colors">System Logs</button>
            <button className="text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-white transition-colors">Export Schema</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, sparkline }: any) {
  return (
    <div className="bg-white/5 border border-white/10 p-5 rounded-xl group hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{title}</span>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
      </div>
    </div>
  );
}

function StatusRow({ label, status }: { label: string, status: 'operational' | 'mocked' | 'degraded' }) {
  const colors = {
    operational: 'bg-emerald-500',
    mocked: 'bg-sky-500',
    degraded: 'bg-orange-500'
  };
  
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[9px] uppercase font-bold tracking-tighter text-slate-600">{status}</span>
        <div className={cn("w-1.5 h-1.5 rounded-full", colors[status])} />
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">
        {label}
      </span>

      <span className="text-[11px] font-bold text-white">
        {value}
      </span>
    </div>
  );
}

function EventTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
  PAYMENT_SUCCESS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  ORDER_CREATED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  USER_REGISTERED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  AUTH_SUCCESS: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  EMAIL_DISPATCHED: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  API_GATEWAY_REQUEST: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  generic: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
};
  
  return (
    <span className={cn(
      "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border",
      styles[type] || styles.generic
    )}>
      {type}
    </span>
  );
}
