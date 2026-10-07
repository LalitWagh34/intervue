import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../lib/auth';
import { api } from '@/lib/api';

interface DashboardStats {
  streakCount: number;
  solvedCount: number;
  simulationsCount: number;
  recentInterviews: any[];
  avgScore: number;
  trend?: number[];
  skills?: {
    dsa: number;
    systemDesign: number;
    os: number;
    dbms: number;
    networks: number;
    behavioral: number;
  };
  recommendations?: any[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/profile/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      }
    };
    fetchStats();
  }, []);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  const firstName = session?.user?.name?.split(' ')[0] || 'Developer';

  return (
    <div className="w-full flex flex-col items-center">
      <main className="w-full pt-16 bg-surface-container-lowest min-h-screen"><div className="flex flex-col w-full">
<div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-8">
<header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
<div className="space-y-1.5">
<div className="flex items-center gap-2">
<span className="inline-flex items-center px-2 py-0.5 rounded font-badge-caps text-badge-caps uppercase tracking-wider text-tertiary bg-tertiary/10">Active Readiness Sprint</span>
{/* <span className="font-metadata-sm text-metadata-sm text-text-muted">Target: Senior SDE (L5)</span> */}
</div>
<h1 className="font-headline-page text-headline-page text-text-primary tracking-tight">{getGreeting()}, {firstName}.</h1>
<p className="font-body-base text-body-base text-text-secondary">Keep your interview preparation moving. Ready for your next challenge?</p>
</div>
<div className="flex items-center gap-3">
<Link to="/practice" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-elevated hover:bg-surface-hover text-text-primary font-body-bold text-body-bold transition-all shadow-sm">
<span className="material-symbols-outlined text-[18px] text-text-secondary">code_blocks</span>
<span>Practice Coding</span>
</Link>
</div>
</header>
<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
<div className="bg-surface-elevated rounded-xl p-4 flex flex-col justify-between shadow-sm">
<div className="flex items-center justify-between text-text-muted">
<span className="font-metadata-sm text-metadata-sm uppercase tracking-wide">Interview Score</span>
<span className="px-2 py-0.5 rounded font-badge-caps text-badge-caps uppercase text-primary bg-primary/10">Avg Score</span>
</div>
<div className="my-3 flex items-baseline gap-2">
<span className="font-code-bold text-3xl font-bold tracking-tight text-text-primary">{stats?.avgScore || 0}</span>
<span className="font-code-base text-code-base text-text-muted">/ 100</span>
</div>
<div className="flex items-center gap-1.5 font-metadata-sm text-metadata-sm text-status-success">
<span className="material-symbols-outlined text-[16px]">trending_up</span>
<span>Based on recent sessions</span>
</div>
</div>
<div className="bg-surface-elevated rounded-xl p-4 flex flex-col justify-between shadow-sm">
<div className="flex items-center justify-between text-text-muted">
<span className="font-metadata-sm text-metadata-sm uppercase tracking-wide">Practice Streak</span>
<span className="material-symbols-outlined text-[18px] text-status-warning" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
</div>
<div className="my-3 flex items-baseline gap-2">
<span className="font-code-bold text-3xl font-bold tracking-tight text-text-primary">{stats?.streakCount || 0}</span>
<span className="font-metadata-sm text-metadata-sm text-text-secondary">consecutive days</span>
</div>
<div className="font-metadata-sm text-metadata-sm text-text-muted">
          Keep it going!
</div>
</div>
<div className="bg-surface-elevated rounded-xl p-4 flex flex-col justify-between shadow-sm">
<div className="flex items-center justify-between text-text-muted">
<span className="font-metadata-sm text-metadata-sm uppercase tracking-wide">Problems Solved</span>
<span className="material-symbols-outlined text-[18px] text-tertiary">check_circle</span>
</div>
<div className="my-3 flex items-baseline gap-2">
<span className="font-code-bold text-3xl font-bold tracking-tight text-text-primary">{stats?.solvedCount || 0}</span>
<span className="font-code-base text-code-base text-text-muted">total</span>
</div>
<div className="font-metadata-sm text-metadata-sm text-text-secondary flex items-center gap-2">
<span>Total accepted submissions</span>
        </div>
</div>
<div className="bg-surface-elevated rounded-xl p-4 flex flex-col justify-between shadow-sm">
<div className="flex items-center justify-between text-text-muted">
<span className="font-metadata-sm text-metadata-sm uppercase tracking-wide">Full Simulations</span>
<span className="material-symbols-outlined text-[18px] text-secondary">psychology</span>
</div>
<div className="my-3 flex items-baseline gap-2">
<span className="font-code-bold text-3xl font-bold tracking-tight text-text-primary">{stats?.simulationsCount || 0}</span>
<span className="font-code-base text-code-base text-text-muted">sessions</span>
</div>
<div className="font-metadata-sm text-metadata-sm text-text-secondary flex items-center gap-2">
<span>Total simulations completed</span>
        </div>
</div>
</section>
</div>
</div></main>
    </div>
  );
}
