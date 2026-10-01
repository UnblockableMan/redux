"use client";

import { Trophy, Lock } from "lucide-react";
import { useSettings, ACHIEVEMENTS } from "@/store/settings";

export function AchievementsView() {
  const unlocked = useSettings((s) => s.achievements);
  const unlockedCount = unlocked.length;

  return (
    <div className="fade-in p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Trophy className="h-6 w-6" style={{ color: "var(--accent)" }} />
        <div>
          <h1 className="text-2xl font-bold">Achievements</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {unlockedCount} / {ACHIEVEMENTS.length} unlocked
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8 h-2 w-full max-w-md overflow-hidden rounded-full" style={{ background: "var(--surface2)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%`, background: "var(--accent)" }}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const isUnlocked = unlocked.includes(a.id);
          return (
            <div
              key={a.id}
              className="surface flex items-center gap-3 rounded-xl border p-4 transition-all"
              style={{
                borderColor: isUnlocked ? "var(--accent)" : "var(--border)",
                opacity: isUnlocked ? 1 : 0.5,
              }}
            >
              <div
                className="flex h-12 w-12 flex-none items-center justify-center rounded-xl text-2xl"
                style={{ background: isUnlocked ? "var(--surface2)" : "var(--bg)" }}
              >
                {isUnlocked ? a.icon : <Lock className="h-5 w-5" style={{ color: "var(--text-muted)" }} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{a.name}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{a.desc}</div>
              </div>
              {isUnlocked && <Trophy className="h-4 w-4 flex-none" style={{ color: "var(--accent)" }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
