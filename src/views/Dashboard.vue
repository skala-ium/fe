<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import Sidebar from './side/Sidebar.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import { dashboardApi } from '@/api';
import type { DashboardResponse } from '@/types/api';

const props = defineProps<{
  activeMenu: string;
}>();

const emit = defineEmits<{
  'navigate': [menuId: string];
  'logout': [];
}>();

// API data
const dashboard = ref<DashboardResponse | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await dashboardApi.getDashboard();
    if (data.resultType === 'SUCCESS' && data.data) {
      dashboard.value = data.data;
    }
  } catch (err) {
    console.error('대시보드 로드 실패:', err);
  } finally {
    loading.value = false;
  }

  nextTick(() => drawChart());
  window.addEventListener('resize', drawChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', drawChart);
});

// Summary
const totalAssignments = computed(() => dashboard.value?.summary.totalAssignments ?? 0);
const pendingReviews = computed(() => dashboard.value?.summary.pendingReviewCount ?? 0);
const overallSubmitRate = computed(() => dashboard.value?.summary.overallSubmissionRate ?? 0);

// Chart data from API
const chartData = computed(() => {
  if (!dashboard.value) return [];
  return dashboard.value.assignmentSubmissionRates.map((item) => ({
    label: item.assignmentName,
    rate: item.submissionRate,
  }));
});

const maxRate = 100;

const handleViewDetail = () => {
  emit('navigate', 'assignments');
};

// Recent submissions from API
const recentSubmissions = computed(() => dashboard.value?.recentSubmissions ?? []);

// 최근 제출 클라이언트 페이징
const SUBMISSION_PAGE_SIZE = 5;
const submissionPage = ref(0);
const totalSubmissionPages = computed(() =>
  Math.ceil(recentSubmissions.value.length / SUBMISSION_PAGE_SIZE),
);
const pagedSubmissions = computed(() =>
  recentSubmissions.value.slice(
    submissionPage.value * SUBMISSION_PAGE_SIZE,
    (submissionPage.value + 1) * SUBMISSION_PAGE_SIZE,
  ),
);

// Canvas chart rendering
const chartCanvas = ref<HTMLCanvasElement | null>(null);

const drawChart = () => {
  const canvas = chartCanvas.value;
  if (!canvas) return;
  const parent = canvas.parentElement;
  if (!parent) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const displayWidth = parent.clientWidth;
  const displayHeight = parent.clientHeight;

  if (displayWidth === 0 || displayHeight === 0) return;

  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  canvas.style.width = displayWidth + 'px';
  canvas.style.height = displayHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = displayWidth;
  const height = displayHeight;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${100 - i * 25}`, padding.left - 8, y + 4);
  }

  // Bars
  const data = chartData.value;
  if (data.length === 0) return;

  const barCount = data.length;
  const barGap = chartWidth / barCount;
  const barWidth = barGap * 0.5;

  data.forEach((item, index) => {
    const x = padding.left + barGap * index + (barGap - barWidth) / 2;
    const barHeight = (item.rate / maxRate) * chartHeight;
    const y = padding.top + chartHeight - barHeight;
    const baseY = padding.top + chartHeight;

    const gradient = ctx.createLinearGradient(x, y, x, baseY);
    gradient.addColorStop(0, '#ea580c');
    gradient.addColorStop(1, '#f97316');

    const r = Math.min(4, barHeight / 2, barWidth / 2);

    ctx.beginPath();
    if (r > 0 && barHeight > 0) {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barWidth - r, y);
      ctx.arcTo(x + barWidth, y, x + barWidth, y + r, r);
      ctx.lineTo(x + barWidth, baseY);
      ctx.lineTo(x, baseY);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
    } else {
      ctx.rect(x, y, barWidth, barHeight);
    }
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Label (truncate long names)
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    const label = item.label.length > 8 ? item.label.slice(0, 7) + '…' : item.label;
    ctx.fillText(label, x + barWidth / 2, height - padding.bottom + 20);
  });
};

watch(chartData, () => {
  nextTick(() => drawChart());
});
</script>

<template>
  <div class="app-container">
    <Sidebar :active-menu="activeMenu" @navigate="emit('navigate', $event)" @logout="emit('logout')" />
    <div class="main-content">
      <header class="top-header">
        <div class="search-bar">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="학생 및 과제 검색..." />
        </div>
      </header>

      <main class="content-area">
        <div v-if="loading" style="text-align: center; padding: 4rem; color: #6b7280;">
          로딩 중...
        </div>
        <template v-else>
          <!-- Dashboard Header -->
          <div class="dashboard-header">
            <h1>대시보드 개요</h1>
            <p>과제 및 학생 제출 현황 모니터링</p>
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
              <div class="summary-icon icon-pending">
                <i class="bi bi-clock-history"></i>
              </div>
              <div class="summary-value">{{ pendingReviews }}</div>
              <div class="summary-label">검토 대기중</div>
            </div>

            <div class="summary-card">
              <div class="summary-icon icon-rate">
                <i class="bi bi-graph-up-arrow"></i>
              </div>
              <div class="summary-value">{{ overallSubmitRate }}%</div>
              <div class="summary-label">전체 제출률</div>
            </div>
          </div>

          <!-- Bottom Section: Recent Submissions + Chart -->
          <div class="dashboard-bottom">
            <!-- Recent Submissions -->
            <div class="dashboard-card assignments-overview-card">
              <div class="card-header">
                <h3>최근 제출</h3>
                <p>최근 제출된 과제</p>
              </div>

              <div class="assignment-rows">
                <div v-if="recentSubmissions.length === 0" style="padding: 2rem; text-align: center; color: #9ca3af;">
                  최근 제출이 없습니다.
                </div>
                <div
                  v-for="(sub, idx) in pagedSubmissions"
                  :key="idx"
                  class="assignment-row"
                >
                  <div class="assignment-row-top">
                    <div class="assignment-meta">
                      <span class="assignment-title">{{ sub.assignmentTitle }}</span>
                      <span class="class-badge">{{ sub.studentName }}</span>
                    </div>
                  </div>
                  <div class="assignment-row-info">
                    <span class="info-item">
                      <i class="bi bi-calendar-event"></i> {{ new Date(sub.submittedAt).toLocaleString('ko-KR') }}
                    </span>
                    <span v-if="sub.fileName" class="info-item">
                      <i class="bi bi-file-earmark"></i> {{ sub.fileName }}
                    </span>
                  </div>
                  <div class="assignment-row-actions">
                    <button class="btn-view-detail" @click="handleViewDetail">
                      상세 보기 <i class="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
              <PaginationBar
                :current-page="submissionPage"
                :total-pages="totalSubmissionPages"
                @change="submissionPage = $event"
              />
            </div>

            <!-- Submission Rate Chart -->
            <div class="dashboard-card chart-card">
              <div class="card-header">
                <h3>과제별 제출률</h3>
                <p>등록된 과제</p>
              </div>
              <div class="chart-container">
                <canvas ref="chartCanvas"></canvas>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<style src="../assets/css/dashboard.css"></style>
