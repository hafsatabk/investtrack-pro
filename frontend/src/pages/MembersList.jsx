import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Edit2, Trash2, Plus, Download, Search } from 'lucide-react'
import { membersAPI } from '../api/members'
import Papa from 'papaparse'
import ExcelJS from 'exceljs'
import './MembersList.css'

function MembersList() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  useEffect(() => {
    loadMembers()
  }, [page, filter])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const response = await membersAPI.getAll({ page, limit: pageSize, status: filter === 'all' ? null : filter })
      setMembers(response.data.members)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await membersAPI.delete(id)
        loadMembers()
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete member')
      }
    }
  }

  const filteredMembers = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.member_id.toLowerCase().includes(search.toLowerCase())
  )

  const exportCSV = () => {
    const csv = Papa.unparse(filteredMembers)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `members-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Members')
    
    worksheet.columns = [
      { header: 'Member ID', key: 'member_id', width: 15 },
      { header: 'Full Name', key: 'full_name', width: 20 },
      { header: 'Rank/Position', key: 'rank', width: 15 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 20 },
      { header: 'Amount Invested', key: 'amount_invested', width: 15 },
      { header: 'Shares', key: 'number_of_shares', width: 10 },
      { header: 'Status', key: 'status', width: 10 }
    ]

    filteredMembers.forEach(member => {
      worksheet.addRow(member)
    })

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3b82f6' } }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `members-${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
  }

  return (
    <div className="members-container">
      <div className="members-header">
        <h1>Members Management</h1>
        <Link to="/members/new" className="btn btn-primary">
          <Plus size={18} /> Add Member
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="members-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or member ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1) }} className="filter-select">
            <option value="all">All Members</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <button className="btn btn-secondary btn-small" onClick={exportCSV}>
            <Download size={16} /> CSV
          </button>
          <button className="btn btn-secondary btn-small" onClick={exportExcel}>
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading members...</div>
      ) : filteredMembers.length === 0 ? (
        <div className="empty-state">No members found</div>
      ) : (
        <div className="members-table-wrapper">
          <table className="members-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Full Name</th>
                <th>Rank/Position</th>
                <th>Phone</th>
                <th>Amount Invested</th>
                <th>Shares</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => (
                <tr key={member.id}>
                  <td>{member.member_id}</td>
                  <td>{member.full_name}</td>
                  <td>{member.rank}</td>
                  <td>{member.phone}</td>
                  <td>₦{member.amount_invested.toLocaleString()}</td>
                  <td>{member.number_of_shares}</td>
                  <td>
                    <span className={`badge badge-${member.status === 'active' ? 'success' : 'danger'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/members/${member.id}/edit`} className="btn-icon" title="Edit">
                        <Edit2 size={18} />
                      </Link>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => handleDelete(member.id)}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default MembersList