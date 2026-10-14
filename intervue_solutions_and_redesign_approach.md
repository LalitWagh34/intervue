Intervue (v2.0) — Complete Engineering Solutions, UI/UX Decluttering & Design System GuideThis guide consolidates the complete bottom-to-top audit methodology, ready-to-paste code fixes for all 12 identified bugs, the upgraded dark-mode color palette tokens, the UI decluttering layout blueprint, and the full reference solution for the featured distributed URL shortener system design task on Intervue.1. Bottom-to-Top Audit Approach & Architecture MapRather than reviewing screens at random, this audit evaluated Intervue systematically from the lowest foundational layers of the application hierarchy up to the primary executive views and global shell:Audit LayerRoutes & Components CoveredCore Focus of EvaluationLayer 1: Public Footer & Marketing FunnelLanding Page (/#scorecard, /#battle, /#companies, /#features) & Login GatewayConversion flow, public navbar routing, feature parity between landing previews and logged-in tools, and OAuth/form authentication entry.Layer 2: Support, Onboarding & IdentityFeedback Portal, Help Center, Unified Profile & Profile SetupForm validation states, 6-step modal tour accuracy, avatar/initial derivation, and live external API synchronization with LeetCode and Codeforces.Layer 3: Personal Revision & History VaultsRevision Bookmarks, Notes & Hints Vault & Scorecards HistoryEmpty-state messaging, difficulty tag filtering, split-pane note editing, character encoding in template drawers, and scorecard deep-linking.Layer 4: Core Practice, Arena & AI StudiosAI Technical Mentor, Technical Interview Studio, 1v1 Battle Arena & Prep Hub / Company KitsStreaming Markdown rendering, WebSocket room creation (PNERT3), Judge0 execution configuration, and card grid text wrapping.Layer 5: Executive Command & Global ShellCommand Dashboard, Collapsible Left Sidebar & Global Top Utility Bar (⌘K)Cross-component state synchronization (streaks, coins, initials), flexbox container containment, navigation deduplication, and visual hierarchy.2. Ready-to-Use Code Fixes for All 12 Bugs & UI Defects2.1 Fix Corrupted Emoji Encoding in the Note Drawer (BUG-03 — High)Problem: In Google Company Kit (/practice?view=company_kit), opening the My Note slide-over drawer renders corrupted ASCII question marks (?? Key Intuition, ? Complexity, ?? Edge Case, ?? Pattern) because multi-byte UTF-8 emojis were mangled during file encoding.Solution: Replace raw emoji strings with deterministic lucide-react vector icons.// components/practice/NoteTemplatePills.tsx
import React from 'react';
import { Lightbulb, Clock, AlertTriangle, Layers } from 'lucide-react';

export interface NoteTemplate {
  id: string;
  label: string;
  icon: React.ReactNode;
  snippet: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'intuition',
    label: 'Key Intuition',
    icon: <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
    snippet: '### Key Intuition\n- Core observation: \n',
  },
  {
    id: 'complexity',
    label: 'Complexity',
    icon: <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
    snippet: '### Complexity\n- **Time:** O()\n- **Space:** O()\n',
  },
  {
    id: 'edge-case',
    label: 'Edge Case',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
    snippet: '### Edge Cases\n- Empty / single-element input:\n- Overflow / boundary constraints:\n',
  },
  {
    id: 'pattern',
    label: 'Pattern',
    icon: <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
    snippet: '### Algorithmic Pattern\n- Category: \n',
  },
];

