import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="w-full bg-surface-base text-text-primary min-h-screen">
      <header className="fixed top-0 inset-x-0 z-50 bg-surface-base/90 backdrop-blur-xl border-b border-border-hairline shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="h-16 max-w-7xl mx-auto px-margin-desktop flex items-center justify-between gap-gutter"><div className="flex items-center gap-space-lg"><Link className="flex items-center gap-space-sm group focus:outline-none"  to="/explore"><img alt="Intervue Brand Logo" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1X6TX55uj4eURsKjAYl0ZyWhVrYzOTS9-G-tUJdtX_D7WdujB9Hg5ZliPxjblxMoIa2WN9e-y9NfF8j03QRM-3hzW-3pk4DE_R8m8G7MR3cFk9lNpSr2vGlvMSm55Uf0HUYJ6AyElRpZhLok5kN8JHypjvxfaRxjxH7b2e_QF8GKYJeJxG_L9NZ7H9C8bwOHAF_jSq-ibIQKstBFar-4ecpcfyUcBpTzWF95BN6RkRFlJ-rD6cxKUx21EM"/><span className="font-headline-section text-headline-section text-text-primary tracking-tight">Intervue</span></Link><nav className="hidden xl:flex items-center gap-space-xs" data-active-classes="bg-surface-container text-text-primary font-body-bold rounded-lg"><div className="relative group"><button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-text-primary hover:bg-surface-hover font-body-base text-body-base transition-colors" type="button"><span>Practice</span><span className="material-symbols-outlined text-[16px] text-text-muted transition-transform group-hover:rotate-180">expand_more</span></button><div className="absolute top-full left-0 pt-space-xs hidden group-hover:block z-50"><div className="w-56 py-space-xs bg-surface-elevated border border-border-hairline rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col"><Link className="px-space-md py-2 font-body-base text-body-base text-on-surface-variant hover:text-text-primary hover:bg-surface-hover transition-colors"  to="/ai-interview">AI Interview</Link><Link className="px-space-md py-2 font-body-base text-body-base text-on-surface-variant hover:text-text-primary hover:bg-surface-hover transition-colors"  to="/voice-interview">Voice Interview</Link><Link className="px-space-md py-2 font-body-base text-body-base text-on-surface-variant hover:text-text-primary hover:bg-surface-hover transition-colors"  to="/technical-prep">Technical</Link><Link className="px-space-md py-2 font-body-base text-body-base text-on-surface-variant hover:text-text-primary hover:bg-surface-hover transition-colors"  to="/behavioral-prep">Behavioral</Link></div></div></div><Link className="px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-text-primary hover:bg-surface-hover font-body-base text-body-base transition-colors"  to="/coding">Coding</Link><Link className="px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-text-primary hover:bg-surface-hover font-body-base text-body-base transition-colors"  to="/system-design">System Design</Link><Link className="px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-text-primary hover:bg-surface-hover font-body-base text-body-base transition-colors"  to="/company-tracks">Companies</Link><Link className="px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-text-primary hover:bg-surface-hover font-body-base text-body-base transition-colors"  to="/rooms">Rooms</Link></nav></div><div className="flex items-center gap-space-sm"><Link className="hidden sm:inline-flex items-center justify-center px-4 py-2 font-body-bold text-body-bold text-on-surface-variant hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"  to="/login">Sign In</Link><Link className="inline-flex items-center justify-center px-4 py-2 bg-primary-container hover:bg-primary text-on-primary-container font-title-card text-title-card rounded-lg transition-colors shadow-sm"  to="/login">Get Started</Link><div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-on-primary text-[18px]">person</span></div></div></div></header>
      <main className="w-full pt-16 bg-surface-base min-h-screen"><div className="flex flex-col w-full text-text-primary">

<section className="relative w-full max-w-7xl mx-auto px-margin-desktop pt-12 pb-16 flex flex-col items-center text-center overflow-hidden">
<div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
<div className="absolute top-24 left-1/3 -translate-x-1/2 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>

<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high/70 backdrop-blur-md mb-6 shadow-sm">
<span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
<span className="font-badge-caps text-badge-caps uppercase tracking-wider text-secondary">AI-Powered Interview Preparation</span>
<span className="font-metadata-sm text-metadata-sm text-text-muted">·</span>
<span className="font-metadata-sm text-metadata-sm text-text-secondary">v2.4 Cockpit Live</span>
</div>

<h1 className="font-display-hero text-display-hero text-text-primary tracking-tight max-w-4xl mx-auto leading-tight mb-5">
      Practice like it's the real interview.
    </h1>

<p className="font-body-bold text-body-bold text-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
      AI-powered technical interviews, coding practice, system design, and personalized feedback built for software engineers targeting top-tier teams.
    </p>

<div className="flex flex-wrap items-center justify-center gap-space-sm mb-4">
<Link className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-container hover:bg-primary text-on-primary-container font-title-card text-title-card rounded-xl transition-all shadow-md"  to="/login">
<span>Start Practicing Free</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</Link>
<a className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-elevated hover:bg-surface-hover text-text-primary font-title-card text-title-card rounded-xl transition-all shadow-sm" href="#ecosystem">
<span className="material-symbols-outlined text-[18px] text-text-secondary">explore</span>
<span>Explore Platform</span>
</a>
</div>
<p className="font-metadata-sm text-metadata-sm text-text-muted flex items-center justify-center gap-2">
<span className="material-symbols-outlined text-[14px] text-status-success">check_circle</span>
      Free practice tier available · No credit card required · Instant session setup
    </p>

<div className="w-full mt-12 bg-surface-elevated rounded-2xl shadow-xl overflow-hidden text-left">

