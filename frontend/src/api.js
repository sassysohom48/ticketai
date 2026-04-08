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

export const api = {
  health: () =>
    client.get('/health').then(r => r.data),

  predict: (subject, message) =>
    client.post('/predict', { subject, message }).then(r => r.data),

  getTickets: (department = 'All') =>
    client.get('/tickets', { params: { department } }).then(r => r.data),

  getDepartments: () =>
    client.get('/departments').then(r => r.data),

  feedback: (ticket_id, correct_department) =>
    client.post('/feedback', { ticket_id, correct_department }).then(r => r.data),

  getStats: () =>
    client.get('/stats').then(r => r.data),
}