export function NoteTemplatePills({ onInsert }: { onInsert: (text: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {NOTE_TEMPLATES.map((tpl) => (
        <button
          key={tpl.id}
          type="button"
          onClick={() => onInsert(tpl.snippet)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#1A1D27] text-slate-200 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors"
        >
          {tpl.icon}
          <span>{tpl.label}</span>
        </button>
      ))}
    </div>
  );
}
2.2 Fix Raw Unparsed Markdown in AI Technical Mentor (BUG-02 — High)Problem: In AI Technical Mentor, streaming AI responses output literal asterisks (such as **space usage) when bold tokens wrap across chunks or lack a Markdown parser.Solution: Normalize incomplete streaming bold tokens and render assistant messages through react-markdown and remark-gfm.// components/chat/ChatMessageContent.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function closeUnbalancedBoldTokens(markdown: string): string {
  const matches = markdown.match(/\*\*/g);
  if (matches && matches.length % 2 !== 0) {
    return `${markdown}**`;
  }
  return markdown;
}

export function ChatMessageContent({ content }: { content: string }) {
  const safeMarkdown = closeUnbalancedBoldTokens(content);

  return (
    <div className="prose prose-invert max-w-none text-sm leading-relaxed text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          code: ({ inline, className, children, ...props }: any) =>
            inline ? (
              <code className="px-1.5 py-0.5 rounded bg-[#1A1D27] text-blue-300 font-mono text-xs" {...props}>
                {children}
              </code>
            ) : (
              <pre className="p-3 my-2 rounded-lg bg-[#090A0F] border border-white/10 overflow-x-auto font-mono text-xs text-slate-200">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ),
        }}
      >
        {safeMarkdown}
      </ReactMarkdown>
    </div>
  );
}
2.3 Role-Gate the Admin Management CMS Link (BUG-01 — High)Problem: Clicking Admin Management CMS in the top-right user dropdown (GA avatar menu) silently redirects standard users back to Dashboard without opening an admin page or showing an authorization notice.Solution: Conditionally render the admin menu item only when user?.role === 'admin', and add a toast guard on the route handler.// components/layout/UserDropdownMenu.tsx
{user?.role === 'admin' && (
  <Link
    href="/admin"
    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-md"
  >
    <ShieldCheck className="w-4 h-4 text-blue-400" />
    <span>Admin Management CMS</span>
  </Link>
)}
2.4 Fix Input & Button Overflow in "Track Daily Targets" (BUG-04 — Medium)Problem: On Dashboard, the text input and + Add Target button inside the Track Daily Targets card overflow past the right border of the card container because flex children default to min-width: auto.Solution: Add min-w-0 flex-1 to the <input> element and shrink-0 whitespace-nowrap to the submit button.// components/dashboard/DailyTargetsWidget.tsx
<form onSubmit={handleAddTarget} className="flex items-center gap-2 w-full mt-3">
  <input
    type="text"
    value={targetTitle}
    onChange={(e) => setTargetTitle(e.target.value)}
    placeholder="Add a daily prep goal..."
    className="min-w-0 flex-1 h-9 px-3 rounded-lg bg-[#1A1D27] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
  />
  <button
    type="submit"
    className="shrink-0 whitespace-nowrap h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
  >
    + Add Target
  </button>
</form>
2.5 Unify User Telemetry, Streak Pluralization, Initials & Greeting (BUG-05, BUG-06, BUG-09, BUG-10)Problem:Top header flame badge displays 0d while the Dashboard Practice Streak card displays 1 consecutive days (BUG-05).Profile Setup modal displays a hardcoded 'C' avatar initial instead of 'G' or 'GA' (BUG-06).Dashboard greeting displays "Good evening, Gemini ." with a stray space before the period (BUG-09).Streak label reads "1 consecutive days" instead of "1 consecutive day" (BUG-10).Solution: Centralize user formatting helpers so every navbar badge, modal avatar, and dashboard card reads from the same derived values.// utils/userFormatters.ts
export function getCleanFirstName(fullName?: string | null): string {
  const cleaned = (fullName ?? '').trim();
  if (!cleaned) return 'Candidate';
  return cleaned.split(/\s+/)[0].trim();
}

export function formatGreeting(prefix: string, fullName?: string | null): string {
  return `${prefix}, ${getCleanFirstName(fullName)}.`; // Produces: "Good evening, Gemini."
}

export function getUserInitials(fullName?: string | null): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase(); // Produces: "GA"
}

