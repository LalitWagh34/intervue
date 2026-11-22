import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Code2, Mic } from "lucide-react";
import { Link } from "react-router-dom";
import { DailyTargetTracker } from "@/components/shared/DailyTargetTracker";
import { TargetCompanyTracker } from "@/components/shared/TargetCompanyTracker";
import { useRevisionQueue } from "@/hooks/useLearn";
import { useCompanyReadiness } from "@/hooks/useReadiness";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { getLastLesson } from "@/lib/lastLesson";
import { formatInterviewScore } from "@/lib/score";

interface DashboardStats {
  streakCount: number;
  solvedCount: number;
  simulationsCount: number;
  avgScore: number;
  recentInterviews: {
    id: string;
    role?: string;
    title?: string;
    status?: string;
    createdAt?: string;
    score?: number | null;
    scorecard?: { overallScore?: number | null };
  }[];
}

const panel = "rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]";
const textLink = "text-sm font-medium text-[var(--accent-text)] hover:underline";
const prepPaths = [
  { title: "Learn & revise", detail: "Study core CS concepts", to: "/learn", icon: BookOpen },
  { title: "Coding practice", detail: "Explore curated problem sets", to: "/practice", icon: Code2 },
  { title: "Mock interviews", detail: "Practice and get feedback", to: "/interview", icon: Mic },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const name = session?.user?.name?.trim().split(/\s+/)[0];
  const { data: stats, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["dashboard", userId],
    queryFn: async () => (await api.get<DashboardStats>("/profile/dashboard")).data,
    enabled: Boolean(userId),
    staleTime: 60_000,
    retry: false,
  });
  const { data: revision } = useRevisionQueue();
  const { data: readiness } = useCompanyReadiness();
  const lastLesson = userId ? getLastLesson(userId) : null;
  const due = revision?.queue[0]?.concept;
  const next = due
    ? { title: `Review ${due.title}`, detail: due.module.subject.title, action: "Open lesson", to: `/learn/concepts/${encodeURIComponent(due.slug)}` }
    : lastLesson
      ? { title: lastLesson.title, detail: "Pick up where you left off.", action: "Continue learning", to: `/learn/concepts/${encodeURIComponent(lastLesson.slug)}` }
      : stats?.simulationsCount === 0
        ? { title: "Start your first mock interview", detail: "Get a scorecard and see what to practice next.", action: "Start mock interview", to: "/interview" }
        : { title: "Pick a topic to practice", detail: "Choose your next problem set.", action: "Open Practice Hub", to: "/practice" };
  const companies = readiness?.targetCompanies?.join(", ") || readiness?.targetCompany;
  const interviews = stats?.recentInterviews.slice(0, 3) ?? [];
  const metrics = [
    { label: "Problems solved", value: stats?.solvedCount },
    { label: "Mocks completed", value: stats?.simulationsCount },
    { label: "Avg. interview score", value: stats?.simulationsCount ? formatInterviewScore(stats.avgScore)?.formatted : null },
  ];

  return (
    <div className="min-h-full bg-[var(--canvas)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {name ? `Welcome, ${name}` : "Your dashboard"}
        </h1>

        <div className="grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
          <section className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-selected)] p-6 sm:p-8" aria-labelledby="continue-prep">
            <h2 id="continue-prep" className="text-sm font-semibold text-[var(--accent-text)]">Continue prep</h2>
            <p className="mt-4 break-words text-2xl font-semibold tracking-tight sm:text-3xl">{next.title}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{next.detail}</p>
            <Link to={next.to} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--action-primary)] px-4 text-sm font-semibold text-[var(--on-primary)] hover:bg-[var(--action-primary-hover)]">
              {next.action} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            {due && lastLesson && lastLesson.slug !== due.slug && (
              <Link to={`/learn/concepts/${encodeURIComponent(lastLesson.slug)}`} className={`${textLink} mt-4 block break-words`}>
                Resume {lastLesson.title}
              </Link>
            )}
          </section>
          <DailyTargetTracker compact streak={stats?.streakCount} />
        </div>

        <section aria-labelledby="prep-paths">
          <h2 id="prep-paths" className="mb-3 text-lg font-semibold tracking-tight">Preparation paths</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {prepPaths.map(({ title, detail, to, icon: Icon }) => (
              <Link key={to} to={to} className={`${panel} group flex min-w-0 items-start gap-3 p-4 transition-colors hover:border-[var(--action-primary)] hover:bg-[var(--surface-hover)]`}>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--surface-selected)] text-[var(--accent-text)]">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--text-secondary)]">{detail}</span>
                </span>
                <ArrowRight className="mt-1 size-4 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--accent-text)]" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section aria-label="Progress summary" aria-busy={isPending}>
          {isError && (
            <div role="alert" className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <span>Dashboard metrics are unavailable.</span>
              <button type="button" disabled={isFetching} onClick={() => void refetch()} className={textLink}>Retry</button>
            </div>
          )}
          <dl className={`${panel} grid divide-y divide-[var(--border-subtle)] sm:grid-cols-3 sm:divide-x sm:divide-y-0`}>
            {metrics.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-3 px-5 py-3 sm:block">
                <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
                <dd className="text-xl font-semibold tabular-nums">{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={`${panel} px-5 py-4`} aria-labelledby="recent-interviews">
          <h2 id="recent-interviews" className="text-lg font-semibold tracking-tight">Recent interviews</h2>
          {interviews.length ? (
            <ul className="mt-2 divide-y divide-[var(--border-subtle)]">
              {interviews.map((item) => {
                const completed = item.status?.toLowerCase() === "completed";
                const score = formatInterviewScore(item.scorecard?.overallScore ?? item.score);
                return (
                  <li key={item.id}>
                    <Link to={completed ? `/results/${item.id}` : "/history"} className="flex min-h-12 items-center gap-3 rounded-md px-2 py-2 hover:bg-[var(--surface-hover)]">
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-sm font-medium">{item.role || item.title || "Technical interview"}</span>
                        {item.createdAt && <time className="text-xs text-[var(--text-secondary)]" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString()}</time>}
                      </span>
                      <span className="text-sm tabular-nums text-[var(--text-secondary)]">{score?.formatted ?? item.status ?? "—"}</span>
                      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {isPending ? "Loading interviews…" : isError ? "Interview history is temporarily unavailable." : "Your mock interviews will appear here."}
            </p>
          )}
        </section>

        <section className={`${panel} px-5 py-4`} aria-labelledby="target-company">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="target-company" className="text-lg font-semibold tracking-tight">Target company</h2>
            {companies && <Link to="/practice?view=company_kits" className={textLink}>View prep kits</Link>}
          </div>
          {companies && <p className="mt-2 break-words text-sm text-[var(--text-secondary)]">{companies} · {readiness?.readinessPercentage}% coverage</p>}
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-[var(--text-secondary)]">Manage company targets</summary>
            <div className="mt-4"><TargetCompanyTracker /></div>
          </details>
        </section>

        <Link
          to="/history"
          className={`${panel} flex min-h-12 items-center justify-between gap-3 px-5 py-3 text-sm font-medium hover:bg-[var(--surface-hover)]`}
        >
          View full interview history
          <ArrowRight className="size-4 shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
