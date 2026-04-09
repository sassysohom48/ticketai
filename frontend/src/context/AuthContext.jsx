import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const TOKEN_KEY = 'ticketai_token'
const USER_KEY  = 'ticketai_user'

function loadStored() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user  = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    return token && user ? { token, user } : { token: null, user: null }
  } catch {
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }) {
  const [{ token, user }, setAuth] = useState(loadStored)

  const setSession = useCallback((token, user) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setAuth({ token, user })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setAuth({ token: null, user: null })
  }, [])

  const isAdmin = user?.role === 'admin'
  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, isAdmin, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
