<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Sidebar from './side/Sidebar.vue'
import { studentApi, classApi } from '@/api'
import type { ClassListItem, StudentAssignmentResponse, MySubmissionResponse } from '@/types/api'

const props = defineProps<{
  activeMenu: string
}>()

const emit = defineEmits<{
  navigate: [menuId: string, params?: any]
  logout: []
}>()

// Data
const myClass = ref<ClassListItem | null>(null)
const assignments = ref<StudentAssignmentResponse[]>([])
const recentSubmissions = ref<MySubmissionResponse[]>([])
const loading = ref(true)

// Load data
onMounted(async () => {
  try {
    // 내 클래스 정보 로드
    const classRes = await classApi.getClasses()
    if (classRes.data.resultType === 'SUCCESS' && classRes.data.data) {
      // 학생은 하나의 반에만 속하므로 첫 번째 클래스가 내 클래스
      if (classRes.data.data.length > 0) {
        myClass.value = classRes.data.data[0]
        await loadAssignments(myClass.value.classId)
      }
    }

    // 최근 제출 목록 로드
    const submissionRes = await studentApi.getMySubmissions()
    if (submissionRes.data.resultType === 'SUCCESS' && submissionRes.data.data) {
      recentSubmissions.value = submissionRes.data.data.slice(0, 5)
    }
  } catch (err) {
    console.error('대시보드 로드 실패:', err)
  } finally {
    loading.value = false
  }
})

// Load assignments for my class
const loadAssignments = async (classId: string) => {
  try {
    const res = await studentApi.getMyAssignments(classId)
    if (res.data.resultType === 'SUCCESS' && res.data.data) {
      assignments.value = res.data.data
    }
  } catch (err) {
    console.error('과제 목록 로드 실패:', err)
  }
}

// Summary
const totalAssignments = computed(() => assignments.value.length)
const submittedCount = computed(() => assignments.value.filter((a) => a.submitted).length)
const unsubmittedCount = computed(() => assignments.value.filter((a) => !a.submitted).length)

// 마감 임박 과제 (미제출 + 3일 이내)
const urgentAssignments = computed(() => {
  const now = new Date()
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  return assignments.value.filter((a) => {
    if (a.submitted) return false
    const deadline = new Date(a.deadline)
    return deadline >= now && deadline <= threeDaysLater
  })
})

const viewAssignment = (assignmentId: string) => {
  emit('navigate', 'assignment-detail', { assignmentId })
}
</script>

<template>
  <div class="app-container">
    <Sidebar :active-menu="activeMenu" @navigate="emit('navigate', $event)" @logout="emit('logout')" />
    <div class="main-content">
      <header class="top-header">
        <div class="search-bar">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="과제 검색..." />
        </div>
      </header>

      <main class="content-area">
        <div v-if="loading" style="text-align: center; padding: 4rem; color: #6b7280">로딩 중...</div>
        <template v-else>
          <!-- Dashboard Header -->
          <div class="dashboard-header">
            <h1>학생 대시보드</h1>
            <p v-if="myClass">{{ myClass.className }} ({{ myClass.generation }}기)</p>
            <p v-else>내 과제 및 제출 현황</p>
          </div>

          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-icon icon-assignments">
                <i class="bi bi-file-earmark-text"></i>
              </div>
              <div class="summary-value">{{ totalAssignments }}</div>
              <div class="summary-label">전체 과제</div>
            </div>

            <div class="summary-card">
              <div class="summary-icon icon-rate">
                <i class="bi bi-check-circle"></i>
              </div>
              <div class="summary-value">{{ submittedCount }}</div>
              <div class="summary-label">제출 완료</div>
            </div>

            <div class="summary-card">
              <div class="summary-icon icon-pending">
                <i class="bi bi-clock-history"></i>
              </div>
              <div class="summary-value">{{ unsubmittedCount }}</div>
              <div class="summary-label">미제출</div>
            </div>
          </div>

          <!-- Bottom Section -->
          <div class="dashboard-bottom">
            <!-- Urgent Assignments -->
            <div class="dashboard-card assignments-overview-card">
              <div class="card-header">
                <h3>마감 임박 과제</h3>
                <p>3일 이내 마감 과제</p>
              </div>

              <div class="assignment-rows">
                <div
                  v-if="urgentAssignments.length === 0"
                  style="padding: 2rem; text-align: center; color: #9ca3af"
                >
                  마감 임박 과제가 없습니다.
                </div>
                <div v-for="assignment in urgentAssignments" :key="assignment.assignmentId" class="assignment-row">
                  <div class="assignment-row-top">
                    <div class="assignment-meta">
                      <span class="assignment-title">{{ assignment.title }}</span>
                      <span class="badge badge-urgent">
                        <i class="bi bi-exclamation-circle"></i> 마감 임박
                      </span>
                    </div>
                  </div>
                  <div class="assignment-row-info">
                    <span class="info-item">
                      <i class="bi bi-calendar-event"></i>
                      {{ new Date(assignment.deadline).toLocaleString('ko-KR') }}
                    </span>
                    <span class="info-item">
                      <i class="bi bi-info-circle"></i>
                      {{ assignment.status }}
                    </span>
                  </div>
                  <div class="assignment-row-actions">
                    <button class="btn-view-detail" @click="viewAssignment(assignment.assignmentId)">
                      제출하기 <i class="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Submissions -->
            <div class="dashboard-card">
              <div class="card-header">
                <h3>최근 제출 내역</h3>
                <p>최근 제출한 과제</p>
              </div>

              <div class="assignment-rows">
                <div
                  v-if="recentSubmissions.length === 0"
                  style="padding: 2rem; text-align: center; color: #9ca3af"
                >
                  최근 제출 내역이 없습니다.
                </div>
                <div
                  v-for="submission in recentSubmissions"
                  :key="submission.submissionId"
                  class="assignment-row"
                >
                  <div class="assignment-row-top">
                    <div class="assignment-meta">
                      <span class="assignment-title">{{ submission.assignmentTitle }}</span>
                    </div>
                  </div>
                  <div class="assignment-row-info">
                    <span class="info-item">
                      <i class="bi bi-calendar-check"></i>
                      {{ new Date(submission.submittedAt).toLocaleString('ko-KR') }}
                    </span>
                    <span class="info-item">
                      <i class="bi bi-info-circle"></i>
                      {{ submission.status }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<style src="../assets/css/dashboard.css"></style>