<div className="bg-surface-container-low px-5 py-3 flex flex-wrap items-center justify-between gap-3">
<div className="flex items-center gap-3">
<div className="flex items-center gap-1.5">
<div className="w-3 h-3 rounded-full bg-surface-container-high"></div>
<div className="w-3 h-3 rounded-full bg-surface-container-high"></div>
<div className="w-3 h-3 rounded-full bg-surface-container-high"></div>
</div>
<div className="h-4 w-px bg-surface-container-high"></div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-secondary">smart_toy</span>
<span className="font-title-card text-title-card text-text-primary">Intervue AI Interview</span>
<span className="font-metadata-sm text-metadata-sm text-text-muted">/</span>
<span className="font-metadata-sm text-metadata-sm text-text-secondary">Backend Architecture &amp; Scale</span>
</div>
</div>
<div className="flex items-center gap-3">
<div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-high text-status-success font-code-bold text-code-bold">
<span className="w-2 h-2 rounded-full bg-status-success animate-ping"></span>
<span>24:18 REMAINING</span>
</div>
<div className="px-2.5 py-1 rounded-md bg-surface-container text-status-warning font-badge-caps text-badge-caps tracking-wider uppercase">
            Medium
          </div>
<div className="px-2.5 py-1 rounded-md bg-surface-container text-text-secondary font-badge-caps text-badge-caps tracking-wider uppercase">
            Turn 03 of 08
          </div>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 bg-surface-base">

<div className="lg:col-span-7 p-6 flex flex-col gap-5 bg-surface-elevated">

<div className="bg-surface-container-lowest p-4 rounded-xl flex gap-3.5">
<div className="w-9 h-9 rounded-lg bg-secondary-container/40 flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-secondary text-[20px]">psychology</span>
</div>
<div className="flex flex-col gap-1.5 flex-1 min-w-0">
<div className="flex items-center justify-between">
<span className="font-body-bold text-body-bold text-secondary">Intervue AI (Staff Evaluator)</span>
<span className="font-metadata-sm text-metadata-sm text-text-muted">14:02:18</span>
</div>
<p className="font-body-base text-body-base text-text-primary leading-relaxed">
                "Design a URL shortening service that can reliably sustain <span className="font-code-bold text-code-bold text-primary">10 million writes/day</span> with sub-50ms p99 read latency. How would you structure your database schema, and where do you introduce your caching hierarchy to handle hotspot keys?"
              </p>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-4 flex flex-col gap-3 shadow-inner">
<div className="flex items-center justify-between pb-2 bg-surface-container-lowest">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-[18px]">terminal</span>
<span className="font-code-bold text-code-bold text-text-secondary">architecture_spec.py</span>
<span className="font-badge-caps text-badge-caps uppercase px-1.5 py-0.5 rounded bg-surface-container-high text-text-muted">Drafting</span>
</div>
<div className="flex items-center gap-2">
<span className="font-metadata-sm text-metadata-sm text-text-muted">Auto-saved 4s ago</span>
<button className="px-2.5 py-1 rounded bg-secondary text-on-secondary font-title-card text-metadata-sm flex items-center gap-1 hover:bg-secondary-fixed transition-colors">
<span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
<span>Synthesize</span>
</button>
</div>
</div>

<pre className="font-code-base text-code-base text-text-primary overflow-x-auto bg-surface-base p-3.5 rounded-lg leading-relaxed"><span className="text-text-muted">1</span>  <span className="text-secondary">class</span> <span className="text-primary">URLCompressorCluster</span>:
<span className="text-text-muted">2</span>      <span className="text-text-secondary"># Redis cluster fronted with LRU eviction for hot links</span>
<span className="text-text-muted">3</span>      cache_layer: RedisCluster = init_distributed_cache(replicas=<span className="text-tertiary">3</span>)
<span className="text-text-muted">4</span>      db_cluster: ShardedPostgres = init_sharded_storage(key=<span className="text-status-warning">"short_hash[0:2]"</span>)
<span className="text-text-muted">5</span>
<span className="text-text-muted">6</span>      <span className="text-secondary">async def</span> <span className="text-primary">resolve_url</span>(self, short_code: <span className="text-primary">str</span>) -&gt; <span className="text-primary">str</span>:
<span className="text-text-muted">7</span>          <span className="text-secondary">if</span> cached := <span className="text-secondary">await</span> self.cache_layer.get(short_code):
<span className="text-text-muted">8</span>              <span className="text-secondary">return</span> cached  <span className="text-text-muted"># &lt;5ms latency via multi-zone replicas</span>
<span className="text-text-muted">9</span>          target = <span className="text-secondary">await</span> self.db_cluster.query_by_hash(short_code)
<span className="text-text-muted">10</span>         <span className="text-secondary">await</span> self.cache_layer.set(short_code, target, ttl=<span className="text-tertiary">86400</span>)
<span className="text-text-muted">11</span>         <span className="text-secondary">return</span> target</pre>
<div className="flex items-center justify-between pt-1">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-status-success"></span>
<span className="font-metadata-sm text-metadata-sm text-text-muted">Voice transcription active: candidate audio synced</span>
</div>
<span className="font-code-bold text-code-bold text-text-secondary text-metadata-sm">11 lines · Python 3.12</span>
</div>
</div>
</div>

<div className="lg:col-span-5 p-6 bg-surface-container-low flex flex-col justify-between gap-6">
<div className="flex flex-col gap-5">
<div className="flex items-center justify-between pb-3 bg-surface-container-low">
<div>
<h3 className="font-title-card text-title-card text-text-primary">Live Evaluation Telemetry</h3>
<p className="font-metadata-sm text-metadata-sm text-text-muted">Adaptive assessment in progress</p>
</div>
<span className="px-2 py-1 rounded bg-secondary-container/60 text-secondary font-code-bold text-code-bold">
                SCORE 81/100
              </span>
</div>

<div className="bg-surface-elevated p-3.5 rounded-xl flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-primary">analytics</span>
<span className="font-body-bold text-body-bold text-text-secondary">Milestone Progress</span>
</div>
<span className="font-code-bold text-code-bold text-text-primary">03 / 08 Topics Complete</span>
</div>

