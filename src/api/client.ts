import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 401 응답 시 토큰 refresh 시도
let isRefreshing = false
let pendingRequests: (() => void)[] = []

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push(() => resolve(client(originalRequest)))
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await client.post('/api/v1/auth/refresh')
        pendingRequests.forEach((cb) => cb())
        pendingRequests = []
        return client(originalRequest)
      } catch {
        pendingRequests = []
        window.location.reload()
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default client
