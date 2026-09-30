"use client";

import { Home, Search, Library } from "lucide-react";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);

  const isActive = (name: string) => view.name === name;
  const libActive =
    view.name === "library" ||
    view.name === "liked" ||
    view.name === "recently-played" ||
    view.name === "playlist";

  return (
    <nav className="glass flex items-center justify-around border-t border-white/[0.06] px-2 py-1.5 md:hidden">
      <TabButton
        icon={<Home className="h-5 w-5" />}
        label="Home"
        active={isActive("home")}
        onClick={() => go({ name: "home" })}
      />
      <TabButton
        icon={<Search className="h-5 w-5" />}
        label="Search"
        active={isActive("search")}
        onClick={() => go({ name: "search" })}
      />
      <TabButton
        icon={<Library className="h-5 w-5" />}
        label="Library"
        active={libActive}
        onClick={() => go({ name: "library" })}
      />
    </nav>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
