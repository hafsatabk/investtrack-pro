import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { membersAPI } from '../api/members'
import '../styles/Members.css'

function Members({ userRole }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ rank: '', status: '', minInvestment: '', maxInvestment: '' })
  const [ranks, setRanks] = useState([])

  useEffect(() => {
    loadMembers()
    loadRanks()
  }, [search, filters])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const params = { search }
      if (filters.rank) params.rank = filters.rank
      if (filters.status) params.status = filters.status
      if (filters.minInvestment) params.minInvestment = filters.minInvestment
      if (filters.maxInvestment) params.maxInvestment = filters.maxInvestment

      const response = await membersAPI.getAll(params)
      setMembers(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const loadRanks = async () => {
    try {
      const response = await membersAPI.getDistinctRanks()
      setRanks(response.data || [])
    } catch (err) {
      console.error('Failed to load ranks:', err)
    }
  }

  const handleDelete = async (id) => {
    if (userRole !== 'admin' && userRole !== 'data_entry') {
      alert('You do not have permission to delete members')
      return
    }

    if (confirm('Are you sure you want to delete this member?')) {
      try {
        await membersAPI.delete(id)
        setMembers(members.filter(m => m.id !== id))
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete member')
      }
    }
  }

  const handleExport = async (format) => {
    try {
      let response
      if (format === 'csv') response = await membersAPI.exportCSV()
      else if (format === 'excel') response = await membersAPI.exportExcel()
      else if (format === 'pdf') response = await membersAPI.exportPDF()

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `members.${format}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (err) {
      setError(err.response?.data?.error || `Failed to export ${format}`)
    }
  }

  return (
    <div className="members-page">
      <div className="members-header">
        <h1>Members</h1>
        <div className="members-actions">
          {(userRole === 'admin' || userRole === 'data_entry') && (
            <Link to="/members/new" className="btn btn-primary">+ Add Member</Link>
          )}
          <button onClick={() => handleExport('csv')} className="btn btn-secondary">📥 CSV</button>
          <button onClick={() => handleExport('excel')} className="btn btn-secondary">📥 Excel</button>
          <button onClick={() => handleExport('pdf')} className="btn btn-secondary">📥 PDF</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="members-filters">
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={filters.rank}
          onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
          className="filter-select"
        >
          <option value="">All Ranks</option>
          {ranks.map(r => (
            <option key={r.rank_position} value={r.rank_position}>{r.rank_position}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <p>Loading members...</p>
      ) : (
        <div className="members-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Rank</th>
                <th>Phone</th>
                <th>Investment</th>
                <th>Shares</th>
                <th>Date Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan="9">No members found</td></tr>
              ) : (
                members.map(member => (
                  <tr key={member.id}>
                    <td>{member.member_id}</td>
                    <td>{member.full_name}</td>
                    <td>{member.rank_position}</td>
                    <td>{member.phone_number}</td>
                    <td className="currency">{parseFloat(member.amount_invested).toFixed(2)}</td>
                    <td>{member.number_of_shares}</td>
                    <td>{member.date_joined}</td>
                    <td><span className={`status ${member.status.toLowerCase()}`}>{member.status}</span></td>
                    <td>
                      <Link to={`/members/${member.id}`} className="action-link">Edit</Link>
                      {(userRole === 'admin') && (
                        <button onClick={() => handleDelete(member.id)} className="action-link delete">Delete</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Members