import axios from 'axios'

// FastAPI 전용 클라이언트 (Spring Boot와 별개 서버)
const fastApiClient = axios.create({
  baseURL: import.meta.env.VITE_FASTAPI_BASE_URL || 'http://localhost:8000',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default fastApiClient
