import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, Moon, Sun } from 'lucide-react'
import './Layout.css'

function Layout({ user, onLogout, darkMode, setDarkMode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/members', label: 'Members', icon: '👥' },
    ...(user?.role === 'admin' ? [
      { path: '/settings', label: 'Settings', icon: '⚙️' },
      { path: '/activity-log', label: 'Activity Log', icon: '📝' }
    ] : [])
  ]

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1 className="logo">IMS</h1>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="main-content">
        <header className="header">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="header-title">
            <h2>Organization Investment & Member Management System</h2>
          </div>

          <div className="header-actions">
            <button
              className="btn-icon"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="user-menu">
              <span className="user-name">{user?.full_name}</span>
              <span className="user-role">{user?.role}</span>
            </div>

            <button
              className="btn-logout"
              onClick={onLogout}
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout