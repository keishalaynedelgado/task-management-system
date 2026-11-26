import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, KanbanSquare, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import FormField from '../components/FormField'
import ThemeToggle from '../components/ThemeToggle'
import BrandMark from '../components/BrandMark'

// Accounts created by backend/scripts/seedDb.js. The demo backend accepts any password.
const DEMO_ACCOUNTS = [
  { role: 'Super Admin', username: 'superadmin' },
  { role: 'Admin', username: 'keisha_admin' },
  { role: 'Staff', username: 'vincent_dev' },
]

const FEATURES = [
  { icon: KanbanSquare, title: 'Task tracking', text: 'Plan, assign and follow work from pending to done.' },
  { icon: ShieldCheck, title: 'Role-based access', text: 'Separate tenants with admin and staff permissions.' },
  { icon: BarChart3, title: 'Reporting', text: 'Period comparisons, workload and AI-written summaries.' },
]

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ username, password })
      navigate('/dashboard')
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1fr_minmax(480px,560px)]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[hsl(222_47%_11%)] p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative flex items-center gap-3">
          <BrandMark />
          <span className="text-[15px] font-semibold tracking-tight">Task Manager</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Organize your team's work in one place.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            A multi-tenant workspace for assigning tasks, tracking progress and reporting on delivery.
          </p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10">
                  <Icon className="h-4 w-4 text-white/80" />
                </div>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-0.5 text-sm text-white/55">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Task Management System</p>
      </div>

      {/* Sign-in panel */}
      <div className="bg-grid flex flex-col">
        <div className="flex justify-end p-6">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <BrandMark className="mb-6 h-10 w-10 lg:hidden" />
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter your credentials to access your workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div role="alert" className="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <FormField id="username" label="Username">
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </FormField>

              <FormField id="password" label="Password">
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </FormField>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                )}
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-8 rounded-md border bg-muted/40 p-4">
              <p className="text-xs font-medium">Demo accounts</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Any password is accepted. Click to fill in.</p>
              <div className="mt-3 divide-y rounded-md border bg-card">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => {
                      setUsername(account.username)
                      setPassword('demo')
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors first:rounded-t-md last:rounded-b-md hover:bg-accent"
                  >
                    <span className="text-muted-foreground">{account.role}</span>
                    <span className="font-mono font-medium">{account.username}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
