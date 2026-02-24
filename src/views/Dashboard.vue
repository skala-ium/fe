<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import Sidebar from './side/Sidebar.vue';

const props = defineProps<{
  activeMenu: string;
}>();

const emit = defineEmits<{
  'navigate': [menuId: string];
  'logout': [];
}>();

// Class filter
const filterTabs = ['전체', '1반', '2반', '3반', '클라우드반'];
const activeFilter = ref('전체');

// Active assignments data
interface ActiveAssignment {
  id: number;
  title: string;
  className: string;
  deadline: string;
  submitRate: number;
  submitCount: string;
  newUnreviewed: number;
  lateSubmissions: number;
  deadlineImminent: boolean;
}

const allAssignments = ref<ActiveAssignment[]>([
  {
    id: 1,
    title: '1주차: Python 기초',
    className: '1반',
    deadline: '2026년 1월 15일',
    submitRate: 92,
    submitCount: '7/8',
    newUnreviewed: 2,
    lateSubmissions: 1,
    deadlineImminent: false,
  },
  {
    id: 2,
    title: '2주차: 자료구조',
    className: '2반',
    deadline: '2026년 1월 22일',
    submitRate: 88,
    submitCount: '7/8',
    newUnreviewed: 3,
    lateSubmissions: 0,
    deadlineImminent: false,
  },
  {
    id: 3,
    title: '4주차: Java 백엔드 기초',
    className: '1반',
    deadline: '2026년 2월 5일',
    submitRate: 62,
    submitCount: '5/8',
    newUnreviewed: 5,
    lateSubmissions: 2,
    deadlineImminent: true,
  },
]);

const filteredAssignments = computed(() => {
  if (activeFilter.value === '전체') return allAssignments.value;
  return allAssignments.value.filter(a => a.className === activeFilter.value);
});

// Summary stats (reactive to filter)
const totalAssignments = computed(() => filteredAssignments.value.length);
const pendingReviews = computed(() =>
  filteredAssignments.value.reduce((sum, a) => sum + a.newUnreviewed, 0)
);
const overallSubmitRate = computed(() => {
  const list = filteredAssignments.value;
  if (list.length === 0) return 0;
  return Math.round(list.reduce((sum, a) => sum + a.submitRate, 0) / list.length);
});

const handleViewDetail = () => {
  emit('navigate', 'assignments');
};

// Chart data (reactive to filter)
const allChartData = [
  { label: '1주차', rate: 92, className: '1반' },
  { label: '2주차', rate: 88, className: '2반' },
  { label: '3주차', rate: 75, className: '3반' },
  { label: '4주차', rate: 62, className: '1반' },
  { label: '5주차', rate: 45, className: '클라우드반' },
];

const chartData = computed(() => {
  if (activeFilter.value === '전체') return allChartData;
  return allChartData.filter(d => d.className === activeFilter.value);
});

const maxRate = 100;

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

  // Draw grid lines
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

  // Draw bars
  const barCount = chartData.value.length;
  const barGap = chartWidth / barCount;
  const barWidth = barGap * 0.5;

  chartData.value.forEach((item, index) => {
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

    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, x + barWidth / 2, height - padding.bottom + 20);
  });
};

watch(chartData, () => {
  nextTick(() => drawChart());
});

onMounted(() => {
  nextTick(() => {
    drawChart();
  });
  window.addEventListener('resize', drawChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', drawChart);
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
        <!-- Dashboard Header -->
        <div class="dashboard-header">
          <h1>대시보드 개요</h1>
          <p>과제 및 학생 제출 현황 모니터링</p>
        </div>

        <!-- Class Filter -->
        <div class="dashboard-filters">
          <button
            v-for="tab in filterTabs"
            :key="tab"
            class="filter-btn"
            :class="{ active: activeFilter === tab }"
            @click="activeFilter = tab"
          >
            {{ tab }}
          </button>
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

        <!-- Bottom Section: Active Assignments + Chart -->
        <div class="dashboard-bottom">
          <!-- Active Assignments Overview -->
          <div class="dashboard-card assignments-overview-card">
            <div class="card-header">
              <h3>활성 과제 현황</h3>
              <p>진행 중인 과제 제출률 및 상태</p>
            </div>

            <div class="assignment-rows">
              <div
                v-for="a in filteredAssignments"
                :key="a.id"
                class="assignment-row"
              >
                <!-- Top: metadata + badges -->
                <div class="assignment-row-top">
                  <div class="assignment-meta">
                    <span class="assignment-title">{{ a.title }}</span>
                    <span class="class-badge">{{ a.className }}</span>
                  </div>
                  <div class="assignment-badges">
                    <span v-if="a.lateSubmissions > 0" class="badge badge-late">
                      <i class="bi bi-exclamation-triangle-fill"></i> 지각 {{ a.lateSubmissions }}건
                    </span>
                    <span v-if="a.deadlineImminent" class="badge badge-urgent">
                      <i class="bi bi-alarm-fill"></i> 마감 임박
                    </span>
                  </div>
                </div>

                <!-- Middle: deadline + unreviewed -->
                <div class="assignment-row-info">
                  <span class="info-item">
                    <i class="bi bi-calendar-event"></i> {{ a.deadline }}
                  </span>
                  <span v-if="a.newUnreviewed > 0" class="info-item unreviewed">
                    <i class="bi bi-envelope-fill"></i> 미검토 {{ a.newUnreviewed }}건
                  </span>
                </div>

                <!-- Progress bar -->
                <div class="progress-section">
                  <div class="progress-bar-track">
                    <div
                      class="progress-bar-fill"
                      :style="{ width: a.submitRate + '%' }"
                    ></div>
                  </div>
                  <span class="progress-label">{{ a.submitRate }}% ({{ a.submitCount }})</span>
                </div>

                <!-- Actions -->
                <div class="assignment-row-actions">
                  <button class="btn-zip-download">
                    <i class="bi bi-file-earmark-zip"></i> 전체 ZIP 다운로드
                  </button>
                  <button class="btn-view-detail" @click="handleViewDetail">
                    상세 현황 보기 <i class="bi bi-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Submission Rate Chart -->
          <div class="dashboard-card chart-card">
            <div class="card-header">
              <h3>과제별 제출률</h3>
              <p>최근 5개 과제</p>
            </div>
            <div class="chart-container">
              <canvas ref="chartCanvas"></canvas>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style src="../assets/css/dashboard.css"></style>
