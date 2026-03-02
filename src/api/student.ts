import client from './client'
import type {
  ApiResponse,
  StudentAssignmentResponse,
  CreateSubmissionRequest,
  MySubmissionResponse,
  SubmissionResponse,
  ClassDetailResponse,
} from '@/types/api'

export const studentApi = {
  // 내 과제 목록 조회 (특정 클래스)
  getMyAssignments(classId: string) {
    return client.get<ApiResponse<StudentAssignmentResponse[]>>(
      `/api/v1/courses/${classId}/assignments/me`,
    )
  },

  // 과제 제출
  submitAssignment(assignmentId: string, data: CreateSubmissionRequest) {
    return client.post<ApiResponse<null>>(
      `/api/v1/assignments/${assignmentId}/submissions`,
      data,
    )
  },

  // 내 제출물 조회 (특정 과제)
  getMySubmission(assignmentId: string) {
    return client.get<ApiResponse<SubmissionResponse>>(
      `/api/v1/assignments/${assignmentId}/submissions/me`,
    )
  },

  // 내 전체 제출물 목록
  getMySubmissions() {
    return client.get<ApiResponse<MySubmissionResponse[]>>('/api/v1/submissions/me')
  },

  // 클래스 상세 정보
  getClassDetail(classId: string) {
    return client.get<ApiResponse<ClassDetailResponse>>(`/api/v1/classes/${classId}`)
  },
}
