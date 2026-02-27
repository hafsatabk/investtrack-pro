import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { analyticsAPI } from '../api/members'
import './Dashboard.css'

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [growthData, setGrowthData] = useState([])
  const [shareData, setShareData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [summaryRes, monthlyRes, growthRes, shareRes] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getMonthlyInvestment(),
        analyticsAPI.getInvestmentGrowth(),
        analyticsAPI.getShareDistribution()
      ])

      setSummary(summaryRes.data)
      setMonthlyData(monthlyRes.data)
      setGrowthData(growthRes.data)
      setShareData(shareRes.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="dashboard"><p>Loading dashboard...</p></div>
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {summary && (
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon">👥</div>
            <div className="summary-content">
              <h3>Total Members</h3>
              <p className="summary-value">{summary.total_members}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <h3>Total Capital Invested</h3>
              <p className="summary-value">₦{(summary.total_invested || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <h3>Total Shares Issued</h3>
              <p className="summary-value">{summary.total_shares}</p>
            </div>
          </div>

          <div className="summary-card success">
            <div className="summary-icon">✅</div>
            <div className="summary-content">
              <h3>Active Members</h3>
              <p className="summary-value">{summary.active_members}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">❌</div>
            <div className="summary-content">
              <h3>Inactive Members</h3>
              <p className="summary-value">{summary.inactive_members}</p>
            </div>
          </div>

          <div className="summary-card info">
            <div className="summary-icon">📈</div>
            <div className="summary-content">
              <h3>Portfolio Value</h3>
              <p className="summary-value">₦{(summary.portfolio_value || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="charts-grid">
        {monthlyData.length > 0 && (
          <div className="chart-card">
            <h3>Monthly Investment Summary</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `₦${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                />
                <Legend />
                <Bar dataKey="investment" fill={COLORS[0]} name="Investment" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {growthData.length > 0 && (
          <div className="chart-card">
            <h3>Investment Growth Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `₦${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                />
                <Legend />
                <Line type="monotone" dataKey="cumulative_investment" stroke={COLORS[1]} name="Cumulative Investment" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {shareData.length > 0 && (
          <div className="chart-card">
            <h3>Share Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={shareData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="shares"
                >
                  {shareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard