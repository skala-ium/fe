<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Sidebar from './side/Sidebar.vue'
import { studentApi, assignmentApi } from '@/api'
import type { SubmissionResponse, CreateSubmissionRequest } from '@/types/api'

const props = defineProps<{
  activeMenu: string
  assignmentId: string
}>()

const emit = defineEmits<{
  navigate: [menuId: string]
  logout: []
}>()

// Assignment Info
const assignmentTitle = ref('')
const assignmentDescription = ref('')
const deadline = ref('')
const maxScore = ref(0)

// Submission Data
const mySubmission = ref<SubmissionResponse | null>(null)
const hasSubmitted = ref(false)
const loading = ref(true)

// Form Data
const contentText = ref('')
const fileUrl = ref('')
const fileName = ref('')
const submitting = ref(false)

const isDeadlinePassed = computed(() => {
  if (!deadline.value) return false
  return new Date(deadline.value) < new Date()
})

const canSubmit = computed(() => {
  return !hasSubmitted.value && !isDeadlinePassed.value && contentText.value.trim().length > 0
})

onMounted(async () => {
  try {
    // Load assignment details
    const assignmentRes = await assignmentApi.getAssignmentDetail(props.assignmentId)
    if (assignmentRes.data.resultType === 'SUCCESS' && assignmentRes.data.data) {
      const data = assignmentRes.data.data
      assignmentTitle.value = data.title
      assignmentDescription.value = data.description
      deadline.value = data.deadline
      maxScore.value = data.maxScore
    }

    // Load my submission if exists
    try {
      const submissionRes = await studentApi.getMySubmission(props.assignmentId)
      if (submissionRes.data.resultType === 'SUCCESS' && submissionRes.data.data) {
        mySubmission.value = submissionRes.data.data
        hasSubmitted.value = true
      }
    } catch (err: any) {
      // 404 means no submission yet - that's okay
      if (err.response?.status !== 404) {
        console.error('제출물 조회 실패:', err)
      }
    }
  } catch (err) {
    console.error('과제 정보 로드 실패:', err)
  } finally {
    loading.value = false
  }
})

