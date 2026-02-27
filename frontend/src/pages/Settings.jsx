import React, { useState, useEffect } from 'react'
import { settingsAPI } from '../api/members'
import './Settings.css'

function Settings({ userRole }) {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await settingsAPI.getSettings()
      setSettings(response.data || {})
      setFormData(response.data || {})
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSave = async () => {
    if (userRole !== 'admin') {
      setError('Only admins can modify settings')
      return
    }

    try {
      setError('')
      setMessage('')
      
      for (const [key, value] of Object.entries(formData)) {
        if (value !== settings[key]) {
          await settingsAPI.updateSetting(key, value)
        }
      }

      setSettings(formData)
      setMessage('Settings updated successfully!')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings')
    }
  }

  if (loading) return <div className="settings"><p>Loading settings...</p></div>

  return (
    <div className="settings">
      <h1>Settings</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="settings-container">
        <div className="settings-card">
          <h3>Financial Configuration</h3>
          
          <div className="form-group">
            <label>Share Price ($)</label>
            <input
              type="number"
              name="share_price"
              step="0.01"
              value={formData.share_price || ''}
              onChange={handleChange}
              disabled={userRole !== 'admin'}
            />
            <small>Price per share for valuation calculations</small>
          </div>

          <div className="form-group">
            <label>Profit Percentage (%)</label>
            <input
              type="number"
              name="profit_percentage"
              step="0.1"
              value={formData.profit_percentage || ''}
              onChange={handleChange}
              disabled={userRole !== 'admin'}
            />
            <small>Percentage profit to be calculated on investments</small>
          </div>

          {userRole === 'admin' && (
            <button onClick={handleSave} className="btn btn-primary">Save Settings</button>
          )}
        </div>

        <div className="settings-card">
          <h3>System Information</h3>
          <p><strong>Application:</strong> Investment Management System v1.0</p>
          <p><strong>Database:</strong> SQLite</p>
          <p><strong>API Server:</strong> Node.js + Express</p>
          <p><strong>Frontend:</strong> React</p>
        </div>

        <div className="settings-card">
          <h3>User Role Permissions</h3>
          <div className="permissions-table">
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Admin</th>
                  <th>Data Entry</th>
                  <th>Viewer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>View Dashboard</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>View Members</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Add/Edit Members</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>✗</td>
                </tr>
                <tr>
                  <td>Delete Members</td>
                  <td>✓</td>
                  <td>✗</td>
                  <td>✗</td>
                </tr>
                <tr>
                  <td>View Analytics</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Export Data</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>✗</td>
                </tr>
                <tr>
                  <td>Modify Settings</td>
                  <td>✓</td>
                  <td>✗</td>
                  <td>✗</td>
                </tr>
                <tr>
                  <td>Manage Users</td>
                  <td>✓</td>
                  <td>✗</td>
                  <td>✗</td>
                </tr>
                <tr>
                  <td>View Activity Log</td>
                  <td>✓</td>
                  <td>✗</td>
                  <td>✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings