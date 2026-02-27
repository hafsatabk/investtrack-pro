import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { getToken, logout } from './api/auth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import MemberForm from './pages/MemberForm'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Users from './pages/Users'
import ActivityLog from './pages/ActivityLog'
import './App.css'

function PrivateRoute({ children, isAuthenticated, userRole }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  return children
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })

  useEffect(() => {
    const token = getToken()
    if (token) {
      setIsAuthenticated(true)
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const handleLogout = () => {
    logout()
    setIsAuthenticated(false)
    setUser(null)
  }

  if (loading) {
    return <div className="loading-screen">Loading...</div>
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage setIsAuthenticated={setIsAuthenticated} setUser={setUser} /> : <Navigate to="/dashboard" />} />
        
        <Route
          element={isAuthenticated ? <Layout user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/login" />}
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<Members userRole={user?.role} />} />
          <Route path="/members/new" element={<MemberForm userRole={user?.role} />} />
          <Route path="/members/:id" element={<MemberForm userRole={user?.role} />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings userRole={user?.role} />} />
          {user?.role === 'admin' && (
            <>
              <Route path="/users" element={<Users />} />
              <Route path="/activity" element={<ActivityLog />} />
            </>
          )}
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App