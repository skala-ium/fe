<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from './side/Sidebar.vue'
import { studentApi, classApi } from '@/api'
import type { ClassListItem, StudentAssignmentResponse } from '@/types/api'

const props = defineProps<{
  activeMenu: string
}>()

const emit = defineEmits<{
  navigate: [menuId: string, params?: any]
  logout: []
}>()

const myClass = ref<ClassListItem | null>(null)
const assignments = ref<StudentAssignmentResponse[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await classApi.getClasses()
    if (res.data.resultType === 'SUCCESS' && res.data.data) {
      // 학생은 하나의 반에만 속하므로 첫 번째 클래스가 내 클래스
      if (res.data.data.length > 0) {
        myClass.value = res.data.data[0]
        await loadAssignments(myClass.value.classId)
      }
    }
  } catch (err) {
    console.error('클래스 로드 실패:', err)
  } finally {
    loading.value = false
  }
})

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

const getStatusBadgeClass = (status: string) => {
  if (status.includes('완료') || status.includes('제출')) return 'badge-success'
  if (status.includes('대기') || status.includes('미제출')) return 'badge-pending'
  return ''
}

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
        <div class="dashboard-header">
          <h1>내 과제 목록</h1>
          <p v-if="myClass">{{ myClass.className }} ({{ myClass.generation }}기)</p>
          <p v-else>수강 중인 클래스의 과제를 확인하세요</p>
        </div>

        <!-- Assignment Table -->
        <div v-if="loading" style="text-align: center; padding: 4rem; color: #6b7280">로딩 중...</div>
        <div v-else class="dashboard-card" style="margin-top: 1.5rem">
          <table class="assignment-table">
            <thead>
              <tr>
                <th>과제명</th>
                <th>마감일</th>
                <th>제출 여부</th>
                <th>상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="assignments.length === 0">
                <td colspan="5" style="text-align: center; padding: 3rem; color: #9ca3af">
                  과제가 없습니다.
                </td>
              </tr>
              <tr v-for="assignment in assignments" :key="assignment.assignmentId">
                <td class="title-cell">{{ assignment.title }}</td>
                <td>{{ new Date(assignment.deadline).toLocaleString('ko-KR') }}</td>
                <td>
                  <span v-if="assignment.submitted" class="badge badge-success">
                    <i class="bi bi-check-circle"></i> 제출 완료
                  </span>
                  <span v-else class="badge badge-pending">
                    <i class="bi bi-clock"></i> 미제출
                  </span>
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(assignment.status)">
                    {{ assignment.status }}
                  </span>
                </td>
                <td>
                  <button
                    class="btn-view-detail"
                    @click="viewAssignment(assignment.assignmentId)"
                  >
                    {{ assignment.submitted ? '보기' : '제출하기' }}
                    <i class="bi bi-arrow-right"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.assignment-table {
  width: 100%;
  border-collapse: collapse;
}

.assignment-table thead {
  background-color: #f9fafb;
}

.assignment-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
}

.assignment-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  color: #374151;
}

.title-cell {
  font-weight: 500;
  color: #1f2937;
}

.badge-success {
  background-color: #dcfce7;
  color: #16a34a;
}

.badge-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.dashboard-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

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

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 500px;
  background-color: #f9fafb;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.search-bar i {
  color: #9ca3af;
  font-size: 1rem;
}

.search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.875rem;
  color: #1f2937;
}

.search-bar input::placeholder {
  color: #9ca3af;
}

.content-area {
  padding: 2rem;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.dashboard-header p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.dashboard-filters {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 1.25rem 1.5rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filter-btn {
  padding: 0.5rem 1.25rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: #ea580c;
  color: #ea580c;
  background-color: #fff7ed;
}

.filter-btn.active {
  background-color: #ea580c;
  color: #ffffff;
  border-color: #ea580c;
}

.btn-view-detail {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background-color: #ea580c;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-view-detail:hover {
  background-color: #c2410c;
}

.btn-view-detail i {
  font-size: 0.7rem;
}
</style>
