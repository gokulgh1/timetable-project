import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Departments from './pages/Departments'
import { Sections, Subjects, Teachers } from './pages/SetupPages'
import Generate from './pages/Generate'
import StudentView from './pages/StudentView'
import TeacherView from './pages/TeacherView'
import Settings from './pages/Settings'
import Constraints from './pages/Constraints'
import { Loading } from './components/UI'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏱</div>
        <div style={{ color: '#8892a4', fontSize: 14 }}>Loading TimetableAI...</div>
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/student-view" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute adminOnly><Departments /></ProtectedRoute>} />
        <Route path="/sections" element={<ProtectedRoute adminOnly><Sections /></ProtectedRoute>} />
        <Route path="/subjects" element={<ProtectedRoute adminOnly><Subjects /></ProtectedRoute>} />
        <Route path="/teachers" element={<ProtectedRoute adminOnly><Teachers /></ProtectedRoute>} />
        <Route path="/generate" element={<ProtectedRoute adminOnly><Generate /></ProtectedRoute>} />
        <Route path="/student-view" element={<ProtectedRoute><StudentView /></ProtectedRoute>} />
        <Route path="/teacher-view" element={<ProtectedRoute><TeacherView /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
        <Route path="/constraints" element={<ProtectedRoute><Constraints /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
