// 백엔드 API 응답 공통 래퍼
export interface ApiResponse<T> {
  resultType: 'SUCCESS' | 'FAIL'
  httpStatusCode: number
  message: string
  data: T | null
}

// 인증
export interface LoginRequest {
  identifier: string
  password: string
  role: 'PROFESSOR' | 'STUDENT'
}

export interface UserInfo {
  userId: string
  name: string
  principal: string
  role: string
}

// 대시보드
export interface DashboardResponse {
  summary: DashboardSummary
  recentSubmissions: RecentSubmission[]
  assignmentSubmissionRates: AssignmentSubmissionRate[]
}

export interface DashboardSummary {
  totalAssignments: number
  pendingReviewCount: number
  overallSubmissionRate: number
}

export interface RecentSubmission {
  studentName: string
  assignmentTitle: string
  submittedAt: string
  fileName: string
  fileUrl: string
}

export interface AssignmentSubmissionRate {
  assignmentId: string
  assignmentName: string
  submissionRate: number
}

// 과제 목록
export interface AssignmentListItem {
  assignmentId: string
  title: string
  classGroup: string
  deadline: string
  submissionRate: number
  submissionCount: number
  totalStudents: number
  professorName: string
  description: string
  topic: string
}

// 과제 상세
export interface AssignmentDetailResponse {
  assignmentId: string
  courseName: string
  title: string
  description: string
  week: string
  topic: string
  professorName: string
  deadline: string
  requirements: RequirementItem[]
  slackLink: string
}

export interface RequirementItem {
  id: number
  content: string
}

// 페이지네이션
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// 반 목록
export interface ClassListItem {
  classId: string
  className: string
  generation: number
  studentCount: number
}

// 과제 생성 요청
export interface AssignmentCreateRequest {
  classId: string
  title: string
  description: string
  week: string
  topic: string
  deadline: string
  requirements: string[]
}
