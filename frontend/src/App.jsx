import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Tasks from './pages/Tasks'
import EmployeePortal from './pages/EmployeePortal'

// loading spinner
function Spinner() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-orange-100 border-t-orange-600 animate-spin" />
        <p className="text-stone-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}

// admin layout with navbar
function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-6 pt-24">
        {children}
      </main>
    </div>
  )
}

// admin-only route guard
function AdminRoute({ children }) {
  const { user, userRole, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (userRole !== 'admin') return <Navigate to="/portal" replace />
  return <AdminLayout>{children}</AdminLayout>
}

// employee-only route guard
function EmployeeRoute({ children }) {
  const { user, userRole, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (userRole !== 'employee') return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { user, userRole, loading } = useAuth()
  if (loading) return <Spinner />

  const home = user
    ? (userRole === 'employee' ? '/portal' : '/dashboard')
    : '/login'

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={home} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={home} /> : <Register />} />

      {/* admin routes — wrapped in AdminRoute which includes AdminLayout */}
      <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/employees" element={<AdminRoute><Employees /></AdminRoute>} />
      <Route path="/tasks" element={<AdminRoute><Tasks /></AdminRoute>} />

      {/* employee route */}
      <Route path="/portal" element={<EmployeeRoute><EmployeePortal /></EmployeeRoute>} />

      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
