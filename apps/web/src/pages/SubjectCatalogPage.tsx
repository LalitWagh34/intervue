import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Layers,
  Search,
  Code2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useLearnSubject } from "@/hooks/useLearn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MODULE_ICONS: Record<string, any> = {
  "arrays-patterns": Layers,
  searching: Search,
};

export default function SubjectCatalogPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useLearnSubject(slug);

  const subject = data?.subject;

  if (isLoading) {
    return (
      <div className="w-full min-h-full bg-[var(--canvas)] text-[var(--text-primary)]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-pulse">
          <div className="h-4 w-40 rounded bg-[var(--surface-muted)]" />
          <div className="h-28 w-full rounded-2xl bg-[var(--surface)]" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-44 rounded-xl bg-[var(--surface)]" />
            <div className="h-44 rounded-xl bg-[var(--surface)]" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !subject) {
    return (
      <div className="w-full min-h-full bg-[var(--canvas)] text-[var(--text-primary)]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]">
            <BookOpen className="h-6 w-6 text-[var(--text-muted)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Subject track not found</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            This learning track is either unpublished or does not exist.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/learn">Return to Learn Hub</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-[var(--canvas)] text-[var(--text-primary)]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Link
            to="/learn"
            className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Learn &amp; Revise
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-primary)] font-semibold">{subject.title}</span>
        </nav>

        {/* Subject Header Banner */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 sm:p-7 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--border-subtle)] text-xs">
                Learning Track
              </Badge>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {subject.conceptCount} concepts &bull; ~{subject.estimatedMinutes}m total
              </span>
            </div>

            <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-[var(--border-control)]">
              <Link to="/learn">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Tracks
              </Link>
            </Button>
          </div>

          <div className="space-y-1 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              {subject.title}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {subject.description}
            </p>
          </div>
        </div>

        {/* ─── Choose a Module (Box Structure like Reference UI) ─── */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                Choose a Module
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Click a module box below to open its dedicated topics page
              </p>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {subject.modules.length} modules available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subject.modules.map((module, idx) => {
              const Icon = MODULE_ICONS[module.slug] || Code2;
              const moduleNumber = String(idx + 1).padStart(2, "0");

              return (
                <Link
                  key={module.id}
                  to={`/learn/subjects/${subject.slug}/modules/${module.slug}`}
                  className="text-left rounded-xl p-5 border border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[#327CF6]/60 hover:bg-[var(--surface-hover)] hover:shadow-md transition-all flex flex-col justify-between gap-4 cursor-pointer group"
                >
                  {/* Card Top Row: Icon + Index */}
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-primary)] group-hover:border-[#327CF6]/40 group-hover:bg-[#327CF6]/10 group-hover:text-[#327CF6] transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>

                    <span className="font-mono text-xs font-bold text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                      MOD {moduleNumber}
                    </span>
                  </div>

                  {/* Card Content: Title & Description */}
                  <div className="space-y-1.5 w-full">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[#327CF6] transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {module.description || "Core techniques and interview patterns."}
                    </p>
                  </div>

                  {/* Card Bottom Row: Concept Count + Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]/70 w-full text-xs">
                    <span className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {module.concepts.length} {module.concepts.length === 1 ? "concept" : "concepts"}
                    </span>

                    <span className="font-medium text-[#327CF6] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Open topics <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
