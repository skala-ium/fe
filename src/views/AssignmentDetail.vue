<script setup lang="ts">
import { ref, computed, onMounted, type Ref } from 'vue';
import Sidebar from './side/Sidebar.vue';
import SubmissionDetailModal from '@/components/SubmissionDetailModal.vue';
import type { Assignment } from '@/types/Assignment';
import { assignmentApi } from '@/api';
import type { AssignmentDetailResponse } from '@/types/api';

// Props
const props = defineProps<{
  assignment: Assignment;
  activeMenu: string;
}>();

// Emit events
const emit = defineEmits<{
  'go-back': [];
  'navigate': [menuId: string];
  'logout': [];
}>();

// API detail data
const detail = ref<AssignmentDetailResponse | null>(null);
const detailLoading = ref(true);

onMounted(async () => {
  try {
    const { data } = await assignmentApi.getAssignmentDetail(props.assignment.id);
    if (data.resultType === 'SUCCESS' && data.data) {
      detail.value = data.data;
    }
  } catch (err) {
    console.error('과제 상세 로드 실패:', err);
  } finally {
    detailLoading.value = false;
  }
});

// Merged display data
const displayTitle = computed(() => detail.value?.title ?? props.assignment.title);
const displayDescription = computed(() => detail.value?.description ?? props.assignment.description);
const displayProfessor = computed(() => detail.value?.professorName ?? props.assignment.professor);
const displayDeadline = computed(() => {
  if (detail.value?.deadline) {
    return new Date(detail.value.deadline).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }
  return props.assignment.deadline;
});
const displayWeek = computed(() => detail.value?.week ?? props.assignment.week);
const displayTopic = computed(() => detail.value?.topic ?? props.assignment.topic);
const displayRequirements = computed(() => {
  if (detail.value?.requirements?.length) {
    return detail.value.requirements.map((r) => r.content);
  }
  return props.assignment.requirements ?? [];
});

// Sample submission data (mock 유지 — 별도 API 작업 필요)
interface Submission {
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: 'submitted' | 'late' | 'not-submitted';
  score?: number;
  fileUrl?: string;
  comment?: string;
  files?: { name: string; url: string; type: string }[];
}

const submissions: Ref<Submission[]> = ref([
  {
    studentId: '2021001',
    studentName: '김민수',
    submittedAt: '2026년 1월 14일 23:45',
    status: 'submitted',
    score: 95,
    fileUrl: '#',
    comment: '과제 제출합니다. 요구사항 3번은 추가 구현하여 별도 PDF로 첨부하였습니다.',
    files: [
      { name: '김민수_과제1_보고서.pdf', url: '/files/2021001/report.pdf', type: 'application/pdf' },
      { name: '김민수_과제1_부록.pdf', url: '/files/2021001/appendix.pdf', type: 'application/pdf' }
    ]
  },
  {
    studentId: '2021002',
    studentName: '이지은',
    submittedAt: '2026년 1월 15일 01:20',
    status: 'late',
    score: 88,
    fileUrl: '#',
    comment: '늦게 제출하게 되어 죄송합니다.',
    files: [
      { name: '이지은_과제1.pdf', url: '/files/2021002/report.pdf', type: 'application/pdf' }
    ]
  },
  {
    studentId: '2021003',
    studentName: '박서준',
    submittedAt: '2026년 1월 14일 18:30',
    status: 'submitted',
    score: 92,
    fileUrl: '#',
    comment: '과제 제출합니다.',
    files: [
      { name: '박서준_과제1_최종.pdf', url: '/files/2021003/report.pdf', type: 'application/pdf' }
    ]
  },
  {
    studentId: '2021004',
    studentName: '최유진',
    submittedAt: '2026년 1월 15일 02:15',
    status: 'late',
    fileUrl: '#',
    files: [
      { name: '최유진_과제1.pdf', url: '/files/2021004/report.pdf', type: 'application/pdf' }
    ]
  },
  {
    studentId: '2021005',
    studentName: '정민호',
    submittedAt: '-',
    status: 'not-submitted'
  },
  {
    studentId: '2021006',
    studentName: '강혜진',
    submittedAt: '2026년 1월 14일 22:10',
    status: 'submitted',
    score: 98,
    fileUrl: '#',
    comment: '요구사항 모두 반영하였습니다. 감사합니다.',
    files: [
      { name: '강혜진_과제1_보고서.pdf', url: '/files/2021006/report.pdf', type: 'application/pdf' }
    ]
  },
  {
    studentId: '2021007',
    studentName: '윤서아',
    submittedAt: '2026년 1월 14일 20:00',
    status: 'submitted',
    score: 90,
    fileUrl: '#',
    comment: '제출합니다!',
    files: [
      { name: '윤서아_과제1.pdf', url: '/files/2021007/report.pdf', type: 'application/pdf' }
    ]
  },
  {
    studentId: '2021008',
    studentName: '임동혁',
    submittedAt: '-',
    status: 'not-submitted'
  }
]);

