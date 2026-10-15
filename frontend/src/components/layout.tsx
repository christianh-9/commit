import { History, House, Plus, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router'
import { token } from '@/api/client'
import { cn } from '@/lib/utils'

export function RequireAuth({ children }: { children: ReactNode }) {
  return token.get() ? children : <Navigate to="/login" replace />
}

const tabs = [
  { to: '/', label: 'Home', icon: House },
  { to: '/log', label: 'Log', icon: Plus },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Layout() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <Outlet />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground outline-none focus-visible:bg-accent',
                    isActive && 'text-primary',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn('grid h-7 w-12 place-items-center rounded-full', isActive && 'bg-accent')}>
                      <Icon className="size-5" aria-hidden />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4">
      <h1 className="text-[2rem] leading-none font-extrabold">{title}</h1>
      {children}
    </header>
  )
}