<div className="flex flex-col gap-3.5">
<div>
<div className="flex justify-between items-center mb-1.5 font-metadata-sm text-metadata-sm">
<span className="text-text-secondary">Technical Knowledge</span>
<span className="font-code-bold text-code-bold text-primary">82 / 100</span>
</div>
<div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary rounded-full" style={{ width: '82%' }}></div>
</div>
</div>
<div>
<div className="flex justify-between items-center mb-1.5 font-metadata-sm text-metadata-sm">
<span className="text-text-secondary">Problem Solving &amp; System Decomposition</span>
<span className="font-code-bold text-code-bold text-secondary">74 / 100</span>
</div>
<div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-secondary rounded-full" style={{ width: '74%' }}></div>
</div>
</div>
<div>
<div className="flex justify-between items-center mb-1.5 font-metadata-sm text-metadata-sm">
<span className="text-text-secondary">Communication &amp; Trade-off Articulation</span>
<span className="font-code-bold text-code-bold text-tertiary">80 / 100</span>
</div>
<div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-tertiary rounded-full" style={{ width: '80%' }}></div>
</div>
</div>
</div>

<div className="flex flex-col gap-2 pt-2">
<span className="font-metadata-sm text-metadata-sm text-text-muted uppercase tracking-wider">Detected System Concepts</span>
<div className="flex flex-wrap gap-1.5">
<span className="px-2.5 py-1 rounded bg-surface-container-high text-status-success font-code-bold text-code-bold flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">check</span> Redis In-Memory
                </span>
<span className="px-2.5 py-1 rounded bg-surface-container-high text-status-success font-code-bold text-code-bold flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">check</span> Consistent Hashing
                </span>
<span className="px-2.5 py-1 rounded bg-surface-container-high text-status-warning font-code-bold text-code-bold flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">hourglass_empty</span> Cache Invalidation Strategy
                </span>
<span className="px-2.5 py-1 rounded bg-surface-container-high text-text-muted font-code-bold text-code-bold">
                  Replication Lag Trade-offs
                </span>
</div>
</div>
</div>

<div className="bg-surface-elevated p-3 rounded-lg flex items-center justify-between">
<span className="font-metadata-sm text-metadata-sm text-text-secondary">AI Follow-up Queue Ready</span>
<button className="px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-surface-container text-text-primary font-body-bold text-metadata-sm flex items-center gap-1 transition-colors">
<span>Review Criteria</span>
<span className="material-symbols-outlined text-[16px]">chevron_right</span>
</button>
</div>
</div>
</div>
</div>
</section>

<section className="w-full bg-surface-container-lowest py-8">
<div className="max-w-7xl mx-auto px-margin-desktop">
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
<div className="flex flex-col gap-1 p-4 bg-surface-elevated rounded-xl">
<span className="font-display-hero text-headline-page text-primary font-code-bold">4</span>
<span className="font-body-bold text-body-bold text-text-primary">Practice Modes</span>
<p className="font-metadata-sm text-metadata-sm text-text-muted">AI, Voice, Monaco DSA, Architecture Studio</p>
</div>
<div className="flex flex-col gap-1 p-4 bg-surface-elevated rounded-xl">
<span className="font-display-hero text-headline-page text-secondary font-code-bold">12+</span>
<span className="font-body-bold text-body-bold text-text-primary">Interview Roles</span>
<p className="font-metadata-sm text-metadata-sm text-text-muted">Backend, Frontend, Distributed Systems, ML</p>
</div>
<div className="flex flex-col gap-1 p-4 bg-surface-elevated rounded-xl">
<span className="font-display-hero text-headline-page text-tertiary font-code-bold">Zero-Waste</span>
<span className="font-body-bold text-body-bold text-text-primary">Feedback Loop</span>
<p className="font-metadata-sm text-metadata-sm text-text-muted">Actionable diagnostic scorecards on submission</p>
</div>
<div className="flex flex-col gap-1 p-4 bg-surface-elevated rounded-xl">
<span className="font-display-hero text-headline-page text-status-success font-code-bold">Monaco</span>
<span className="font-body-bold text-body-bold text-text-primary">Engineered Workspace</span>
<p className="font-metadata-sm text-metadata-sm text-text-muted">Real runtime execution with 20+ edge test suites</p>
</div>
</div>
</div>
</section>

<section className="w-full max-w-7xl mx-auto px-margin-desktop py-20 flex flex-col gap-12" id="ecosystem">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container-high text-primary font-badge-caps text-badge-caps uppercase tracking-wider mb-2">
          Integrated Tooling
        </div>
<h2 className="font-headline-page text-headline-page text-text-primary tracking-tight">
          One platform. Your entire interview preparation.
        </h2>
</div>
<p className="font-body-base text-body-base text-text-secondary max-w-md">
        Replace disjointed tools, video recordings, and unmaintained spreadsheets with a cohesive, telemetry-driven assessment environment.
      </p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 hover:bg-surface-hover transition-colors">
<div className="flex flex-col gap-4">
<div className="w-12 h-12 rounded-xl bg-secondary-container/40 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[24px]">psychology</span>
</div>
<h3 className="font-headline-section text-headline-section text-text-primary">AI Technical Interviews</h3>
<p className="font-body-base text-body-base text-text-secondary leading-relaxed">
            Multi-turn technical questioning that challenges your architectural decisions, questions edge cases, and adjusts complexity dynamically in response to your answers.
          </p>
</div>
<div className="p-3 bg-surface-container-lowest rounded-xl font-code-base text-code-base text-text-muted flex items-center justify-between">
<span>&gt; dynamic_depth: True</span>
<span className="text-secondary font-code-bold">Auto-adapting</span>
</div>
</div>

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 hover:bg-surface-hover transition-colors">
<div className="flex flex-col gap-4">
<div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[24px]">mic</span>
</div>
<h3 className="font-headline-section text-headline-section text-text-primary">Voice Interviews</h3>
<p className="font-body-base text-body-base text-text-secondary leading-relaxed">
            Replicate high-stakes behavioral and technical phone screens. Practice structuring live thoughts out loud with instantaneous conversational latency under 600ms.
          </p>
</div>
<div className="p-3 bg-surface-container-lowest rounded-xl flex items-center justify-between">