// Modal state
const selectedSubmission = ref<Submission | null>(null);
const showModal = ref(false);

const openSubmissionModal = (submission: Submission) => {
  selectedSubmission.value = submission;
  showModal.value = true;
};

const closeSubmissionModal = () => {
  showModal.value = false;
};

// Tab state
const activeTab = ref<'overview' | 'submissions' | 'settings'>('overview');

// Editable requirements for settings tab
const editableRequirements = ref<string[]>([...displayRequirements.value]);

const addRequirement = () => {
  editableRequirements.value.push('');
};

const removeRequirement = (index: number) => {
  editableRequirements.value.splice(index, 1);
};

// Statistics
const stats = computed(() => {
  const total = submissions.value.length;
  const submitted = submissions.value.filter(s => s.status !== 'not-submitted').length;
  const late = submissions.value.filter(s => s.status === 'late').length;
  const notSubmitted = submissions.value.filter(s => s.status === 'not-submitted').length;
  const scored = submissions.value.filter(s => s.score !== undefined).length;
  const avgScore = scored > 0
    ? Math.round(submissions.value.reduce((sum, s) => sum + (s.score || 0), 0) / scored)
    : 0;

  return {
    total,
    submitted,
    late,
    notSubmitted,
    submitRate: Math.round((submitted / total) * 100),
    avgScore
  };
});

// Filter submissions
const filterStatus = ref<'all' | 'submitted' | 'late' | 'not-submitted'>('all');

const filteredSubmissions = computed(() => {
  if (filterStatus.value === 'all') return submissions.value;
  return submissions.value.filter(s => s.status === filterStatus.value);
});

// Handle go back
const handleGoBack = (): void => {
  emit('go-back');
};

// Get status badge class
const getStatusClass = (status: string): string => {
  switch (status) {
    case 'submitted': return 'status-submitted';
    case 'late': return 'status-late';
    case 'not-submitted': return 'status-not-submitted';
    default: return '';
  }
};

// Get status text
const getStatusText = (status: string): string => {
  switch (status) {
    case 'submitted': return '제출 완료';
    case 'late': return '지각 제출';
    case 'not-submitted': return '미제출';
    default: return '';
  }
};
</script>

