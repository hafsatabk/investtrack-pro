import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { membersAPI } from '../api/members'
import './MemberForm.css'

function MemberForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    full_name: '',
    rank: '',
    phone: '',
    email: '',
    amount_invested: '',
    number_of_shares: '',
    date_joined: new Date().toISOString().split('T')[0],
    last_payment_date: new Date().toISOString().split('T')[0],
    status: 'active'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      loadMember()
    }
  }, [id])

  const loadMember = async () => {
    try {
      setLoading(true)
      const response = await membersAPI.getById(id)
      setFormData(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load member')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount_invested' || name === 'number_of_shares' ? parseFloat(value) || '' : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (id) {
        await membersAPI.update(id, formData)
      } else {
        await membersAPI.create(formData)
      }
      navigate('/members')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save member')
    } finally {
      setLoading(false)
    }
  }

  if (loading && id) {
    return <div className="member-form">Loading...</div>
  }

  return (
    <div className="member-form">
      <h1>{id ? 'Edit Member' : 'Add New Member'}</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label htmlFor="full_name">Full Name *</label>
          <input
            id="full_name"
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            placeholder="John Doe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="rank">Rank/Position *</label>
          <input
            id="rank"
            type="text"
            name="rank"
            value={formData.rank}
            onChange={handleChange}
            required
            placeholder="Director, Member, etc."
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number *</label>
          <input
            id="phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="+234 XXX XXX XXXX"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount_invested">Amount Invested *</label>
          <input
            id="amount_invested"
            type="number"
            name="amount_invested"
            value={formData.amount_invested}
            onChange={handleChange}
            required
            placeholder="50000"
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label htmlFor="number_of_shares">Number of Shares *</label>
          <input
            id="number_of_shares"
            type="number"
            name="number_of_shares"
            value={formData.number_of_shares}
            onChange={handleChange}
            required
            placeholder="10"
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label htmlFor="date_joined">Date Joined *</label>
          <input
            id="date_joined"
            type="date"
            name="date_joined"
            value={formData.date_joined}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="last_payment_date">Last Payment Date *</label>
          <input
            id="last_payment_date"
            type="date"
            name="last_payment_date"
            value={formData.last_payment_date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status *</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : id ? 'Update Member' : 'Add Member'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/members')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default MemberForm