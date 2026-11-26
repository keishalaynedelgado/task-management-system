import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  KanbanSquare,
  Users,
  Building2,
  MessageSquare,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { formatRole, initials } from '../lib/labels'
import { cn } from '../lib/utils'
import BrandMark from './BrandMark'
import ThemeToggle from './ThemeToggle'

// `roles` mirrors the route guards in App.jsx so users only see pages they can open.
const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Reports', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Work',
    items: [
      { name: 'Tasks', path: '/tasks', icon: ClipboardList, roles: ['super_admin', 'admin'], end: true },
      { name: 'Task Board', path: '/tasks/board', icon: KanbanSquare },
    ],
  },
  {
    label: 'Administration',
    items: [
      { name: 'Users', path: '/users', icon: Users, roles: ['super_admin', 'admin'] },
      { name: 'Tenants', path: '/tenants', icon: Building2, roles: ['super_admin'] },
    ],
  },
  {
    label: 'Assistant',
    items: [{ name: 'AI Assistant', path: '/chat', icon: MessageSquare }],
  },
]

const visibleSections = (role) =>
  NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
  })).filter((section) => section.items.length > 0)

const findCurrentPage = (pathname) => {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.path) return { section: section.label, name: item.name }
    }
  }
  return null
}

const UserAvatar = ({ user, className }) => (
  <div
    className={cn(
      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary',
      className
    )}
  >
    {initials(user?.firstName, user?.lastName)}
  </div>
)

const SidebarContent = ({ user, onNavigate, onLogout }) => (
  <div className="flex h-full flex-col">
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
      <BrandMark />
      <p className="text-[15px] font-semibold tracking-tight text-foreground">Task Manager</p>
    </div>

    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {visibleSections(user?.role).map((section) => (
        <div key={section.label}>
          <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" aria-hidden="true" />
                      )}
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </nav>

    <div className="shrink-0 border-t border-sidebar-border p-3">
      <div className="flex items-center gap-3 rounded-md px-2 py-2">
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{formatRole(user?.role)}</p>
        </div>
        <button
          onClick={onLogout}
          title="Sign out"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sign out</span>
        </button>
      </div>
    </div>
  </div>
)

const Layout = () => {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const current = findCurrentPage(pathname)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent user={user} onLogout={logout} />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-sidebar-border bg-sidebar shadow-xl animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close menu</span>
            </button>
            <SidebarContent user={user} onNavigate={() => setMobileOpen(false)} onLogout={logout} />
          </aside>
        </div>
      )}

      <div className="bg-grid flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-card/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/70 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent lg:hidden"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-muted-foreground sm:inline">{current?.section || 'Workspace'}</span>
              <span className="hidden text-muted-foreground/50 sm:inline">/</span>
              <span className="truncate font-medium">{current?.name || 'Overview'}</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden h-6 w-px bg-border sm:block" />
            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="text-right leading-tight">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{formatRole(user?.role)}</p>
              </div>
              <UserAvatar user={user} />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
