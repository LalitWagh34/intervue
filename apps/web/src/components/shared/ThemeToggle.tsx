import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type ThemeOption = "system" | "light" | "dark";

const THEME_OPTIONS: Array<{
  value: ThemeOption;
  label: string;
  Icon: typeof Monitor;
}> = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

export function ThemeQuickButton({ className }: { className?: string }) {
  const { resolvedTheme = "dark", setTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      title={isLight ? "Switch to dark theme" : "Switch to light theme"}
      className={cn(
        "h-11 sm:h-9 px-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer shrink-0",
        className
      )}
    >
      {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
      <span className="hidden md:inline">{isLight ? "Dark" : "Light"}</span>
    </button>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme = "dark", setTheme } = useTheme();

  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="block text-[11px] font-medium text-[var(--text-muted)] px-1">
        Appearance
      </span>
      <div
        role="group"
        aria-label="Theme preference"
        className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)]"
      >
        {THEME_OPTIONS.map(({ value, label, Icon }) => {
          const isActive = theme === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setTheme(value)}
              className={cn(
                "min-h-9 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--border-subtle)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-transparent"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

