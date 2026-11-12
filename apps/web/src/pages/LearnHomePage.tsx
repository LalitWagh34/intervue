import { Link } from "react-router-dom";
import {
  Code2,
  Database,
  Cpu,
  Network,
  Layers,
  Sparkles,
  Clock,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import { useLearnSubjects, useRevisionQueue } from "@/hooks/useLearn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubjectCardItem {
  id: string;
  slug: string;
  code: string;
  title: string;
  description: string;
  icon: any;
  isAvailable: boolean;
  moduleCount?: number;
  conceptCount?: number;
  statusBadge: string;
}

const SUBJECT_TEMPLATES = [
  {
    id: "dsa",
    slug: "dsa",
    code: "DSA 01",
    title: "Data Structures & Algorithms",
    defaultDescription: "Core problem-solving patterns, invariants, and complexity intuition for coding interviews.",
    icon: Code2,
  },
  {
    id: "dbms",
    slug: "dbms",
    code: "DBMS 02",
    title: "Database Management Systems",
    defaultDescription: "Indexing, B+ Trees, ACID transactions, isolation levels, and concurrency control.",
    icon: Database,
  },
  {
    id: "os",
    slug: "os",
    code: "OS 03",
    title: "Operating Systems",
    defaultDescription: "Processes, virtual memory paging, CPU scheduling, deadlocks, and synchronization.",
    icon: Cpu,
  },
  {
    id: "cn",
    slug: "cn",
    code: "CN 04",
    title: "Computer Networks",
    defaultDescription: "TCP handshake, flow & congestion control, DNS resolution, HTTP/2 & 3, and TLS.",
    icon: Network,
  },
  {
    id: "oop",
    slug: "oop",
    code: "OOP 05",
    title: "Object-Oriented Programming",
    defaultDescription: "SOLID design principles, structural patterns, abstraction, and memory layout.",
    icon: Layers,
  },
  {
    id: "system-design",
    slug: "system-design",
    code: "SYS 06",
    title: "System Design Essentials",
    defaultDescription: "CAP theorem, caching tiers, message brokers, load balancing, and database sharding.",
    icon: Sparkles,
  },
];

export default function LearnHomePage() {
  const { data, isLoading } = useLearnSubjects();
  const { data: queueData } = useRevisionQueue();
  const liveSubjects = data?.subjects || [];
  const queue = queueData?.queue || [];

  const allCards: SubjectCardItem[] = SUBJECT_TEMPLATES.map((tmpl) => {
    const live = liveSubjects.find((s) => s.slug === tmpl.slug);
    if (live) {
      return {
        id: tmpl.id,
        slug: tmpl.slug,
        code: tmpl.code,
        title: live.title || tmpl.title,
        description: live.description || tmpl.defaultDescription,
        icon: tmpl.icon,
        isAvailable: true,
        moduleCount: live.moduleCount,
        conceptCount: live.conceptCount,
        statusBadge: "Ready to Revise",
      };
    }
    return {
      id: tmpl.id,
      slug: tmpl.slug,
      code: tmpl.code,
      title: tmpl.title,
      description: tmpl.defaultDescription,
      icon: tmpl.icon,
      isAvailable: false,
      statusBadge: tmpl.slug === "os" ? "Next in Pipeline" : "Planned",
    };
  });

  return (
    <div className="w-full min-h-full bg-[var(--canvas)] text-[var(--text-primary)]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
        {/* ─── Header Banner (Clean & Non-cluttered) ─── */}
        <header className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 sm:p-7 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--border-subtle)] text-[11px] font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Learn &amp; Revise Hub
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Subject Tracks &bull; V1 Pilot
            </span>
            {queue.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30 px-2 py-0.5 text-xs font-mono font-semibold">
                <RotateCcw className="h-3 w-3" />
                {queue.length} due for revision
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono">
                <CheckCircle2 className="h-3 w-3" />
                All caught up
              </span>
            )}
          </div>

          <div className="space-y-1 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Choose a Subject Track
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Select a subject track below to explore modules, rapid interview revision templates, and deep dive conceptual explanations.
            </p>
          </div>
        </header>

        {/* ─── Due for Revision Queue (Spaced Repetition) ─── */}
        {queue.length > 0 && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    Due for Revision ({queue.length})
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Concepts scheduled for active recall reinforcement
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {queue.map((item) => (
                <div
                  key={item.progressId}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-500 border-amber-500/30 font-semibold">
                        {item.status === "NEEDS_REVISION" ? "Review Needed" : `Stage ${item.reviewStage} Due`}
                      </Badge>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        ~{item.concept.estimatedMinutes}m
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {item.concept.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                      {item.concept.module.subject.title} &bull; {item.concept.module.title}
                    </p>
                  </div>

                  <Button asChild size="sm" className="w-full h-7 text-xs font-semibold gap-1 bg-[#327CF6] hover:bg-[#2563EB] text-white">
                    <Link to={`/learn/concepts/${item.concept.slug}`}>
                      Quick Revise <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Subject Boxes Side by Side (Grid Layout) ─── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                Subject Tracks
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Core engineering and computer science tracks for interview preparation
              </p>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {allCards.length} tracks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allCards.map((card) => {
              const Icon = card.icon;

              if (card.isAvailable) {
                return (
                  <Link
                    key={card.id}
                    to={`/learn/subjects/${card.slug}`}
                    className="rounded-xl p-5 border border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[#327CF6]/60 hover:bg-[var(--surface-hover)] hover:shadow-md transition-all flex flex-col justify-between gap-4 cursor-pointer group"
                  >
                    {/* Top Row: Icon + Code */}
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-primary)] group-hover:border-[#327CF6]/40 group-hover:bg-[#327CF6]/10 group-hover:text-[#327CF6] transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-medium">
                          {card.statusBadge}
                        </Badge>
                        <span className="font-mono text-xs font-bold text-[var(--text-muted)]">
                          {card.code}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Title & Description */}
                    <div className="space-y-1.5 w-full">
                      <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[#327CF6] transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                        {card.description}
                      </p>
                    </div>

                    {/* Bottom: Count + Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]/70 w-full text-xs">
                      <span className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono text-[11px]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        {card.moduleCount} modules &bull; {card.conceptCount} concepts
                      </span>

                      <span className="font-medium text-[#327CF6] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Explore track <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                );
              }

              // Inactive / Upcoming Tracks
              return (
                <div
                  key={card.id}
                  className="rounded-xl p-5 border border-[var(--border-subtle)]/60 bg-[var(--surface)]/60 opacity-80 flex flex-col justify-between gap-4 select-none"
                >
                  {/* Top Row: Icon + Code */}
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-muted)]">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] text-[var(--text-muted)] border-[var(--border-control)]">
                        {card.statusBadge}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-[var(--text-muted)]">
                        {card.code}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Title & Description */}
                  <div className="space-y-1.5 w-full">
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {card.description}
                    </p>
                  </div>

                  {/* Bottom: Status */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]/50 w-full text-xs">
                    <span className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono text-[11px]">
                      <Clock className="h-3.5 w-3.5" />
                      Curriculum Pipeline
                    </span>

                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      Coming soon
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
