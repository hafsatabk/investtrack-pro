import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { analyticsAPI } from '../api/members'
import '../styles/Analytics.css'

function Analytics() {
  const [summary, setSummary] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [rankData, setRankData] = useState([])
  const [shareData, setShareData] = useState([])
  const [growthData, setGrowthData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316']

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [summaryRes, monthlyRes, rankRes, shareRes, growthRes] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getMonthlyInvestment(),
        analyticsAPI.getInvestmentByRank(),
        analyticsAPI.getShareDistribution(),
        analyticsAPI.getGrowthChart()
      ])

      setSummary(summaryRes.data)
      setMonthlyData(monthlyRes.data || [])
      setRankData(rankRes.data || [])
      setShareData(shareRes.data || [])
      setGrowthData(growthRes.data || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="analytics"><p>Loading analytics...</p></div>

  return (
    <div className="analytics">
      <h1>Analytics & Reports</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {summary && (
        <div className="summary-cards">
          <div className="card">
            <h3>Total Members</h3>
            <p className="value">{summary.totalMembers}</p>
          </div>
          <div className="card">
            <h3>Active Members</h3>
            <p className="value">{summary.activeMembers}</p>
          </div>
          <div className="card">
            <h3>Total Invested</h3>
            <p className="value currency">${parseFloat(summary.totalInvested).toFixed(2)}</p>
          </div>
          <div className="card">
            <h3>Total Shares</h3>
            <p className="value">{summary.totalShares}</p>
          </div>
          <div className="card">
            <h3>Portfolio Value</h3>
            <p className="value currency">${parseFloat(summary.portfolioValue).toFixed(2)}</p>
          </div>
          <div className="card">
            <h3>Share Price</h3>
            <p className="value currency">${parseFloat(summary.sharePrice).toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="charts-container">
        {monthlyData.length > 0 && (
          <div className="chart-box">
            <h3>Monthly Investment Summary</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_investment" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {rankData.length > 0 && (
          <div className="chart-box">
            <h3>Investment by Rank</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rankData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rank_position" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_investment" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {shareData.length > 0 && (
          <div className="chart-box">
            <h3>Top 10 Share Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={shareData}
                  dataKey="number_of_shares"
                  nameKey="full_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {shareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {growthData.length > 0 && (
          <div className="chart-box">
            <h3>Investment Growth Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date_joined" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cumulative_investment" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics