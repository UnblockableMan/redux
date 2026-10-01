"use client";

import { useTheme, THEMES } from "@/store/theme";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Theme
      </span>
      <div className="flex flex-1 justify-end gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "h-6 w-6 rounded-full border-2 transition-all",
              theme === t.id
                ? "border-foreground scale-110"
                : "border-transparent opacity-60 hover:opacity-100",
            )}
            style={{ background: t.swatch }}
            aria-label={t.label}
            title={t.label}
          >
            <span
              className="block h-2 w-2 rounded-full"
              style={{ background: t.accent, margin: "auto", marginTop: "5px" }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
