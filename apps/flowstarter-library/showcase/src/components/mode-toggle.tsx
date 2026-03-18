import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "./theme-provider"

type IconComponent = (props: { className?: string; strokeWidth?: number }) => JSX.Element

const SunIcon = Sun as unknown as IconComponent
const MoonIcon = Moon as unknown as IconComponent
const MonitorIcon = Monitor as unknown as IconComponent

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-0.5 p-1 bg-slate-200 dark:bg-slate-700/50 rounded-full border border-slate-300 dark:border-slate-600/50">
      <button
        onClick={() => setTheme("light")}
        className={`p-2.5 rounded-full transition-all duration-200 ${
          theme === "light"
            ? "bg-white text-slate-700 shadow-md"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        }`}
        aria-label="Light mode"
      >
        <SunIcon className="h-4 w-4" strokeWidth={2} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2.5 rounded-full transition-all duration-200 ${
          theme === "dark"
            ? "bg-white text-slate-700 shadow-md"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        }`}
        aria-label="Dark mode"
      >
        <MoonIcon className="h-4 w-4" strokeWidth={2} />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-2.5 rounded-full transition-all duration-200 ${
          theme === "system"
            ? "bg-white text-slate-700 shadow-md"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        }`}
        aria-label="System mode"
      >
        <MonitorIcon className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  )
}