<template>
  <div class="app-container">
    <Sidebar :active-menu="activeMenu" @navigate="emit('navigate', $event)" @logout="emit('logout')" />
    <div class="main-content">
      <!-- Header -->
      <header class="detail-header">
        <button class="back-button" @click="handleGoBack">
          <i class="bi bi-arrow-left"></i>
          <span>과제 목록으로</span>
        </button>
        <div class="header-actions">
          <button class="btn-action">
            <i class="bi bi-pencil"></i>
            수정
          </button>
          <button class="btn-action btn-danger">
            <i class="bi bi-trash"></i>
            삭제
          </button>
        </div>
      </header>

      <!-- Assignment Info Card -->
      <div class="assignment-info-card">
        <div class="info-header">
          <div class="info-title-section">
            <div class="title-row">
              <h1>{{ displayTitle }}</h1>
              <span class="badge class-badge">{{ assignment.className }}</span>
              <span v-if="displayWeek" class="badge week-badge">{{ displayWeek }}</span>
              <span v-if="displayTopic" class="badge topic-badge">{{ displayTopic }}</span>
            </div>
            <p class="description">{{ displayDescription }}</p>
          </div>
          <div class="progress-section">
            <div class="circular-progress">
              <svg width="100" height="100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#e5e7eb"
                  stroke-width="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  :stroke="assignment.completePercent >= 90 ? '#16a34a' : assignment.completePercent >= 70 ? '#ca8a04' : '#dc2626'"
                  stroke-width="8"
                  fill="none"
                  :stroke-dasharray="`${2 * Math.PI * 40 * assignment.completePercent / 100} ${2 * Math.PI * 40}`"
                  stroke-linecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div class="progress-text">
                <span class="percent">{{ assignment.completePercent }}%</span>
                <span class="label">완료</span>
              </div>
            </div>
          </div>
        </div>

        <div class="info-details">
          <div class="detail-item">
            <i class="bi bi-person"></i>
            <span class="label">담당 교수</span>
            <span class="value">{{ displayProfessor }}</span>
          </div>
          <div class="detail-item">
            <i class="bi bi-calendar-event"></i>
            <span class="label">마감일</span>
            <span class="value">{{ displayDeadline }}</span>
            <span v-if="assignment.isPassed" class="badge-passed">마감 지남</span>
          </div>
          <div class="detail-item">
            <i class="bi bi-people"></i>
            <span class="label">제출 현황</span>
            <span class="value">{{ assignment.submitCount }} ({{ assignment.submitRate }}%)</span>
          </div>
        </div>

        <!-- Requirements -->
        <div v-if="displayRequirements.length > 0" class="requirements-section">
          <h3><i class="bi bi-list-check"></i> 과제 요구사항</h3>
          <ul class="requirements-list">
            <li v-for="(req, idx) in displayRequirements" :key="idx">
              <span class="req-number">{{ idx + 1 }}</span>
              <span class="req-text">{{ req }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'overview' }"
          @click="activeTab = 'overview'"
        >
          <i class="bi bi-bar-chart"></i>
          개요
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'submissions' }"
          @click="activeTab = 'submissions'"
        >
          <i class="bi bi-file-earmark-text"></i>
          제출 현황
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          <i class="bi bi-gear"></i>
          설정
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="overview-tab">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon" style="background-color: #dbeafe;">
                <i class="bi bi-people-fill" style="color: #2563eb;"></i>
              </div>
              <div class="stat-info">
                <p class="stat-label">전체 학생</p>
                <p class="stat-value">{{ stats.total }}명</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background-color: #dcfce7;">
                <i class="bi bi-check-circle-fill" style="color: #16a34a;"></i>
              </div>
              <div class="stat-info">
                <p class="stat-label">제출 완료</p>
                <p class="stat-value">{{ stats.submitted }}명</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background-color: #fef3c7;">
                <i class="bi bi-clock-fill" style="color: #ca8a04;"></i>
              </div>
              <div class="stat-info">
                <p class="stat-label">지각 제출</p>
                <p class="stat-value">{{ stats.late }}명</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background-color: #fee2e2;">
                <i class="bi bi-x-circle-fill" style="color: #dc2626;"></i>
              </div>
              <div class="stat-info">
                <p class="stat-label">미제출</p>
                <p class="stat-value">{{ stats.notSubmitted }}명</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background-color: #e0e7ff;">
                <i class="bi bi-graph-up" style="color: #4f46e5;"></i>
              </div>
              <div class="stat-info">
                <p class="stat-label">제출률</p>
                <p class="stat-value">{{ stats.submitRate }}%</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background-color: #fce7f3;">
                <i class="bi bi-star-fill" style="color: #db2777;"></i>
              </div>
              <div class="stat-info">
                <p class="stat-label">평균 점수</p>
                <p class="stat-value">{{ stats.avgScore }}점</p>
              </div>
            </div>
          </div>

          <!-- Recent Submissions -->
          <div class="recent-submissions">
            <h3>최근 제출</h3>
            <div class="submission-list">
              <div
                v-for="submission in submissions.slice(0, 5)"
                :key="submission.studentId"
                class="submission-item"
              >
                <div class="student-info">
                  <div class="avatar">{{ submission.studentName.charAt(0) }}</div>
                  <div>
                    <p class="student-name">{{ submission.studentName }}</p>
                    <p class="student-id">{{ submission.studentId }}</p>
                  </div>
                </div>
                <div class="submission-details">
                  <span class="submitted-time">{{ submission.submittedAt }}</span>
                  <span class="status-badge" :class="getStatusClass(submission.status)">
                    {{ getStatusText(submission.status) }}
                  </span>
                  <span v-if="submission.score" class="score">{{ submission.score }}점</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Submissions Tab -->
        <div v-if="activeTab === 'submissions'" class="submissions-tab">
          <div class="submissions-header">
            <h3>제출 현황 ({{ filteredSubmissions.length }}명)</h3>
            <div class="filter-buttons">
              <button
                :class="{ active: filterStatus === 'all' }"
                @click="filterStatus = 'all'"
              >
                전체
              </button>
              <button
                :class="{ active: filterStatus === 'submitted' }"
                @click="filterStatus = 'submitted'"
              >
                제출 완료
              </button>
              <button
                :class="{ active: filterStatus === 'late' }"
                @click="filterStatus = 'late'"
              >
                지각 제출
              </button>
              <button
                :class="{ active: filterStatus === 'not-submitted' }"
                @click="filterStatus = 'not-submitted'"
              >
                미제출
              </button>
            </div>
          </div>

          <div class="submissions-table">
            <table>
              <thead>
                <tr>
                  <th>학번</th>
                  <th>이름</th>
                  <th>제출일시</th>
                  <th>상태</th>
                  <th>점수</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="submission in filteredSubmissions"
                  :key="submission.studentId"
                  class="clickable-row"
                  @click="openSubmissionModal(submission)"
                >
                  <td>{{ submission.studentId }}</td>
                  <td>
                    <div class="student-cell">
                      <div class="avatar-small">{{ submission.studentName.charAt(0) }}</div>
                      {{ submission.studentName }}
                    </div>
                  </td>
                  <td>{{ submission.submittedAt }}</td>
                  <td>
                    <span class="status-badge" :class="getStatusClass(submission.status)">
                      {{ getStatusText(submission.status) }}
                    </span>
                  </td>
                  <td>
                    <span v-if="submission.score" class="score-cell">{{ submission.score }}점</span>
                    <span v-else class="no-score">-</span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button
                        class="btn-icon btn-view"
                        title="상세 보기"
                        @click.stop="openSubmissionModal(submission)"
                      >
                        <i class="bi bi-eye"></i>
                      </button>
                      <button v-if="submission.fileUrl" class="btn-icon" title="파일 다운로드" @click.stop>
                        <i class="bi bi-download"></i>
                      </button>
                      <button class="btn-icon" title="채점하기" @click.stop>
                        <i class="bi bi-pencil-square"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Settings Tab -->
        <div v-if="activeTab === 'settings'" class="settings-tab">
          <div class="settings-section">
            <h3>과제 설정</h3>
            <div class="setting-item">
              <label>과제 제목</label>
              <input type="text" :value="displayTitle" />
            </div>
            <div class="setting-item">
              <label>과제 설명</label>
              <textarea :value="displayDescription" rows="4"></textarea>
            </div>
            <div class="setting-item">
              <label>마감일</label>
              <input type="text" :value="displayDeadline" />
            </div>
            <div class="setting-item">
              <label>클래스</label>
              <select>
                <option :selected="assignment.className === '1반'">1반</option>
                <option :selected="assignment.className === '2반'">2반</option>
                <option :selected="assignment.className === '3반'">3반</option>
                <option :selected="assignment.className === '클라우드반'">클라우드반</option>
              </select>
            </div>

            <!-- Requirements Editor -->
            <div class="setting-item">
              <label>과제 요구사항</label>
              <div class="requirements-editor">
                <div
                  v-for="(req, idx) in editableRequirements"
                  :key="idx"
                  class="requirement-edit-row"
                >
                  <span class="req-edit-number">{{ idx + 1 }}</span>
                  <input
                    type="text"
                    :value="req"
                    placeholder="요구사항을 입력하세요..."
                    @input="editableRequirements[idx] = ($event.target as HTMLInputElement).value"
                  />
                  <button class="btn-req-remove" @click="removeRequirement(idx)" title="삭제">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
                <button class="btn-req-add" @click="addRequirement">
                  <i class="bi bi-plus-circle"></i> 요구사항 추가
                </button>
              </div>
            </div>

            <div class="setting-actions">
              <button class="btn-primary">저장</button>
              <button class="btn-secondary">취소</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Submission Detail Modal -->
    <SubmissionDetailModal
      v-if="selectedSubmission"
      :submission="selectedSubmission"
      :visible="showModal"
      @close="closeSubmissionModal"
    />
  </div>
</template>

<style src="../assets/css/assignment-detail.css"></style>