const handleSubmit = async () => {
  if (!canSubmit.value) return

  submitting.value = true
  try {
    const payload: CreateSubmissionRequest = {
      contentText: contentText.value,
      fileUrl: fileUrl.value || '',
      fileName: fileName.value || '',
    }

    const res = await studentApi.submitAssignment(props.assignmentId, payload)
    if (res.data.resultType === 'SUCCESS') {
      alert('과제가 성공적으로 제출되었습니다.')
      // Reload submission data
      const submissionRes = await studentApi.getMySubmission(props.assignmentId)
      if (submissionRes.data.resultType === 'SUCCESS' && submissionRes.data.data) {
        mySubmission.value = submissionRes.data.data
        hasSubmitted.value = true
      }
    }
  } catch (err: any) {
    console.error('과제 제출 실패:', err)
    alert('과제 제출에 실패했습니다: ' + (err.response?.data?.message || err.message))
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  emit('navigate', 'assignments')
}
</script>

<template>
  <div class="app-container">
    <Sidebar :active-menu="activeMenu" @navigate="emit('navigate', $event)" @logout="emit('logout')" />
    <div class="main-content">
      <header class="top-header">
        <div class="header-actions">
          <button class="btn-back" @click="goBack">
            <i class="bi bi-arrow-left"></i> 목록으로
          </button>
        </div>
      </header>

      <main class="content-area">
        <div v-if="loading" style="text-align: center; padding: 4rem; color: #6b7280">로딩 중...</div>
        <template v-else>
          <!-- Assignment Info Card -->
          <div class="dashboard-card">
            <div class="assignment-header">
              <h1>{{ assignmentTitle }}</h1>
              <div class="assignment-meta">
                <span class="meta-item">
                  <i class="bi bi-calendar-event"></i>
                  마감: {{ new Date(deadline).toLocaleString('ko-KR') }}
                </span>
                <span class="meta-item">
                  <i class="bi bi-star"></i>
                  배점: {{ maxScore }}점
                </span>
                <span
                  v-if="isDeadlinePassed"
                  class="badge badge-danger"
                >
                  <i class="bi bi-exclamation-triangle"></i> 마감됨
                </span>
                <span
                  v-else-if="hasSubmitted"
                  class="badge badge-success"
                >
                  <i class="bi bi-check-circle"></i> 제출 완료
                </span>
                <span
                  v-else
                  class="badge badge-pending"
                >
                  <i class="bi bi-clock"></i> 미제출
                </span>
              </div>
            </div>

            <div class="assignment-description">
              <h3>과제 설명</h3>
              <p>{{ assignmentDescription }}</p>
            </div>
          </div>

          <!-- My Submission (if exists) -->
          <div v-if="hasSubmitted && mySubmission" class="dashboard-card" style="margin-top: 1.5rem">
            <div class="card-header">
              <h3>내 제출물</h3>
              <span class="submission-date">
                제출일: {{ new Date(mySubmission.submittedAt).toLocaleString('ko-KR') }}
              </span>
            </div>
            <div class="submission-content">
              <div class="content-section">
                <label>제출 내용</label>
                <div class="content-text">{{ mySubmission.contentText }}</div>
              </div>
              <div v-if="mySubmission.fileUrl" class="content-section">
                <label>첨부 파일</label>
                <a :href="mySubmission.fileUrl" target="_blank" class="file-link">
                  <i class="bi bi-file-earmark-arrow-down"></i>
                  {{ mySubmission.fileUrl }}
                </a>
              </div>
              <div class="content-section">
                <label>상태</label>
                <span class="badge" :class="mySubmission.status === '채점 완료' ? 'badge-success' : 'badge-pending'">
                  {{ mySubmission.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Submission Form (if not submitted and not past deadline) -->
          <div v-if="!hasSubmitted && !isDeadlinePassed" class="dashboard-card" style="margin-top: 1.5rem">
            <div class="card-header">
              <h3>과제 제출</h3>
            </div>
            <form @submit.prevent="handleSubmit" class="submission-form">
              <div class="form-group">
                <label for="contentText">제출 내용 <span class="required">*</span></label>
                <textarea
                  id="contentText"
                  v-model="contentText"
                  rows="8"
                  placeholder="과제 내용을 입력하세요..."
                  required
                ></textarea>
              </div>

              <div class="form-group">
                <label for="fileUrl">첨부 파일 URL (선택)</label>
                <input
                  id="fileUrl"
                  v-model="fileUrl"
                  type="url"
                  placeholder="https://example.com/file.pdf"
                />
              </div>

              <div class="form-group">
                <label for="fileName">파일 이름 (선택)</label>
                <input
                  id="fileName"
                  v-model="fileName"
                  type="text"
                  placeholder="예: assignment1.pdf"
                />
              </div>

              <div class="form-actions">
                <button
                  type="submit"
                  class="btn-submit"
                  :disabled="!canSubmit || submitting"
                >
                  <i class="bi bi-send"></i>
                  {{ submitting ? '제출 중...' : '과제 제출' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Deadline Passed Message -->
          <div v-if="!hasSubmitted && isDeadlinePassed" class="dashboard-card alert-danger" style="margin-top: 1.5rem">
            <i class="bi bi-exclamation-triangle"></i>
            <p>마감 기한이 지나 과제를 제출할 수 없습니다.</p>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
}

.main-content {
  margin-left: 260px;
  min-height: 100vh;
  background-color: #f3f4f6;
  flex: 1;
}

.top-header {
  background-color: #ffffff;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background-color: #e5e7eb;
}

.content-area {
  padding: 2rem;
}

.dashboard-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.assignment-header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.assignment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.meta-item i {
  color: #9ca3af;
}

.assignment-description {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.assignment-description h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.assignment-description p {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.submission-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.submission-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.content-section label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.content-text {
  padding: 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #1f2937;
  white-space: pre-wrap;
}

.file-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #ea580c;
  text-decoration: none;
  transition: all 0.2s ease;
}

.file-link:hover {
  background-color: #e5e7eb;
  border-color: #ea580c;
}

.submission-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.required {
  color: #dc2626;
}

.form-group textarea,
.form-group input {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #1f2937;
  transition: border-color 0.2s ease;
}

.form-group textarea:focus,
.form-group input:focus {
  outline: none;
  border-color: #ea580c;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #ea580c;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-submit:hover:not(:disabled) {
  background-color: #c2410c;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-success {
  background-color: #dcfce7;
  color: #16a34a;
}

.badge-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.badge-danger {
  background-color: #fee2e2;
  color: #dc2626;
}

.alert-danger {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  padding: 1.5rem;
}

.alert-danger i {
  font-size: 1.5rem;
  color: #dc2626;
}

.alert-danger p {
  margin: 0;
  font-size: 0.9375rem;
  color: #991b1b;
}
</style>
