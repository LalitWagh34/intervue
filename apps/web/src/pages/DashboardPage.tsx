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
<p className="font-body-base text-body-base text-text-secondary">Keep your interview preparation moving. Next mock evaluation scheduled in 2 days.</p>
</div>
<div className="flex items-center gap-3">
<button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-elevated hover:bg-surface-hover text-text-primary font-body-bold text-body-bold transition-all shadow-sm">
<span className="material-symbols-outlined text-[18px] text-text-secondary">code_blocks</span>
<span>Practice Coding</span>
</button>
<button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary font-body-bold text-body-bold transition-all shadow-sm">
<span className="material-symbols-outlined text-[18px]">play_arrow</span>
<span>Start Interview</span>
</button>
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
<span className="text-text-primary font-code-base">12</span> Voice/Chat <span className="text-text-muted">·</span> <span className="text-text-primary font-code-base">6</span> Timed Code
        </div>
</div>
</section>
<section className="space-y-4">
<div className="flex items-center justify-between">
<div>
<h2 className="font-headline-section text-headline-section text-text-primary tracking-tight">Recent Sessions</h2>
</div>
<Link className="font-metadata-sm text-metadata-sm text-primary hover:text-primary-fixed transition-colors flex items-center gap-1" to="#">
<span>View History</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</Link>
</div>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
{stats?.recentInterviews && stats.recentInterviews.length > 0 ? (
  stats.recentInterviews.map((interview: any) => (
    <div key={interview.id} className="bg-surface-elevated rounded-xl p-5 flex flex-col justify-between space-y-5 hover:bg-surface-hover transition-colors shadow-sm">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="px-2 py-0.5 rounded font-badge-caps text-badge-caps uppercase tracking-wider text-secondary bg-secondary/10">{interview.mode}</span>
          <span className="font-metadata-sm text-metadata-sm text-text-muted">{new Date(interview.createdAt).toLocaleDateString()}</span>
        </div>
        <h3 className="font-title-card text-title-card text-text-primary leading-snug">{interview.role || "General Interview"}</h3>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-surface-container">
        <div className="flex items-baseline gap-1">
          <span className="font-metadata-sm text-metadata-sm text-text-muted">Status:</span>
          <span className={`font-code-bold text-code-bold ${interview.status === 'completed' ? 'text-status-success' : 'text-text-primary'}`}>
            {interview.status}
          </span>
        </div>
        <button className="px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-active text-text-primary font-body-bold text-body-bold text-xs transition-colors flex items-center gap-1.5">
          <span>{interview.status === 'completed' ? 'View Details' : 'Continue'}</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </div>
    </div>
  ))
) : (
  <div className="col-span-3 py-10 flex flex-col items-center justify-center text-text-muted bg-surface-elevated rounded-xl border border-dashed border-surface-container">
    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">history</span>
    <p>No recent sessions found.</p>
    <button className="mt-4 px-4 py-2 rounded-lg bg-primary-container text-on-primary font-body-bold text-sm">Start a new simulation</button>
  </div>
)}
</div>
</section>
<section className="space-y-4">
<div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-[20px]">auto_awesome</span>
<h2 className="font-headline-section text-headline-section text-text-primary tracking-tight">Recommended for you</h2>
</div>
<p className="font-body-base text-body-base text-text-secondary mt-1">Based on gaps detected in your recent interview performance (Failure recovery &amp; Cache invalidation).</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<div className="bg-surface-elevated rounded-xl p-5 flex flex-col justify-between space-y-4 hover:bg-surface-hover transition-colors shadow-sm">
<div className="space-y-3">
<div className="flex items-center justify-between">
<span className="px-2 py-0.5 rounded font-badge-caps text-badge-caps uppercase tracking-wider text-status-warning bg-status-warning/10">Medium · DSA</span>
<span className="material-symbols-outlined text-text-muted text-[18px]">account_tree</span>
</div>
<h3 className="font-title-card text-title-card text-text-primary">Graph Algorithms &amp; Topological Sort</h3>
<div className="p-2.5 rounded-lg bg-surface-container text-xs text-text-secondary space-y-1">
<div className="font-body-bold text-text-primary flex items-center gap-1">
<span className="material-symbols-outlined text-status-warning text-[14px]">warning</span>
<span>Insight Gap</span>
</div>
<p>Improves Problem Solving (-12% gap vs target level in recent coding run).</p>
</div>
</div>
<button className="w-full py-2 rounded-lg bg-surface-container hover:bg-surface-active text-text-primary font-body-bold text-body-bold text-xs transition-colors flex items-center justify-center gap-1.5">
<span>Start Drill (15m)</span>
<span className="material-symbols-outlined text-[14px]">timer</span>
</button>
</div>
<div className="bg-surface-elevated rounded-xl p-5 flex flex-col justify-between space-y-4 hover:bg-surface-hover transition-colors shadow-sm">
<div className="space-y-3">
<div className="flex items-center justify-between">
<span className="px-2 py-0.5 rounded font-badge-caps text-badge-caps uppercase tracking-wider text-status-error bg-status-error/10">Hard · System Design</span>
<span className="material-symbols-outlined text-text-muted text-[18px]">dns</span>
</div>
<h3 className="font-title-card text-title-card text-text-primary">Distributed Caching &amp; Cache-Aside Invalidation</h3>
<div className="p-2.5 rounded-lg bg-surface-container text-xs text-text-secondary space-y-1">
<div className="font-body-bold text-text-primary flex items-center gap-1">
<span className="material-symbols-outlined text-status-error text-[14px]">error</span>
<span>AI Diagnostic</span>
</div>
<p>Weak area detected in Amazon Mock: multi-region replication lag recovery.</p>
</div>
</div>
<button className="w-full py-2 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary font-body-bold text-body-bold text-xs transition-colors flex items-center justify-center gap-1.5">
<span>Review Concept &amp; Drill</span>
<span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</button>
</div>
<div className="bg-surface-elevated rounded-xl p-5 flex flex-col justify-between space-y-4 hover:bg-surface-hover transition-colors shadow-sm">
<div className="space-y-3">
<div className="flex items-center justify-between">
<span className="px-2 py-0.5 rounded font-badge-caps text-badge-caps uppercase tracking-wider text-tertiary bg-tertiary/10">Core CS</span>
<span className="material-symbols-outlined text-text-muted text-[18px]">memory</span>
</div>
<h3 className="font-title-card text-title-card text-text-primary">OS Virtual Memory &amp; Page Replacement</h3>
<div className="p-2.5 rounded-lg bg-surface-container text-xs text-text-secondary space-y-1">
<div className="font-body-bold text-text-primary flex items-center gap-1">
<span className="material-symbols-outlined text-tertiary text-[14px]">info</span>
<span>Spaced Repetition</span>
</div>
<p>Revision recommended: 14 days since last evaluation on page tables and TLB.</p>
</div>
</div>
<button className="w-full py-2 rounded-lg bg-surface-container hover:bg-surface-active text-text-primary font-body-bold text-body-bold text-xs transition-colors flex items-center justify-center gap-1.5">
<span>Quick Quiz (5 Qs)</span>
<span className="material-symbols-outlined text-[14px]">quiz</span>
</button>
</div>
</div>
</section>
<section className="space-y-4">
<div>
<h2 className="font-headline-section text-headline-section text-text-primary tracking-tight">Performance &amp; Skill Readiness Matrix</h2>
<p className="font-body-base text-body-base text-text-secondary mt-1">Multi-dimensional evaluation against the Meta/Amazon Senior Software Engineer bar.</p>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
<div className="lg:col-span-7 bg-surface-elevated rounded-xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
<div className="flex items-center justify-between flex-wrap gap-2">
<div>
<span className="font-title-card text-title-card text-text-primary">Interview Performance Trend</span>
<p className="font-metadata-sm text-metadata-sm text-text-muted">Calculated composite score over rolling 6-week window</p>
</div>
<div className="flex items-center gap-4 font-metadata-sm text-metadata-sm">
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
<span className="text-text-secondary">Your Score</span>
</div>
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-0.5 bg-status-warning"></span>
<span className="text-text-muted">L5 Target (75)</span>
</div>
</div>
</div>
<div className="relative w-full h-56 flex flex-col justify-end pt-4">
<div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-text-muted text-[11px] font-code-base">
<div className="border-b border-surface-container w-full flex justify-between pr-2"><span>100</span></div>
<div className="border-b border-surface-container w-full flex justify-between pr-2"><span>80</span></div>
<div className="border-b border-status-warning/40 border-dashed w-full flex justify-between pr-2 text-status-warning"><span>75 (Bar)</span></div>
<div className="border-b border-surface-container w-full flex justify-between pr-2"><span>60</span></div>
<div className="border-b border-surface-container w-full flex justify-between pr-2"><span>40</span></div>
</div>
<svg className="w-full h-44 overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 500 180">
<defs>
<linearGradient id="scoreTrendGradient" x1="0%" x2="0%" y1="0%" y2="100%">
<stop offset="0%" stopColor="#448ffd" stopOpacity="0.35"></stop>
<stop offset="100%" stopColor="#448ffd" stopOpacity="0.0"></stop>
</linearGradient>
</defs>
<line opacity="0.8" stroke="#F59E0B" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="500" y1="75" y2="75"></line>
<polygon fill="url(#scoreTrendGradient)" points="20,108 116,99 212,87 308,81 404,72 500,60 500,180 20,180"></polygon>
<polyline fill="none" points="20,108 116,99 212,87 308,81 404,72 500,60" stroke="#448ffd" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></polyline>
<circle className="fill-surface-elevated stroke-primary-container" cx="20" cy="108" r="4" strokeWidth="2"></circle>
<circle className="fill-surface-elevated stroke-primary-container" cx="116" cy="99" r="4" strokeWidth="2"></circle>
<circle className="fill-surface-elevated stroke-primary-container" cx="212" cy="87" r="4" strokeWidth="2"></circle>
<circle className="fill-surface-elevated stroke-primary-container" cx="308" cy="81" r="4" strokeWidth="2"></circle>
<circle className="fill-surface-elevated stroke-primary-container" cx="404" cy="72" r="4" strokeWidth="2"></circle>
<circle className="fill-primary-container stroke-text-primary" cx="500" cy="60" r="5" strokeWidth="2"></circle>
</svg>
<div className="flex justify-between items-center text-text-muted font-code-base text-[11px] pt-2 z-10">
<span>W-5 (64)</span>
<span>W-4 (67)</span>
<span>W-3 (71)</span>
<span>W-2 (73)</span>
<span>W-1 (76)</span>
<span className="text-text-primary font-code-bold">Current (78)</span>
</div>
</div>
<div className="bg-surface-container rounded-lg p-3 flex items-center justify-between font-metadata-sm text-metadata-sm">
<span className="text-text-secondary">Summary Insight: Velocity pace qualifies for L5 mock sign-off.</span>
<span className="font-code-bold text-status-success">+14 pts over sprint</span>
</div>
</div>
<div className="lg:col-span-5 bg-surface-elevated rounded-xl p-6 flex flex-col justify-between space-y-5 shadow-sm">
<div>
<div className="flex items-center justify-between">
<span className="font-title-card text-title-card text-text-primary">Skills Diagnostic Index</span>
<span className="font-badge-caps text-badge-caps text-tertiary uppercase">Live Calibration</span>
</div>
<p className="font-metadata-sm text-metadata-sm text-text-muted mt-0.5">Aggregated from dynamic code, voice &amp; diagram ratings</p>
</div>
<div className="space-y-3.5">
<div className="space-y-1">
<div className="flex items-center justify-between font-metadata-sm text-metadata-sm">
<span className="text-text-primary font-body-bold">DSA</span>
<div className="flex items-center gap-2">
<span className="font-code-bold text-text-primary">82 / 100</span>
<span className="text-status-success font-badge-caps text-badge-caps uppercase">Proficient</span>
</div>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-status-success h-full rounded-full w-[82%]"></div>
</div>
</div>
<div className="space-y-1">
<div className="flex items-center justify-between font-metadata-sm text-metadata-sm">
<span className="text-text-primary font-body-bold">System Design</span>
<div className="flex items-center gap-2">
<span className="font-code-bold text-text-primary">71 / 100</span>
<span className="text-status-warning font-badge-caps text-badge-caps uppercase">Needs Caching Drill</span>
</div>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-status-warning h-full rounded-full w-[71%]"></div>
</div>
</div>
<div className="space-y-1">
<div className="flex items-center justify-between font-metadata-sm text-metadata-sm">
<span className="text-text-primary font-body-bold">OS &amp; Concurrency</span>
<div className="flex items-center gap-2">
<span className="font-code-bold text-text-primary">76 / 100</span>
<span className="text-tertiary font-badge-caps text-badge-caps uppercase">Solid</span>
</div>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-tertiary h-full rounded-full w-[76%]"></div>
</div>
</div>
<div className="space-y-1">
<div className="flex items-center justify-between font-metadata-sm text-metadata-sm">
<span className="text-text-primary font-body-bold">DBMS &amp; Storage</span>
<div className="flex items-center gap-2">
<span className="font-code-bold text-text-primary">80 / 100</span>
<span className="text-status-success font-badge-caps text-badge-caps uppercase">Strong</span>
</div>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-status-success h-full rounded-full w-[80%]"></div>
</div>
</div>
<div className="space-y-1">
<div className="flex items-center justify-between font-metadata-sm text-metadata-sm">
<span className="text-text-primary font-body-bold">Computer Networks</span>
<div className="flex items-center gap-2">
<span className="font-code-bold text-text-primary">74 / 100</span>
<span className="text-text-muted font-badge-caps text-badge-caps uppercase">Average</span>
</div>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-text-secondary h-full rounded-full w-[74%]"></div>
</div>
</div>
<div className="space-y-1">
<div className="flex items-center justify-between font-metadata-sm text-metadata-sm">
<span className="text-text-primary font-body-bold">Behavioral &amp; Communication</span>
<div className="flex items-center gap-2">
<span className="font-code-bold text-text-primary">74 / 100</span>
<span className="text-primary font-badge-caps text-badge-caps uppercase">Good</span>
</div>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-primary-container h-full rounded-full w-[74%]"></div>
</div>
</div>
</div>
<div className="pt-2 flex items-center justify-between text-xs text-text-muted">
<span>Bar: Senior Software Engineer (L5)</span>
<span className="text-text-secondary font-code-base">Threshold: 75 Avg</span>
</div>
</div>
</div>
</section>
</div>
</div></main>
    </div>
  );
}