<div className="flex items-center gap-1 h-5">
<span className="w-1 h-2 bg-primary rounded-full animate-bounce"></span>
<span className="w-1 h-4 bg-primary rounded-full animate-bounce delay-75"></span>
<span className="w-1 h-5 bg-primary rounded-full animate-bounce delay-150"></span>
<span className="w-1 h-3 bg-primary rounded-full animate-bounce"></span>
<span className="w-1 h-4 bg-primary rounded-full animate-bounce delay-100"></span>
</div>
<span className="font-metadata-sm text-metadata-sm text-text-secondary">Low-latency Whisper Engine</span>
</div>
</div>

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 hover:bg-surface-hover transition-colors">
<div className="flex flex-col gap-4">
<div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined text-[24px]">code</span>
</div>
<h3 className="font-headline-section text-headline-section text-text-primary">Developer Coding IDE</h3>
<p className="font-body-base text-body-base text-text-secondary leading-relaxed">
            Production-grade Monaco editor supporting Python, Go, Java, and C++ with real unit test execution, memory profiling, and edge test generation.
          </p>
</div>
<div className="p-3 bg-surface-container-lowest rounded-xl font-code-bold text-code-bold text-status-success flex items-center justify-between">
<span>ALL TESTS PASS (14/14)</span>
<span className="text-text-muted font-code-base">12ms · 14.2MB</span>
</div>
</div>

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 hover:bg-surface-hover transition-colors">
<div className="flex flex-col gap-4">
<div className="w-12 h-12 rounded-xl bg-tertiary-container/30 flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined text-[24px]">account_tree</span>
</div>
<h3 className="font-headline-section text-headline-section text-text-primary">System Design Studio</h3>
<p className="font-body-base text-body-base text-text-secondary leading-relaxed">
            Architect end-to-end distributed infrastructure using interactive node components: load balancers, write-ahead logs, sharded caches, and event buses.
          </p>
</div>
<div className="p-3 bg-surface-container-lowest rounded-xl flex items-center justify-between text-text-secondary font-metadata-sm">
<span>Throughput: 50k QPS</span>
<span className="text-status-success font-code-bold">99.99% Availability</span>
</div>
</div>

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 hover:bg-surface-hover transition-colors">
<div className="flex flex-col gap-4">
<div className="w-12 h-12 rounded-xl bg-secondary-container/30 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[24px]">assistant</span>
</div>
<h3 className="font-headline-section text-headline-section text-text-primary">On-Demand AI Coach</h3>
<p className="font-body-base text-body-base text-text-secondary leading-relaxed">
            Stuck in an algorithmic rut? Ask for subtle conceptual hints without spoiling the entire solution. Master alternative time and space complexity approaches.
          </p>
</div>
<div className="p-3 bg-surface-container-lowest rounded-xl font-metadata-sm text-metadata-sm text-secondary flex items-center gap-2">
<span className="material-symbols-outlined text-[16px]">tips_and_updates</span>
<span>"Consider an invariant pointer approach..."</span>
</div>
</div>

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 hover:bg-surface-hover transition-colors">
<div className="flex flex-col gap-4">
<div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[24px]">query_stats</span>
</div>
<h3 className="font-headline-section text-headline-section text-text-primary">Diagnostic Scorecards</h3>
<p className="font-body-base text-body-base text-text-secondary leading-relaxed">
            Granular post-interview assessments breaking down code structure, computational tradeoffs, and precision communication with drill-down recommendations.
          </p>
</div>
<div className="p-3 bg-surface-container-lowest rounded-xl flex items-center justify-between font-code-bold text-code-bold text-text-primary">
<span>READINESS INDEX</span>
<span className="text-primary font-headline-section">94%</span>
</div>
</div>
</div>
</section>

<section className="w-full bg-surface-container-lowest py-20">
<div className="max-w-7xl mx-auto px-margin-desktop flex flex-col gap-12">
<div className="text-center max-w-2xl mx-auto">
<span className="font-badge-caps text-badge-caps uppercase tracking-wider text-secondary mb-2 block">Specialized Workflows</span>
<h2 className="font-headline-page text-headline-page text-text-primary tracking-tight mb-4">
          Choose how you want to practice.
        </h2>
<p className="font-body-base text-body-base text-text-secondary">
          Every interview stage has a different cognitive requirement. Intervue provides a purpose-built workspace for each.
        </p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 group hover:bg-surface-hover transition-all">
<div className="flex flex-col gap-4">
<div className="w-12 h-12 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
<span className="material-symbols-outlined text-[24px]">auto_awesome</span>
</div>
<h3 className="font-headline-section text-headline-section text-text-primary">AI Interview</h3>
<p className="font-body-base text-body-base text-text-secondary">
              Simulated Staff+ engineer dialogue with adaptive cross-examination on real production problem spaces.
            </p>
</div>
<Link className="w-full py-2.5 px-4 rounded-xl bg-secondary text-on-secondary font-title-card text-title-card text-center transition-transform active:translate-y-px"  to="/ai-interview">
            Start Interview
          </Link>
</div>

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 group hover:bg-surface-hover transition-all">
<div className="flex flex-col gap-4">
<div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[24px]">graphic_eq</span>
</div>
<h3 className="font-headline-section text-headline-section text-text-primary">Voice Interview</h3>
<p className="font-body-base text-body-base text-text-secondary">
              Verbal communication mastery. Train yourself to speak through technical constraints and algorithmic designs.
            </p>
</div>
<Link className="w-full py-2.5 px-4 rounded-xl bg-primary-container text-on-primary-container font-title-card text-title-card text-center hover:bg-primary transition-transform active:translate-y-px"  to="/voice-interview">
            Practice Voice
          </Link>
</div>

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 group hover:bg-surface-hover transition-all">
<div className="flex flex-col gap-4">
<div className="w-12 h-12 rounded-xl bg-surface-container-high text-tertiary flex items-center justify-center">
<span className="material-symbols-outlined text-[24px]">data_object</span>
</div>
<h3 className="font-headline-section text-headline-section text-text-primary">DSA Coding</h3>
<p className="font-body-base text-body-base text-text-secondary">
              Curated LeetCode-style catalog featuring top company frequencies and instant test case execution feedback.
            </p>
</div>
<Link className="w-full py-2.5 px-4 rounded-xl bg-surface-container-high hover:bg-surface-bright text-text-primary font-title-card text-title-card text-center transition-transform active:translate-y-px"  to="/coding">
            Solve Problems
          </Link>
