import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export function setToken(token) {
  localStorage.setItem('token', token)
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export function getToken() {
  return localStorage.getItem('token')
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  delete axios.defaults.headers.common['Authorization']
}

export const authAPI = {
  login: async (username, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password })
    setToken(response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    return response.data
  },

  getMe: async () => {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  getUsers: async () => {
    const response = await axios.get(`${API_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  createUser: async (data) => {
    const response = await axios.post(`${API_URL}/auth/users`, data, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  updateUserRole: async (id, role) => {
    const response = await axios.patch(`${API_URL}/auth/users/${id}`, { role }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  },

  deleteUser: async (id) => {
    const response = await axios.delete(`${API_URL}/auth/users/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return response.data
  }
}