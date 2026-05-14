/**
 * Theme Toggle
 *
 * Shared three-way theme toggle (light / dark / system).
 * Layout and chrome use ThemeToggle.css; inline styles only for dynamic `left` and CSS variables.
 */

import { useEffect, useState, type CSSProperties } from "react";
import type { Theme } from "../utils/theme";
import { getEffectiveTheme } from "../utils/theme";
import "./ThemeToggle.css";

function SunIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function MonitorIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

export interface ThemeToggleProps {
  /** Current theme value */
  theme: Theme;
  /** Callback when user selects a theme */
  onThemeChange: (theme: Theme) => void;
  /** Additional CSS class */
  className?: string;
  /**
   * Resolved light/dark appearance for the control chrome.
   * When omitted, uses the shared cookie + system preference (`getEffectiveTheme`),
   * matching the marketing app. Pass from standalone stores (e.g. editor
   * localStorage) so the pill stays visually aligned with `document.documentElement`.
   */
  resolvedTheme?: "light" | "dark";
  /**
   * Dense sizing (padding / hit targets). Reuses the same border, glass, and
   * indicator chrome as the default control — only dimensions change. Prefer
   * scaling the wrapper in the app if you need main-platform pixel parity.
   */
  compact?: boolean;
}

export function ThemeToggle({
  theme,
  onThemeChange,
  className,
  resolvedTheme,
  compact = false,
}: ThemeToggleProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const pad = compact ? 2 : 4;
  const btnW = compact ? 28 : 36;
  const btnH = compact ? 28 : 32;
  const halfSlot = btnW / 2;
  const trailing = pad + btnW;
  const iconSize = compact ? 14 : 16;

  // Prefer `resolvedTheme` from the app shell (SSR + ThemeProvider) so chrome
  // matches `getServerThemeInit` / blocking script without reading cookie/MediaQuery
  // during the first client pass. Fall back to getEffectiveTheme after mount when omitted.
  const appearance =
    resolvedTheme ?? (isMounted ? getEffectiveTheme() : "light");
  const isDark = appearance === "dark";

  const getIndicatorLeft = (): string => {
    if (theme === "light") return `${pad}px`;
    if (theme === "dark") return `calc(50% - ${halfSlot}px)`;
    return `calc(100% - ${trailing}px)`;
  };

  /** Only sizing vars + optional fixed height — chrome lives in CSS (`.fs-theme-toggle`) for hydration stability. */
  const rootStyle: CSSProperties = {
    ...(compact ? { height: "var(--fs-chrome-control-h, 32px)" } : {}),
    ["--fs-theme-toggle-pad" as string]: `${pad}px`,
    ["--fs-theme-toggle-btn-h" as string]: `${btnH}px`,
    ["--fs-theme-toggle-btn-w" as string]: `${btnW}px`,
  };

  const indicatorStyle: CSSProperties = {
    left: getIndicatorLeft(),
  };

  const buttonStyle = (isActive: boolean): CSSProperties => ({
    position: "relative",
    zIndex: 10,
    height: btnH,
    width: btnW,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
    transition: "color 200ms ease",
    color: isActive
      ? isDark
        ? "rgba(255,255,255,0.95)"
        : "rgba(0,0,0,0.85)"
      : isDark
        ? "rgba(255,255,255,0.35)"
        : "rgba(0,0,0,0.35)",
  });

  const appearanceAttr = isDark ? "dark" : "light";

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={["fs-theme-toggle", className].filter(Boolean).join(" ")}
      data-appearance={appearanceAttr}
      style={rootStyle}
    >
      <div
        aria-hidden
        className="fs-theme-toggle__indicator"
        data-appearance={appearanceAttr}
        style={indicatorStyle}
      />

      <button
        type="button"
        role="radio"
        aria-checked={theme === "light"}
        onClick={() => onThemeChange("light")}
        style={buttonStyle(theme === "light")}
        aria-label="Light theme"
      >
        <SunIcon size={iconSize} />
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === "dark"}
        onClick={() => onThemeChange("dark")}
        style={buttonStyle(theme === "dark")}
        aria-label="Dark theme"
      >
        <MoonIcon size={iconSize} />
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === "system"}
        onClick={() => onThemeChange("system")}
        style={buttonStyle(theme === "system")}
        aria-label="System theme"
      >
        <MonitorIcon size={iconSize} />
      </button>
    </div>
  );
}