</div>

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 group hover:bg-surface-hover transition-all">
<div className="flex flex-col gap-4">
<div className="w-12 h-12 rounded-xl bg-status-warning/15 text-status-warning flex items-center justify-center">
<span className="material-symbols-outlined text-[24px]">hub</span>
</div>
<h3 className="font-headline-section text-headline-section text-text-primary">System Design</h3>
<p className="font-body-base text-body-base text-text-secondary">
              Architecture sandbox for designing high-throughput feeds, messaging queues, and global storage rings.
            </p>
</div>
<Link className="w-full py-2.5 px-4 rounded-xl bg-surface-container-high hover:bg-surface-bright text-text-primary font-title-card text-title-card text-center transition-transform active:translate-y-px"  to="/system-design">
            Practice Architecture
          </Link>
</div>
</div>
</div>
</section>

<section className="w-full max-w-7xl mx-auto px-margin-desktop py-20 flex flex-col items-center gap-12">
<div className="text-center max-w-2xl">
<span className="font-badge-caps text-badge-caps uppercase tracking-wider text-primary mb-2 block">Iterative Mastery</span>
<h2 className="font-headline-page text-headline-page text-text-primary tracking-tight mb-4">
        The Continuous Improvement Loop
      </h2>
<p className="font-body-base text-body-base text-text-secondary">
        Preparation without feedback is just repetitive guessing. Intervue transforms every mock session into targeted drill routines.
      </p>
</div>

<div className="w-full bg-surface-elevated p-8 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4">

<div className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-surface-base w-full lg:w-48 shadow-sm">
<span className="w-8 h-8 rounded-full bg-primary/20 text-primary font-code-bold text-code-bold flex items-center justify-center">01</span>
<span className="font-body-bold text-body-bold text-text-primary">Live Mock Session</span>
<span className="font-metadata-sm text-metadata-sm text-text-muted">45-min realistic simulation</span>
</div>
<span className="material-symbols-outlined text-text-muted rotate-90 lg:rotate-0">arrow_forward</span>

<div className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-surface-base w-full lg:w-48 shadow-sm">
<span className="w-8 h-8 rounded-full bg-secondary/20 text-secondary font-code-bold text-code-bold flex items-center justify-center">02</span>
<span className="font-body-bold text-body-bold text-text-primary">AI Evaluation</span>
<span className="font-metadata-sm text-metadata-sm text-text-muted">Multi-dimension scoring</span>
</div>
<span className="material-symbols-outlined text-text-muted rotate-90 lg:rotate-0">arrow_forward</span>

<div className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-surface-base w-full lg:w-48 shadow-sm">
<span className="w-8 h-8 rounded-full bg-tertiary/20 text-tertiary font-code-bold text-code-bold flex items-center justify-center">03</span>
<span className="font-body-bold text-body-bold text-text-primary">Gaps Detected</span>
<span className="font-metadata-sm text-metadata-sm text-text-muted">Exact blindspot mapping</span>
</div>
<span className="material-symbols-outlined text-text-muted rotate-90 lg:rotate-0">arrow_forward</span>

<div className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-surface-base w-full lg:w-48 shadow-sm">
<span className="w-8 h-8 rounded-full bg-status-warning/20 text-status-warning font-code-bold text-code-bold flex items-center justify-center">04</span>
<span className="font-body-bold text-body-bold text-text-primary">Targeted Drill</span>
<span className="font-metadata-sm text-metadata-sm text-text-muted">Curated weak area sets</span>
</div>
<span className="material-symbols-outlined text-text-muted rotate-90 lg:rotate-0">arrow_forward</span>

<div className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-surface-base w-full lg:w-48 shadow-sm">
<span className="w-8 h-8 rounded-full bg-status-success/20 text-status-success font-code-bold text-code-bold flex items-center justify-center">05</span>
<span className="font-body-bold text-body-bold text-text-primary">Readiness Up</span>
<span className="font-metadata-sm text-metadata-sm text-text-muted">Compounded confidence</span>
</div>
</div>
</section>

<section className="w-full bg-surface-container-lowest py-20">
<div className="max-w-7xl mx-auto px-margin-desktop flex flex-col gap-12">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<span className="font-badge-caps text-badge-caps uppercase tracking-wider text-secondary mb-2 block">Curated Target Tracks</span>
<h2 className="font-headline-page text-headline-page text-text-primary tracking-tight">
            Prepare for the companies you're targeting.
          </h2>
</div>
<p className="font-body-base text-body-base text-text-secondary max-w-md">
          Structured playbooks mapped to internal rubrics, behavioral expectations, and favorite problem archetypes.
        </p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 hover:bg-surface-hover transition-colors">
<div className="flex flex-col gap-4">
<div className="flex items-center justify-between">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center font-code-bold text-code-bold text-text-primary">
                AMZN
              </div>
<span className="font-metadata-sm text-metadata-sm px-2.5 py-0.5 rounded bg-surface-container text-text-secondary">LP Focus: High</span>
</div>
<div>
<h3 className="font-headline-section text-headline-section text-text-primary">Amazon Track</h3>
<p className="font-body-base text-body-base text-text-secondary mt-1">
                Deep emphasis on Leadership Principles, system operational excellence, and distributed cache partitioning.
              </p>
</div>
<div className="flex flex-wrap gap-1.5 pt-2">
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">16 Leadership Principles</span>
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">DynamoDB Design</span>
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">O(1) Caching</span>
</div>
</div>
<Link className="font-title-card text-title-card text-primary flex items-center gap-1 hover:text-primary-fixed"  to="/company-tracks">
<span>Explore Amazon Syllabus</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</Link>
</div>

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 hover:bg-surface-hover transition-colors">
<div className="flex flex-col gap-4">
<div className="flex items-center justify-between">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center font-code-bold text-code-bold text-primary">
                GOOG
              </div>
<span className="font-metadata-sm text-metadata-sm px-2.5 py-0.5 rounded bg-surface-container text-text-secondary">Algorithms: Hard</span>
</div>
<div>
<h3 className="font-headline-section text-headline-section text-text-primary">Google Track</h3>
<p className="font-body-base text-body-base text-text-secondary mt-1">
                Unconventional graph traversal, dynamic programming optimizations, and petabyte-scale streaming pipelines.
              </p>
</div>
<div className="flex flex-wrap gap-1.5 pt-2">
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">B-Tree Internals</span>
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">Topological Sort</span>
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">MapReduce Theory</span>
</div>
</div>
<Link className="font-title-card text-title-card text-primary flex items-center gap-1 hover:text-primary-fixed"  to="/company-tracks">
<span>Explore Google Syllabus</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</Link>
</div>

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 hover:bg-surface-hover transition-colors">
<div className="flex flex-col gap-4">
<div className="flex items-center justify-between">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center font-code-bold text-code-bold text-tertiary">
                MSFT
              </div>
<span className="font-metadata-sm text-metadata-sm px-2.5 py-0.5 rounded bg-surface-container text-text-secondary">Maintainability: 95%</span>
</div>
<div>
<h3 className="font-headline-section text-headline-section text-text-primary">Microsoft Track</h3>
<p className="font-body-base text-body-base text-text-secondary mt-1">
                Object-oriented design patterns, enterprise scale REST/gRPC interfaces, and solid multithreading primitives.
              </p>
</div>
<div className="flex flex-wrap gap-1.5 pt-2">
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">Clean OOP Structure</span>
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">Concurrency Safe</span>
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">Azure Edge Caching</span>
</div>
</div>
<Link className="font-title-card text-title-card text-primary flex items-center gap-1 hover:text-primary-fixed"  to="/company-tracks">
<span>Explore Microsoft Syllabus</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</Link>
</div>

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 hover:bg-surface-hover transition-colors">
<div className="flex flex-col gap-4">
<div className="flex items-center justify-between">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center font-code-bold text-code-bold text-primary">
                META
              </div>
<span className="font-metadata-sm text-metadata-sm px-2.5 py-0.5 rounded bg-surface-container text-status-warning">Speed &amp; Accuracy</span>
</div>
<div>
<h3 className="font-headline-section text-headline-section text-text-primary">Meta Track</h3>
<p className="font-body-base text-body-base text-text-secondary mt-1">
                High-speed dual problem sessions (2 medium/hard in 40 mins) plus massive social graph partition design.
              </p>
</div>
<div className="flex flex-wrap gap-1.5 pt-2">
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">20-Min Fast DSA</span>
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">TAO Sharding</span>
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">Live Newsfeed Fanout</span>
</div>
</div>
<Link className="font-title-card text-title-card text-primary flex items-center gap-1 hover:text-primary-fixed"  to="/company-tracks">
<span>Explore Meta Syllabus</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</Link>
</div>

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 hover:bg-surface-hover transition-colors">
<div className="flex flex-col gap-4">
<div className="flex items-center justify-between">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center font-code-bold text-code-bold text-text-primary">
                UBER
              </div>
<span className="font-metadata-sm text-metadata-sm px-2.5 py-0.5 rounded bg-surface-container text-text-secondary">Geospatial</span>
</div>
<div>
<h3 className="font-headline-section text-headline-section text-text-primary">Uber Track</h3>
<p className="font-body-base text-body-base text-text-secondary mt-1">
                Real-time geospatial indexing, marketplace matching algorithms, and ultra-high availability dispatch engines.
              </p>
</div>
<div className="flex flex-wrap gap-1.5 pt-2">
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">H3 Hexagonal Spatial</span>
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">Kafka Streaming</span>
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">Ringpop Gossip</span>
</div>
</div>
<Link className="font-title-card text-title-card text-primary flex items-center gap-1 hover:text-primary-fixed"  to="/company-tracks">
<span>Explore Uber Syllabus</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</Link>
</div>

<div className="bg-surface-elevated p-6 rounded-2xl flex flex-col justify-between gap-6 hover:bg-surface-hover transition-colors">
<div className="flex flex-col gap-4">
<div className="flex items-center justify-between">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center font-code-bold text-code-bold text-secondary">
                STRP
              </div>
<span className="font-metadata-sm text-metadata-sm px-2.5 py-0.5 rounded bg-surface-container text-text-secondary">Practical Code</span>
</div>
<div>
<h3 className="font-headline-section text-headline-section text-text-primary">Stripe Track</h3>
<p className="font-body-base text-body-base text-text-secondary mt-1">
                Refactoring messy legacy codebases, idempotency in distributed ledgers, and rock-solid API versioning.
              </p>
</div>
<div className="flex flex-wrap gap-1.5 pt-2">
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">Idempotency Keys</span>
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">Ledger Concurrency</span>
<span className="px-2 py-1 rounded bg-surface-container-high text-text-secondary font-badge-caps text-badge-caps">Bug Isolation</span>
</div>
</div>
<Link className="font-title-card text-title-card text-primary flex items-center gap-1 hover:text-primary-fixed"  to="/company-tracks">
<span>Explore Stripe Syllabus</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</Link>
</div>
</div>
</div>
</section>

<section className="w-full max-w-7xl mx-auto px-margin-desktop py-20 flex flex-col gap-12">
<div className="text-center max-w-2xl mx-auto">
<span className="font-badge-caps text-badge-caps uppercase tracking-wider text-primary mb-2 block">Engineered Environments</span>
<h2 className="font-headline-page text-headline-page text-text-primary tracking-tight mb-4">
        Zero latency. Built to match actual assessment tools.
      </h2>
<p className="font-body-base text-body-base text-text-secondary">
        We built genuine developer workspaces rather than mock forms. Test against custom inputs, inspect memory allocations, and simulate node partition failures.
      </p>
</div>
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

