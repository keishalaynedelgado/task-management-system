import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TenantManagement from './pages/TenantManagement'
import UserManagement from './pages/UserManagement'
import TaskManagement from './pages/TaskManagement'
import TaskBoard from './pages/TaskBoard'
import AIChat from './pages/AIChat'
import Reports from './pages/Reports'

// Protected Route component
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
          Loading workspace...
        </div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="tenants" element={
            <ProtectedRoute roles={['super_admin']}>
              <TenantManagement />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="tasks" element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <TaskManagement />
            </ProtectedRoute>
          } />
          <Route path="tasks/board" element={<TaskBoard />} />
          <Route path="chat" element={<AIChat />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App