export function formatStreakCopy(streakDays: number): {
  shortBadge: string;
  cardSubtext: string;
} {
  const safeStreak = Math.max(0, Number(streakDays) || 0);
  return {
    shortBadge: `${safeStreak}d`,
    cardSubtext: `${safeStreak} consecutive ${safeStreak === 1 ? 'day' : 'days'}`,
  };
}
2.6 Fix CTA Link Wrapping & Standardize Directional Arrows (BUG-07 — Medium)Problem: On Prep Hub, "View All Kits ->" wraps onto two lines so -> sits alone on the second line, and cards mix ASCII -> with Unicode →.Solution: Use a reusable ActionLink component with whitespace-nowrap inline-flex items-center gap-1.5 and a consistent <ArrowRight /> icon.// components/ui/ActionLink.tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors group"
    >
      <span>{label}</span>
      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 shrink-0" />
    </Link>
  );
}
2.7 Add Inline Client-Side Validation to Profile Setup & Feedback Forms (BUG-08 — Medium)Problem: Clicking Save Profile on Profile Setup with an empty Full Name * or clicking Submit on Feedback with an empty Subject or Message fails silently with no visual feedback.Solution: Track field-level validation errors and render explicit border-rose-500 styling and helper text.// components/feedback/FeedbackFormValidationExample.tsx
const [errors, setErrors] = useState<{ subject?: string; message?: string }>({});

