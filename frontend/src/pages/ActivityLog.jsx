import React, { useState, useEffect } from 'react'
import { activityAPI } from '../api/members'
import './ActivityLog.css'

function ActivityLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 50

  useEffect(() => {
    loadLogs()
  }, [page])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const response = await activityAPI.getActivityLogs(limit, page * limit)
      setLogs(response.data.logs || [])
      setTotal(response.data.total || 0)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load activity logs')
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return '#10b981'
      case 'UPDATE':
        return '#f59e0b'
      case 'DELETE':
        return '#ef4444'
      case 'EXPORT':
        return '#3b82f6'
      default:
        return '#6b7280'
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="activity-log">
      <h1>Activity Log</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading activity logs...</div>
      ) : logs.length === 0 ? (
        <div className="empty-state">No activity logs found</div>
      ) : (
        <>
          <div className="logs-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td><strong>{log.username}</strong></td>
                    <td>
                      <span style={{ color: getActionColor(log.action), fontWeight: 'bold' }}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.entity_type} (ID: {log.entity_id || 'N/A'})</td>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button onClick={() => setPage(page - 1)} disabled={page === 0} className="btn btn-secondary">← Previous</button>
            <span>Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1} className="btn btn-secondary">Next →</button>
          </div>
        </>
      )}
    </div>
  )
}

export default ActivityLog