<div className="bg-surface-elevated rounded-2xl overflow-hidden shadow-xl flex flex-col">
<div className="bg-surface-container-low px-4 py-3 flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="w-3 h-3 rounded-full bg-status-error/60"></span>
<span className="w-3 h-3 rounded-full bg-status-warning/60"></span>
<span className="w-3 h-3 rounded-full bg-status-success/60"></span>
<span className="ml-2 font-code-bold text-code-bold text-text-primary">146. LRU Cache (C++20)</span>
</div>
<span className="px-2 py-0.5 rounded bg-status-warning/20 text-status-warning font-badge-caps text-badge-caps uppercase">Medium</span>
</div>
<div className="p-4 bg-surface-base font-code-base text-code-base flex-1 overflow-x-auto leading-relaxed">
<p className="text-text-muted mb-2">// O(1) get and put implementation using std::list and unordered_map</p>
<pre className="text-text-primary"><span className="text-secondary">class</span> <span className="text-primary">LRUCache</span> {"{"}
    <span className="text-secondary">int</span> capacity;
    <span className="text-tertiary">std::list</span>&lt;<span className="text-secondary">int</span>&gt; order;
    <span className="text-tertiary">std::unordered_map</span>&lt;<span className="text-secondary">int</span>, <span className="text-tertiary">std::pair</span>&lt;<span className="text-secondary">int</span>, <span className="text-tertiary">std::list</span>&lt;<span className="text-secondary">int</span>&gt;::<span className="text-secondary">iterator</span>&gt;&gt; cache;

<span className="text-secondary">public</span>:
    <span className="text-primary">LRUCache</span>(<span className="text-secondary">int</span> cap) : capacity(cap) {"{}"}

    <span className="text-secondary">int</span> <span className="text-primary">get</span>(<span className="text-secondary">int</span> key) {"{"}
        <span className="text-secondary">if</span> (cache.find(key) == cache.end()) <span className="text-secondary">return</span> -<span className="text-tertiary">1</span>;
        order.erase(cache[key].second);
        order.push_front(key);
        cache[key].second = order.begin();
        <span className="text-secondary">return</span> cache[key].first;
    {"}"}
{"}"};</pre>
</div>
<div className="bg-surface-container-lowest p-4 flex flex-wrap items-center justify-between gap-3">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-status-success text-[18px]">verified</span>
<span className="font-code-bold text-code-bold text-status-success">18 / 18 Tests Passed</span>
<span className="font-metadata-sm text-metadata-sm text-text-muted">· 48ms runtime (beats 92.4%)</span>
</div>
<button className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-hover text-text-primary font-body-bold text-metadata-sm">
            View Memory Profile
          </button>
</div>
</div>

<div className="bg-surface-elevated rounded-2xl overflow-hidden shadow-xl flex flex-col">
<div className="bg-surface-container-low px-4 py-3 flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-tertiary">hub</span>
<span className="font-title-card text-title-card text-text-primary">Live Canvas: Feed Aggregation Pipeline</span>
</div>
<span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-badge-caps text-badge-caps uppercase">Simulating</span>
</div>

<div className="p-6 bg-surface-base flex-1 flex flex-col justify-center gap-4">
<div className="flex items-center justify-around gap-2">
<div className="p-3 bg-surface-container-high rounded-xl text-center w-28 shadow-sm">
<span className="material-symbols-outlined text-[20px] text-primary">devices</span>
<p className="font-metadata-sm text-metadata-sm text-text-primary mt-1">Clients</p>
<span className="font-badge-caps text-badge-caps text-text-muted">100k Conns</span>
</div>
<span className="material-symbols-outlined text-text-muted">arrow_forward</span>
<div className="p-3 bg-surface-container-high rounded-xl text-center w-32 shadow-sm">
<span className="material-symbols-outlined text-[20px] text-secondary">alt_route</span>
<p className="font-metadata-sm text-metadata-sm text-text-primary mt-1">Envoy Gateway</p>
<span className="font-badge-caps text-badge-caps text-status-success">Rate Limiter</span>
</div>
<span className="material-symbols-outlined text-text-muted">arrow_forward</span>
<div className="p-3 bg-surface-container-high rounded-xl text-center w-32 shadow-sm">
<span className="material-symbols-outlined text-[20px] text-tertiary">memory</span>
<p className="font-metadata-sm text-metadata-sm text-text-primary mt-1">Fanout Cluster</p>
<span className="font-badge-caps text-badge-caps text-text-secondary">Go Workers</span>
</div>
</div>
<div className="flex items-center justify-center gap-6 pt-2">
<div className="p-3 bg-surface-container rounded-xl text-center w-36">
<span className="material-symbols-outlined text-[18px] text-status-warning">database</span>
<p className="font-metadata-sm text-metadata-sm text-text-primary mt-1">Cassandra Cluster</p>
<span className="font-code-bold text-code-bold text-text-muted text-metadata-sm">Writes: 12ms</span>
</div>
<div className="p-3 bg-surface-container rounded-xl text-center w-36">
<span className="material-symbols-outlined text-[18px] text-status-success">cached</span>
<p className="font-metadata-sm text-metadata-sm text-text-primary mt-1">Redis Replicas</p>
<span className="font-code-bold text-code-bold text-text-muted text-metadata-sm">Reads: 2.1ms</span>
</div>
</div>
</div>
<div className="bg-surface-container-lowest p-4 flex flex-wrap items-center justify-between gap-3">
<div className="flex items-center gap-3">
<span className="font-metadata-sm text-metadata-sm text-text-secondary">Scale: <strong className="text-text-primary">2.4M QPS</strong></span>
<span className="font-metadata-sm text-metadata-sm text-text-secondary">p99 Latency: <strong className="text-status-success">18ms</strong></span>
</div>
<button className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-hover text-text-primary font-body-bold text-metadata-sm">
            Inject Partition Failure
          </button>
</div>
</div>
</div>
</section>

<section className="w-full bg-surface-container-lowest py-20">
<div className="max-w-7xl mx-auto px-margin-desktop flex flex-col gap-10">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<span className="font-badge-caps text-badge-caps uppercase tracking-wider text-secondary mb-2 block">Actionable Post-Mortem</span>
<h2 className="font-headline-page text-headline-page text-text-primary tracking-tight">
            Don't just finish the interview. Learn from it.
          </h2>
</div>
<p className="font-body-base text-body-base text-text-secondary max-w-md">
          Receive specific, quote-attributed assessments rather than generic encouraging comments.
        </p>
</div>

<div className="bg-surface-elevated rounded-2xl p-8 shadow-xl flex flex-col gap-8">

