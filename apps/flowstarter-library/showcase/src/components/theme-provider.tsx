import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"
type ThemeProviderState = {
  theme: Theme
  resolvedTheme: "dark" | "light"
  setTheme: (theme: Theme) => void
}

const COOKIE_NAME = 'flowstarter_theme'
const MAX_AGE = 365 * 24 * 60 * 60

function getCookieDomain(): string {
  if (typeof window === 'undefined') return ''
  const h = window.location.hostname
  if (h.includes('flowstarter.dev')) return '.flowstarter.dev'
  if (h.includes('flowstarter.app')) return '.flowstarter.app'
  return ''
}

function readCookie(): Theme {
  if (typeof document === 'undefined') return 'system'
  const match = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(COOKIE_NAME + '='))
  const val = match?.split('=')[1]
  if (val && ['light', 'dark', 'system'].includes(val)) return val as Theme
  // migrate localStorage
  const ls = localStorage.getItem('vite-ui-theme') || localStorage.getItem('theme') || localStorage.getItem('flowstarter_theme')
  if (ls && ['light', 'dark', 'system'].includes(ls)) { writeCookie(ls as Theme); return ls as Theme }
  return 'system'
}

function writeCookie(theme: Theme) {
  const domain = getCookieDomain()
  document.cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=${MAX_AGE}; SameSite=Lax${domain ? `; domain=${domain}` : ''}`
  localStorage.setItem('flowstarter_theme', theme)
}

const initialState: ThemeProviderState = { theme: 'system', resolvedTheme: 'light', setTheme: () => null }
const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({ children, defaultTheme = 'system' }: { children: React.ReactNode; defaultTheme?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme
    return readCookie()
  })
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("light")

  useEffect(() => {
    const root = window.document.documentElement
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme
    setResolvedTheme(resolved)
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    root.setAttribute('data-theme', resolved)
  }, [theme])

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setThemeState('system') // re-trigger effect
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    writeCookie(newTheme)
    setThemeState(newTheme)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
