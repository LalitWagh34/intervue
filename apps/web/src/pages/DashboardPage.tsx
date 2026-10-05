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
<p className="font-body-base text-body-base text-text-secondary">Keep your interview preparation moving. Ready for your next challenge?</p>
</div>
<div className="flex items-center gap-3">
<Link to="/practice" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-elevated hover:bg-surface-hover text-text-primary font-body-bold text-body-bold transition-all shadow-sm">
<span className="material-symbols-outlined text-[18px] text-text-secondary">code_blocks</span>
<span>Practice Coding</span>
</Link>
<Link to="/interview" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary font-body-bold text-body-bold transition-all shadow-sm">
<span className="material-symbols-outlined text-[18px]">play_arrow</span>
<span>Start Interview</span>
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
<section className="space-y-4">
<div className="flex items-center justify-between">
<div>
<h2 className="font-headline-section text-headline-section text-text-primary tracking-tight">Recent Sessions</h2>
</div>
<Link className="font-metadata-sm text-metadata-sm text-primary hover:text-primary-fixed transition-colors flex items-center gap-1" to="/history">
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
        <Link to={`/results/${interview.id}`} className="px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-active text-text-primary font-body-bold text-body-bold text-xs transition-colors flex items-center gap-1.5">
          <span>{interview.status === 'completed' ? 'View Details' : 'Continue'}</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  ))
) : (
  <div className="col-span-3 py-10 flex flex-col items-center justify-center text-text-muted bg-surface-elevated rounded-xl border border-dashed border-surface-container">
    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">history</span>
    <p>No recent sessions found.</p>
    <Link to="/interview" className="mt-4 px-4 py-2 rounded-lg bg-primary-container text-on-primary font-body-bold text-sm">Start a new simulation</Link>
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
{stats?.recommendations?.map((rec: any) => (
  <div key={rec.id} className="bg-surface-elevated rounded-xl p-5 flex flex-col justify-between space-y-4 hover:bg-surface-hover transition-colors shadow-sm">
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded font-badge-caps text-badge-caps uppercase tracking-wider ${rec.level === 'Hard' ? 'text-status-error bg-status-error/10' : rec.level === 'Medium' ? 'text-status-warning bg-status-warning/10' : 'text-tertiary bg-tertiary/10'}`}>
          {rec.level} · {rec.type}
        </span>
        <span className="material-symbols-outlined text-text-muted text-[18px]">
          {rec.type === 'DSA' ? 'account_tree' : rec.type === 'System Design' ? 'dns' : 'memory'}
        </span>
      </div>
      <h3 className="font-title-card text-title-card text-text-primary">{rec.title}</h3>
      <div className="p-2.5 rounded-lg bg-surface-container text-xs text-text-secondary space-y-1">
        <p>{rec.description}</p>
      </div>
    </div>
    <button className="w-full py-2 rounded-lg bg-surface-container hover:bg-surface-active text-text-primary font-body-bold text-body-bold text-xs transition-colors flex items-center justify-center gap-1.5">
      <span>{rec.action}</span>
      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
    </button>
  </div>
))}
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
{(() => {
  const getCy = (score: number) => Math.max(0, Math.min(180, (100 - score) * 3));
  const trend = stats?.trend || [0, 0, 0, 0, 0, 0];
  // Calculate CY for each week
  const p1 = getCy(trend[0] || 0);
  const p2 = getCy(trend[1] || 0);
  const p3 = getCy(trend[2] || 0);
  const p4 = getCy(trend[3] || 0);
  const p5 = getCy(trend[4] || 0);
  const p6 = getCy(trend[5] || 0);
  
  const polyPoints = `20,${p1} 116,${p2} 212,${p3} 308,${p4} 404,${p5} 500,${p6}`;
  const fillPoints = `${polyPoints} 500,180 20,180`;
  
  return (
    <svg className="w-full h-44 overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 500 180">
    <defs>
    <linearGradient id="scoreTrendGradient" x1="0%" x2="0%" y1="0%" y2="100%">
    <stop offset="0%" stopColor="#448ffd" stopOpacity="0.35"></stop>
    <stop offset="100%" stopColor="#448ffd" stopOpacity="0.0"></stop>
    </linearGradient>
    </defs>
    <line opacity="0.8" stroke="#F59E0B" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="500" y1="75" y2="75"></line>
    <polygon fill="url(#scoreTrendGradient)" points={fillPoints}></polygon>
    <polyline fill="none" points={polyPoints} stroke="#448ffd" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></polyline>
    <circle className="fill-surface-elevated stroke-primary-container" cx="20" cy={p1} r="4" strokeWidth="2"></circle>
    <circle className="fill-surface-elevated stroke-primary-container" cx="116" cy={p2} r="4" strokeWidth="2"></circle>
    <circle className="fill-surface-elevated stroke-primary-container" cx="212" cy={p3} r="4" strokeWidth="2"></circle>
    <circle className="fill-surface-elevated stroke-primary-container" cx="308" cy={p4} r="4" strokeWidth="2"></circle>
    <circle className="fill-surface-elevated stroke-primary-container" cx="404" cy={p5} r="4" strokeWidth="2"></circle>
    <circle className="fill-primary-container stroke-text-primary" cx="500" cy={p6} r="5" strokeWidth="2"></circle>
    </svg>
  );
})()}
<div className="flex justify-between items-center text-text-muted font-code-base text-[11px] pt-2 z-10">
<span>W-5 ({stats?.trend?.[0] || 0})</span>
<span>W-4 ({stats?.trend?.[1] || 0})</span>
<span>W-3 ({stats?.trend?.[2] || 0})</span>
<span>W-2 ({stats?.trend?.[3] || 0})</span>
<span>W-1 ({stats?.trend?.[4] || 0})</span>
<span className="text-text-primary font-code-bold">Current ({stats?.trend?.[5] || 0})</span>
</div>
</div>
<div className="bg-surface-container rounded-lg p-3 flex items-center justify-between font-metadata-sm text-metadata-sm">
{(() => {
  const current = stats?.trend?.[5] || 0;
  const prev = stats?.trend?.[4] || 0;
  const diff = current - prev;
  if (current >= 75) {
    return (
      <>
        <span className="text-text-secondary">Summary Insight: Velocity pace qualifies for L5 mock sign-off.</span>
        <span className="font-code-bold text-status-success">{diff >= 0 ? '+' : ''}{diff} pts over last sprint</span>
      </>
    );
  } else {
    return (
      <>
        <span className="text-text-secondary">Summary Insight: Keep practicing to reach the L5 target.</span>
        <span className={`font-code-bold ${diff >= 0 ? 'text-status-success' : 'text-status-error'}`}>{diff >= 0 ? '+' : ''}{diff} pts over last sprint</span>
      </>
    );
  }
})()}
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
<span className="font-code-bold text-text-primary">{stats?.skills?.dsa || 0} / 100</span>
<span className="text-status-success font-badge-caps text-badge-caps uppercase">{(stats?.skills?.dsa || 0) >= 75 ? 'Proficient' : 'Needs Practice'}</span>
</div>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-status-success h-full rounded-full" style={{ width: `${stats?.skills?.dsa || 0}%` }}></div>
</div>
</div>
<div className="space-y-1">
<div className="flex items-center justify-between font-metadata-sm text-metadata-sm">
<span className="text-text-primary font-body-bold">System Design</span>
<div className="flex items-center gap-2">
<span className="font-code-bold text-text-primary">{stats?.skills?.systemDesign || 0} / 100</span>
<span className="text-status-warning font-badge-caps text-badge-caps uppercase">{(stats?.skills?.systemDesign || 0) >= 75 ? 'Solid' : 'Needs Practice'}</span>
</div>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-status-warning h-full rounded-full" style={{ width: `${stats?.skills?.systemDesign || 0}%` }}></div>
</div>
</div>
<div className="space-y-1">
<div className="flex items-center justify-between font-metadata-sm text-metadata-sm">
<span className="text-text-primary font-body-bold">OS &amp; Concurrency</span>
<div className="flex items-center gap-2">
<span className="font-code-bold text-text-primary">{stats?.skills?.os || 0} / 100</span>
<span className="text-tertiary font-badge-caps text-badge-caps uppercase">{(stats?.skills?.os || 0) >= 75 ? 'Solid' : 'Needs Practice'}</span>
</div>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-tertiary h-full rounded-full" style={{ width: `${stats?.skills?.os || 0}%` }}></div>
</div>
</div>
<div className="space-y-1">
<div className="flex items-center justify-between font-metadata-sm text-metadata-sm">
<span className="text-text-primary font-body-bold">DBMS &amp; Storage</span>
<div className="flex items-center gap-2">
<span className="font-code-bold text-text-primary">{stats?.skills?.dbms || 0} / 100</span>
<span className="text-status-success font-badge-caps text-badge-caps uppercase">{(stats?.skills?.dbms || 0) >= 75 ? 'Strong' : 'Needs Practice'}</span>
</div>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-status-success h-full rounded-full" style={{ width: `${stats?.skills?.dbms || 0}%` }}></div>
</div>
</div>
<div className="space-y-1">
<div className="flex items-center justify-between font-metadata-sm text-metadata-sm">
<span className="text-text-primary font-body-bold">Computer Networks</span>
<div className="flex items-center gap-2">
<span className="font-code-bold text-text-primary">{stats?.skills?.networks || 0} / 100</span>
<span className="text-text-muted font-badge-caps text-badge-caps uppercase">{(stats?.skills?.networks || 0) >= 75 ? 'Good' : 'Average'}</span>
</div>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-text-secondary h-full rounded-full" style={{ width: `${stats?.skills?.networks || 0}%` }}></div>
</div>
</div>
<div className="space-y-1">
<div className="flex items-center justify-between font-metadata-sm text-metadata-sm">
<span className="text-text-primary font-body-bold">Behavioral &amp; Communication</span>
<div className="flex items-center gap-2">
<span className="font-code-bold text-text-primary">{stats?.skills?.behavioral || 0} / 100</span>
<span className="text-primary font-badge-caps text-badge-caps uppercase">{(stats?.skills?.behavioral || 0) >= 75 ? 'Good' : 'Average'}</span>
</div>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{ width: `${stats?.skills?.behavioral || 0}%` }}></div>
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
