import React, { useState, useEffect } from 'react'
import { authAPI } from '../api/auth'
import '../styles/Users.css'

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ username: '', password: '', role: 'viewer' })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getUsers()
      setUsers(response || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setMessage('')
      
      if (!formData.username || !formData.password) {
        setError('Username and password are required')
        return
      }

      await authAPI.createUser(formData)
      setMessage('User created successfully!')
      setFormData({ username: '', password: '', role: 'viewer' })
      setShowForm(false)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user')
    }
  }

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setError('')
      setMessage('')
      
      await authAPI.updateUserRole(userId, newRole)
      setMessage('User role updated successfully!')
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user role')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        setError('')
        setMessage('')
        
        await authAPI.deleteUser(userId)
        setMessage('User deleted successfully!')
        loadUsers()
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete user')
      }
    }
  }

  if (loading) return <div className="users"><p>Loading users...</p></div>

  return (
    <div className="users">
      <div className="users-header">
        <h1>User Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? '✕ Cancel' : '+ Add User'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {showForm && (
        <div className="create-user-form">
          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleFormChange}
                placeholder="Enter username"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleFormChange}
                placeholder="Enter password"
                required
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleFormChange}>
                <option value="viewer">Viewer (Read-only)</option>
                <option value="data_entry">Data Entry (Can add/edit members)</option>
                <option value="admin">Admin (Full access)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-success">Create User</button>
          </form>
        </div>
      )}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="4">No users found</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td><strong>{user.username}</strong></td>
                  <td>
                    <select 
                      value={user.role} 
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      className="role-select"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="data_entry">Data Entry</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => handleDeleteUser(user.id)} 
                      className="btn btn-delete btn-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Users