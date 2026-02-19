import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "./theme-provider"

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
        <Sun className="h-4 w-4" strokeWidth={2} />
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
        <Moon className="h-4 w-4" strokeWidth={2} />
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
        <Monitor className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  )
}
