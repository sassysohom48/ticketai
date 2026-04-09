/**
 * api.js — centralised Axios calls to the Flask backend
 *
 * In development, Vite proxies these paths to http://localhost:5000
 * In production, set VITE_API_URL to your deployed backend URL.
 */
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const client = axios.create({
  baseURL: BASE,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from localStorage on every request
client.interceptors.request.use(config => {
  const token = localStorage.getItem('ticketai_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const api = {
  // ── Auth ────────────────────────────────────────────────────
  login: (username, password) =>
    client.post('/auth/login', { username, password }).then(r => r.data),

  register: (username, password, email, phone) =>
    client.post('/auth/register', { username, password, email, phone }).then(r => r.data),

  // ── Core ────────────────────────────────────────────────────
  health: () =>
    client.get('/health').then(r => r.data),

  predict: (subject, message) =>
    client.post('/predict', { subject, message }).then(r => r.data),

  // ── User ────────────────────────────────────────────────────
  getUserTickets: () =>
    client.get('/user/tickets').then(r => r.data),

  // ── Admin ───────────────────────────────────────────────────
  getTickets: (department = 'All') =>
    client.get('/tickets', { params: { department } }).then(r => r.data),

  getDepartments: () =>
    client.get('/departments').then(r => r.data),

  feedback: (ticket_id, correct_department) =>
    client.post('/feedback', { ticket_id, correct_department }).then(r => r.data),

  getStats: () =>
    client.get('/stats').then(r => r.data),
}
