import client from './client'
import type {
  ApiResponse,
  LoginRequest,
  UserInfo,
  SignUpRequest,
  SendCodeResponse,
  VerifyCodeResponse,
  SignUpResponse,
} from '@/types/api'

export const authApi = {
  login(data: LoginRequest) {
    return client.post<ApiResponse<null>>('/api/v1/auth/login', data)
  },

  logout() {
    return client.post<ApiResponse<null>>('/api/v1/auth/logout')
  },

  refresh() {
    return client.post<ApiResponse<null>>('/api/v1/auth/refresh')
  },

  getMe() {
    return client.get<ApiResponse<UserInfo>>('/api/v1/users/me')
  },

  // 슬랙 이메일로 DM 인증 코드 발송 → slack_user_id 반환
  sendVerificationCode(email: string) {
    return client.post<SendCodeResponse>('/auth/slack/send-code', { email })
  },

  // slack_user_id + 코드 검증 → temp_token 반환
  verifyCode(slackUserId: string, code: string) {
    return client.post<VerifyCodeResponse>('/auth/slack/verify-code', {
      slack_user_id: slackUserId,
      code,
    })
  },

  // temp_token + 회원 정보로 최종 가입 → student_id 반환
  signup(data: SignUpRequest) {
    return client.post<SignUpResponse>('/auth/signup', data)
  },
}