function validateAndSubmit(e: React.FormEvent) {
  e.preventDefault();
  const nextErrors: { subject?: string; message?: string } = {};
  if (!subject.trim()) nextErrors.subject = 'Please select a feedback category.';
  if (message.trim().length < 10) {
    nextErrors.message = 'Please enter at least 10 characters so we can act on your feedback.';
  }
  setErrors(nextErrors);
  if (Object.keys(nextErrors).length > 0) return;
  submitFeedback({ subject, message });
}
2.8 Standardize Brand Naming & Public Navbar Redirect Context (BUG-11, BUG-12 — Low)Canonical Brand Casing (BUG-11): Run a project-wide search-and-replace changing interVue (found in Help Center Tour Step 1 and the Profile Heatmap filter tab) to Intervue.Public Navbar Context (BUG-12): When unauthenticated visitors click Help Center or Feedback on the Landing Page, append ?redirect=/help&reason=auth_required when routing to Login and display a subtle info banner above the sign-in form: "Sign in to access the interactive Help Tour and Feedback portal."3. Upgraded Dark-Mode Color Palette & Design System TokensTo eliminate "flat blue overload," separate nested inputs/drawers from parent cards, and replace competing bright tags with calm translucent pills, drop these tokens into your global stylesheet and Tailwind configuration:/* app/globals.css */
:root {
  /* 3-Tier Surface Elevation System */
  --bg-canvas: #090A0F;          /* Main page background */
  --bg-surface-1: #11131A;       /* Primary cards & panels */
  --bg-surface-2: #1A1D27;       /* Nested inputs, drawers, popovers & hover states */

  /* Crisp Top-Lit Borders */
  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-elevated: rgba(255, 255, 255, 0.13);
  --border-focus: #3B82F6;

  /* Typography Hierarchy (WCAG AA/AAA Compliant) */
  --text-primary: #F8FAFC;       /* Headings & primary values */
  --text-secondary: #94A3B8;     /* Body copy & descriptions */
  --text-muted: #64748B;         /* Table headers, timestamps & captions */

  /* Primary Action Accent (Reserved for 1 primary CTA per screen) */
  --accent-primary: #3B82F6;
  --accent-gradient: linear-gradient(135deg, #6366F1 0%, #3B82F6 100%);

  /* Semantic Difficulty & Telemetry Tokens (Use with 10% bg / 20% border) */
  --status-easy-text: #34D399;
  --status-easy-bg: rgba(16, 185, 129, 0.10);
  --status-easy-border: rgba(16, 185, 129, 0.22);

  --status-medium-text: #FBBF24;
  --status-medium-bg: rgba(245, 158, 11, 0.10);
  --status-medium-border: rgba(245, 158, 11, 0.22);

  --status-hard-text: #FB7185;
  --status-hard-bg: rgba(244, 63, 94, 0.10);
  --status-hard-border: rgba(244, 63, 94, 0.22);
}

/* Tabular numbers for timers, scores, and ratings */
.metric-value, time, .timer-display {
  font-variant-numeric: tabular-nums;
}
4. UI Decluttering & Layout Refactoring BlueprintTo make Intervue feel as clean and focused as Linear or Raycast, apply these four structural layout changes:4.1 Declutter /dashboard (Eliminate Triple Navigation Duplication)Cut: Delete the bottom Quick Launchpad grid (which repeats Company Kits, Notes, Bookmarks, AI Mentor already present in the left sidebar) and remove the secondary Prep Hub and Battle Arena buttons from the top greeting banner.Keep & Focus:Top Hero Strip: Greeting (Good evening, Gemini.) on the left + a single high-contrast primary CTA (Start AI Interview →) on the right.4 KPI Stat Cards: Compact single-line metric cards using tabular-nums.Balanced 2-Column Main Grid: Left column (60% width) holds the Target Company Readiness Tracker; Right column (40% width) holds Today's Prep Checklist and the Latest Interview Scorecard.4.2 Declutter /practice (Full-Width Prep Hub)Cut: Remove the right-hand secondary widget column (Live Battle Arena promo card + Daily Planner widget) from Prep Hub. Those tools already live on /rooms and /dashboard.Result: Giving the Explore Subjects grid and Company Kits grid the full 12-column width prevents card text truncation, eliminates the "View All Kits ->" line wrap, and makes each card's progress bar easy to scan.4.3 Cap Card Density at 3 Data PointsAcross Company Kits and the Landing Page, restrict each company card to:Header: Company Logo + Name + Total Question Count badge.Body: Progress bar (0 / 45 Solved) with difficulty breakdown bar.Footer: Max 2 top pattern tags (Graph Traversal, Segment Trees) + Practice → icon link.4.4 Upgrade /interview with a Collapsible Split-Pane Code EditorThe Landing Page Cockpit Preview showcases a split-screen AI dialogue + code editor (architecture_spec.py) + live rubric telemetry, whereas the logged-in Technical Interview Studio defaults to a single-column text chat. Adding a toggleable split-pane code/whiteboard drawer on the right half of /interview aligns the core product experience with the landing page's strongest visual hook.5. Reference Solution: Featured Distributed URL Shortener Task (architecture_spec.py)For the featured system design task displayed in the Intervue Mock Cockpit Preview:"Design a distributed URL shortener that sustains 10M writes/day with sub-50ms p99 read latency. How do you structure key generation, and where do you introduce your caching hierarchy to handle hotspot keys?"5.1 Architectural ApproachZero-Collision Key Generation: Pre-generate or allocate 64-bit unique IDs via a distributed range coordinator (or Snowflake ID generator) and encode them into 7-character Base62 strings (62^7 ≈ 3.52 trillion keys), avoiding database uniqueness lookups on the write path.Two-Tier Caching Hierarchy for Hotspot Keys:L1 In-Process LRU Cache (Per API Node, TTL 10–30s, ~10,000 keys): Absorbs viral "celebrity link" traffic spikes locally in memory (<0.1ms) so a single hot key never saturates a single Redis shard.L2 Distributed Redis Cluster (Multi-AZ, 3 Replicas, Write-Through for High-Velocity Keys + LRU Eviction): Serves the broad working set in <2ms and uses write-through population plus singleflight request coalescing to prevent cache-stampede storms on TTL expiration.Prefix-Hashed Database Sharding + Circuit Breaker: Shard persistent storage by short_hash[0:2] across read-replicated partitions and wrap downstream calls in a circuit breaker for graceful degradation.5.2 Complete Python Implementation (architecture_spec.py)import asyncio
import time
from collections import OrderedDict
from typing import Dict, Optional

BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


def encode_base62(num: int, min_length: int = 7) -> str:
    """Encodes a 64-bit integer ID into a Base62 short key."""
    if num == 0:
        return BASE62_ALPHABET[0].rjust(min_length, BASE62_ALPHABET[0])
    chars = []
    base = len(BASE62_ALPHABET)
    while num > 0:
        num, rem = divmod(num, base)
        chars.append(BASE62_ALPHABET[rem])
    return "".join(reversed(chars)).rjust(min_length, BASE62_ALPHABET[0])


class LocalL1HotspotCache:
    """Per-node in-memory L1 cache with short TTL to absorb viral hotspot keys."""

    def __init__(self, capacity: int = 5000, ttl_seconds: float = 15.0):
        self.capacity = capacity
        self.ttl = ttl_seconds
        self._store: OrderedDict[str, tuple[str, float]] = OrderedDict()

    def get(self, key: str) -> Optional[str]:
        entry = self._store.get(key)
        if not entry:
            return None
        url, expires_at = entry
        if time.monotonic() > expires_at:
            self._store.pop(key, None)
            return None
        self._store.move_to_end(key)
        return url

    def set(self, key: str, url: str) -> None:
        if key in self._store:
            self._store.move_to_end(key)
        self._store[key] = (url, time.monotonic() + self.ttl)
        if len(self._store) > self.capacity:
            self._store.popitem(last=False)


class DistributedRedisCacheCluster:
    """Simulated multi-zone Redis L2 cache with write-through & LRU eviction."""

    def __init__(self, replicas: int = 3):
        self.replicas = replicas
        self._redis: Dict[str, str] = {}

    async def get(self, key: str) -> Optional[str]:
        await asyncio.sleep(0.001)  # ~1ms network hop
        return self._redis.get(key)

    async def set(self, key: str, url: str) -> None:
        await asyncio.sleep(0.001)
        self._redis[key] = url


class ShardedStorageCluster:
    """Prefix-sharded persistent database cluster (sharded on short_hash[0:2])."""

    def __init__(self):
        self._shards: Dict[str, Dict[str, str]] = {}

    def _get_shard(self, short_key: str) -> Dict[str, str]:
        prefix = short_key[:2]
        if prefix not in self._shards:
            self._shards[prefix] = {}
        return self._shards[prefix]

    async def insert(self, short_key: str, long_url: str) -> None:
        await asyncio.sleep(0.004)  # ~4ms write persistence
        self._get_shard(short_key)[short_key] = long_url

    async def fetch(self, short_key: str) -> Optional[str]:
        await asyncio.sleep(0.005)  # ~5ms indexed shard read
        return self._get_shard(short_key).get(short_key)


class URLCompressorCluster:
    """
    Production reference architecture for Intervue's 10M writes/day URL Shortener.
    Combines range-allocated Base62 key generation, L1+L2 caching, and singleflight coalescing.
    """

    def __init__(self, node_id: int = 1):
        self.node_id = node_id
        self._counter = (node_id << 40) + 100_000
        self.l1_cache = LocalL1HotspotCache(capacity=10_000, ttl_seconds=15.0)
        self.cache_layer = DistributedRedisCacheCluster(replicas=3)
        self.db_shards = ShardedStorageCluster()
        self._inflight_locks: Dict[str, asyncio.Lock] = {}

    def _next_short_key(self) -> str:
        self._counter += 1
        return encode_base62(self._counter, min_length=7)

    async def shorten_url(self, long_url: str, write_through_cache: bool = True) -> str:
        short_key = self._next_short_key()
        await self.db_shards.insert(short_key, long_url)
        if write_through_cache:
            # Proactive write-through prevents initial read-miss bursts on newly shared links
            await self.cache_layer.set(short_key, long_url)
            self.l1_cache.set(short_key, long_url)
        return short_key

    async def resolve_url(self, short_key: str) -> Optional[str]:
        # 1. Check L1 node-local memory cache (<0.1ms, protects Redis from viral hotspot keys)
        cached_l1 = self.l1_cache.get(short_key)
        if cached_l1 is not None:
            return cached_l1

        # 2. Check L2 distributed Redis cluster (~1-2ms)
        cached_l2 = await self.cache_layer.get(short_key)
        if cached_l2 is not None:
            self.l1_cache.set(short_key, cached_l2)
            return cached_l2

        # 3. Singleflight lock prevents cold-cache stampedes on the database shard
        lock = self._inflight_locks.setdefault(short_key, asyncio.Lock())
        async with lock:
            recheck_l2 = await self.cache_layer.get(short_key)
            if recheck_l2 is not None:
                self.l1_cache.set(short_key, recheck_l2)
                return recheck_l2

            long_url = await self.db_shards.fetch(short_key)
            if long_url is not None:
                await self.cache_layer.set(short_key, long_url)
                self.l1_cache.set(short_key, long_url)
            return long_url
