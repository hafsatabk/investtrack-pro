import client from './client'

export const membersAPI = {
  getAll: (params) => client.get('/members', { params }),
  getById: (id) => client.get(`/members/${id}`),
  create: (data) => client.post('/members', data),
  update: (id, data) => client.patch(`/members/${id}`, data),
  delete: (id) => client.delete(`/members/${id}`),
  getDistinctRanks: () => client.get('/members/distinct/ranks'),
  exportCSV: () => client.get('/settings/export/csv', { responseType: 'blob' }),
  exportExcel: () => client.get('/settings/export/excel', { responseType: 'blob' }),
  exportPDF: () => client.get('/settings/export/pdf', { responseType: 'blob' })
}

export const analyticsAPI = {
  getSummary: () => client.get('/analytics/summary'),
  getMonthlyInvestment: () => client.get('/analytics/monthly-summary'),
  getInvestmentByRank: () => client.get('/analytics/investment-by-rank'),
  getShareDistribution: () => client.get('/analytics/share-distribution'),
  getMemberAnalysis: (memberId) => client.get(`/analytics/member/${memberId}`),
  getGrowthChart: () => client.get('/analytics/growth-chart')
}

export const settingsAPI = {
  getSettings: () => client.get('/settings'),
  updateSetting: (key, value) => client.patch(`/settings/${key}`, { value })
}

export const activityAPI = {
  getActivityLogs: (limit = 100, offset = 0) => client.get('/activity', { params: { limit, offset } })
}