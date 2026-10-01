// App registry — defines all apps available in the OS.
import type { ComponentType } from "react";
import {
  Music,
  FolderClosed,
  TerminalSquare,
  Globe,
  Settings as SettingsIcon,
  FileText,
  Calculator,
  Info,
} from "lucide-react";

export interface AppDef {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  iconBg: string;
  defaultWidth: number;
  defaultHeight: number;
  /** When true, the app keeps running in the background even with no window.
   *  Used by the music player so audio persists. */
  singleton?: boolean;
  singleInstance?: boolean;
}

export const APPS: AppDef[] = [
  {
    id: "music",
    name: "abroad",
    icon: Music,
    iconBg: "linear-gradient(135deg, #e8332a, #b91c1c)",
    defaultWidth: 1100,
    defaultHeight: 720,
    singleton: true,
    singleInstance: true,
  },
  {
    id: "files",
    name: "Files",
    icon: FolderClosed,
    iconBg: "linear-gradient(135deg, #f59e0b, #d97706)",
    defaultWidth: 760,
    defaultHeight: 500,
    singleInstance: true,
  },
  {
    id: "terminal",
    name: "Terminal",
    icon: TerminalSquare,
    iconBg: "linear-gradient(135deg, #1f2937, #111827)",
    defaultWidth: 680,
    defaultHeight: 440,
  },
  {
    id: "browser",
    name: "Browser",
    icon: Globe,
    iconBg: "linear-gradient(135deg, #0ea5e9, #0284c7)",
    defaultWidth: 900,
    defaultHeight: 600,
    singleInstance: true,
  },
  {
    id: "editor",
    name: "Editor",
    icon: FileText,
    iconBg: "linear-gradient(135deg, #22c55e, #16a34a)",
    defaultWidth: 640,
    defaultHeight: 520,
  },
  {
    id: "calculator",
    name: "Calculator",
    icon: Calculator,
    iconBg: "linear-gradient(135deg, #6b7280, #374151)",
    defaultWidth: 320,
    defaultHeight: 460,
    singleInstance: true,
  },
  {
    id: "settings",
    name: "Settings",
    icon: SettingsIcon,
    iconBg: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    defaultWidth: 600,
    defaultHeight: 480,
    singleInstance: true,
  },
  {
    id: "about",
    name: "About",
    icon: Info,
    iconBg: "linear-gradient(135deg, #ec4899, #be185d)",
    defaultWidth: 480,
    defaultHeight: 420,
    singleInstance: true,
  },
];

export const APP_MAP = Object.fromEntries(APPS.map((a) => [a.id, a]));