<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 bg-surface-elevated">
<div className="flex items-center gap-5">
<div className="w-20 h-20 rounded-2xl bg-surface-base flex flex-col items-center justify-center shadow-inner">
<span className="font-display-hero text-headline-page text-text-primary leading-none">78</span>
<span className="font-badge-caps text-badge-caps text-text-muted">/ 100</span>
</div>
<div>
<div className="flex items-center gap-2">
<h3 className="font-headline-section text-headline-section text-text-primary">L5 Senior Systems Result</h3>
<span className="px-2.5 py-0.5 rounded-full bg-status-success/20 text-status-success font-badge-caps text-badge-caps uppercase">Strong Hire Track</span>
</div>
<p className="font-body-base text-body-base text-text-muted mt-1">Session ID: #IV-84920 · Completed in 42 mins</p>
</div>
</div>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
<div className="bg-surface-base p-3 rounded-xl text-center">
<span className="font-code-bold text-code-bold text-primary block">82%</span>
<span className="font-metadata-sm text-metadata-sm text-text-muted">Problem Solving</span>
</div>
<div className="bg-surface-base p-3 rounded-xl text-center">
<span className="font-code-bold text-code-bold text-secondary block">80%</span>
<span className="font-metadata-sm text-metadata-sm text-text-muted">Tech Depth</span>
</div>
<div className="bg-surface-base p-3 rounded-xl text-center">
<span className="font-code-bold text-code-bold text-tertiary block">74%</span>
<span className="font-metadata-sm text-metadata-sm text-text-muted">Communication</span>
</div>
<div className="bg-surface-base p-3 rounded-xl text-center">
<span className="font-code-bold text-code-bold text-status-warning block">71%</span>
<span className="font-metadata-sm text-metadata-sm text-text-muted">Failure Recovery</span>
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

<div className="bg-surface-base p-6 rounded-xl flex flex-col gap-4">
<div className="flex items-center gap-2 text-status-success">
<span className="material-symbols-outlined text-[20px]">thumb_up</span>
<h4 className="font-title-card text-title-card text-text-primary">Demonstrated Strengths</h4>
</div>
<ul className="flex flex-col gap-3 font-body-base text-body-base text-text-secondary">
<li className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-status-success text-[18px] shrink-0 mt-0.5">check_circle</span>
<span><strong>Strong API Decomposition:</strong> Clearly delineated idempotent write contracts and isolated endpoints for high-throughput batching.</span>
</li>
<li className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-status-success text-[18px] shrink-0 mt-0.5">check_circle</span>
<span><strong>Database Partitioning:</strong> Demonstrated nuanced knowledge of range vs hash sharding on PostgreSQL, predicting hot shards early.</span>
</li>
<li className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-status-success text-[18px] shrink-0 mt-0.5">check_circle</span>
<span><strong>Clarifying Questions:</strong> Verified read-to-write ratios and multi-region failover limits prior to proposing infrastructure components.</span>
</li>
</ul>
</div>

<div className="bg-surface-base p-6 rounded-xl flex flex-col gap-4">
<div className="flex items-center gap-2 text-status-warning">
<span className="material-symbols-outlined text-[20px]">priority_high</span>
<h4 className="font-title-card text-title-card text-text-primary">Target Improvement Areas</h4>
</div>
<ul className="flex flex-col gap-3 font-body-base text-body-base text-text-secondary">
<li className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-status-warning text-[18px] shrink-0 mt-0.5">arrow_forward</span>
<span><strong>Cache Invalidation Nuances:</strong> Relied solely on TTL expiration; interviewer had to prompt for write-through cache eviction mechanisms.</span>
</li>
<li className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-status-warning text-[18px] shrink-0 mt-0.5">arrow_forward</span>
<span><strong>Network Partition Cascades:</strong> Overlooked circuit-breaker patterns when downstream notification workers experienced simulated throttling.</span>
</li>
<li className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-status-warning text-[18px] shrink-0 mt-0.5">arrow_forward</span>
<span><strong>Time Allocation:</strong> Spent 18 minutes on schema design, leaving limited bandwidth for edge failure scenario defenses.</span>
</li>
</ul>
</div>
</div>

<div className="p-4 bg-secondary/10 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-secondary text-[24px]">model_training</span>
<div>
<p className="font-body-bold text-body-bold text-text-primary">Curated drill routine generated for this result</p>
<p className="font-metadata-sm text-metadata-sm text-text-secondary">3 targeted exercises on Cache Invalidation &amp; Circuit Breaking</p>
</div>
</div>
<button className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary font-title-card text-title-card hover:bg-secondary-fixed transition-colors shrink-0">
            Practice Weak Areas
          </button>
</div>
</div>
</div>
</section>

<section className="w-full max-w-7xl mx-auto px-margin-desktop py-24">
<div className="relative w-full bg-surface-elevated rounded-3xl p-10 md:p-16 text-center overflow-hidden shadow-2xl">

<div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none"></div>
<div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-primary/20 rounded-full blur-[90px] pointer-events-none"></div>
<div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6">
<div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary shadow-md">
<span className="material-symbols-outlined text-[28px]">terminal</span>
</div>
<h2 className="font-display-hero text-headline-page md:text-display-hero text-text-primary tracking-tight">
          Your next interview starts here.
        </h2>
<p className="font-body-bold text-body-bold text-text-secondary max-w-lg">
          Practice. Get evaluated. Find your weak areas. Practice again. Join software engineers building true technical interview readiness.
        </p>
<div className="flex flex-wrap items-center justify-center gap-4 mt-2">
<Link className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-container hover:bg-primary text-on-primary-container font-title-card text-title-card rounded-xl transition-all shadow-lg"  to="/login">
<span>Start Practicing Now</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</Link>
<Link className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-surface-container-high hover:bg-surface-bright text-text-primary font-title-card text-title-card rounded-xl transition-all shadow-sm"  to="/company-tracks">
<span>Explore Tracks</span>
</Link>
</div>
<span className="font-metadata-sm text-metadata-sm text-text-muted mt-2">
          No installation required · Runs entirely in modern browsers · Instant AI start
        </span>
</div>
</div>
</section>
</div></main>
    </div>
  );
}
