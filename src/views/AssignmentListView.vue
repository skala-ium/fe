<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Sidebar from './side/Sidebar.vue';
import AssignmentCard from '@/components/AssignmentCard.vue';
import AssignmentDetail from './AssignmentDetail.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import type { Assignment } from '@/types/Assignment';
import { classApi, assignmentApi } from '@/api';
import type { ClassListItem, AssignmentListItem } from '@/types/api';

const props = defineProps<{
  activeMenu: string;
}>();

const emit = defineEmits<{
  'view-detail': [assignment: Assignment];
  'navigate': [menuId: string];
  'logout': [];
}>();

// View state
const showDetail = ref(false);
const selectedAssignment = ref<Assignment | null>(null);
const loading = ref(true);

// Class list from API
const classes = ref<ClassListItem[]>([]);
const activeClassId = ref<string>('');

// Filter tabs: '전체' + class names
const filterTabs = computed(() => {
  return ['전체', ...classes.value.map((c) => c.className)];
});
const activeFilter = ref<string>('전체');

// Assignments from API
const assignments = ref<Assignment[]>([]);

// Pagination
const currentPage = ref(0);
const totalPages = ref(0);
const PAGE_SIZE = 10;

// Load classes on mount
onMounted(async () => {
  try {
    const { data } = await classApi.getClasses();
    if (data.resultType === 'SUCCESS' && data.data) {
      classes.value = data.data;
      if (classes.value.length > 0) {
        // Load all classes' assignments
        await loadAllAssignments();
      }
    }
  } catch (err) {
    console.error('반 목록 로드 실패:', err);
  } finally {
    loading.value = false;
  }
});

async function loadAllAssignments() {
  const allAssignments: Assignment[] = [];

  for (const cls of classes.value) {
    try {
      const { data } = await assignmentApi.getAssignments(cls.classId);
      if (data.resultType === 'SUCCESS' && data.data) {
        const mapped = data.data.content.map((item: AssignmentListItem) =>
          mapToAssignment(item, cls.className),
        );
        allAssignments.push(...mapped);
      }
    } catch (err) {
      console.error(`과제 로드 실패 (${cls.className}):`, err);
    }
  }

  assignments.value = allAssignments;
  totalPages.value = Math.ceil(allAssignments.length / PAGE_SIZE);
}

async function loadClassAssignments(classId: string, page: number) {
  try {
    const { data } = await assignmentApi.getAssignments(classId, page, PAGE_SIZE);
    if (data.resultType === 'SUCCESS' && data.data) {
      const cls = classes.value.find((c) => c.classId === classId);
      assignments.value = data.data.content.map((item: AssignmentListItem) =>
        mapToAssignment(item, cls?.className ?? ''),
      );
      totalPages.value = data.data.totalPages;
    }
  } catch (err) {
    console.error(`과제 로드 실패 (classId: ${classId}):`, err);
  }
}

function mapToAssignment(item: AssignmentListItem, className: string): Assignment {
  const deadline = new Date(item.deadline);
  const isPassed = deadline < new Date();

  return {
    id: item.assignmentId,
    title: item.title,
    className,
    professor: item.professorName,
    description: item.description ?? '',
    completePercent: Math.round(item.submissionRate),
    deadline: deadline.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    submitCount: `${item.submissionCount}/${item.totalStudents}`,
    submitRate: Math.round(item.submissionRate),
    isPassed,
    topic: item.topic ?? '',
  };
}

// Filtered assignments (전체: 클라이언트 필터, 특정 클래스: 서버에서 받은 전체)
const filteredAssignments = computed(() => {
  if (activeFilter.value === '전체') {
    return assignments.value;
  }
  return assignments.value;
});

// 전체 필터일 때 클라이언트 페이징
const pagedAssignments = computed(() => {
  if (activeFilter.value === '전체') {
    return filteredAssignments.value.slice(
      currentPage.value * PAGE_SIZE,
      (currentPage.value + 1) * PAGE_SIZE,
    );
  }
  return filteredAssignments.value; // 서버에서 이미 1페이지 분량
});

// 전체 필터 전환 시 totalPages 갱신
watch(
  [() => assignments.value.length, activeFilter],
  () => {
    if (activeFilter.value === '전체') {
      totalPages.value = Math.ceil(assignments.value.length / PAGE_SIZE);
    }
  },
);

const setActiveFilter = async (filter: string): Promise<void> => {
  activeFilter.value = filter;
  currentPage.value = 0;

  if (filter !== '전체') {
    const cls = classes.value.find((c) => c.className === filter);
    if (cls) {
      loading.value = true;
      await loadClassAssignments(cls.classId, 0);
      loading.value = false;
    }
  }
};

const onPageChange = async (page: number): Promise<void> => {
  currentPage.value = page;
  if (activeFilter.value !== '전체') {
    const cls = classes.value.find((c) => c.className === activeFilter.value);
    if (cls) {
      loading.value = true;
      await loadClassAssignments(cls.classId, page);
      loading.value = false;
    }
  }
};

// Handle assignment click
const handleAssignmentClick = (assignment: Assignment): void => {
  selectedAssignment.value = assignment;
  showDetail.value = true;
};

// Handle go back from detail
const handleGoBack = (): void => {
  showDetail.value = false;
  selectedAssignment.value = null;
};
</script>

<template>
  <!-- Show detail page if assignment is selected -->
  <AssignmentDetail
    v-if="showDetail && selectedAssignment"
    :assignment="selectedAssignment"
    :active-menu="activeMenu"
    @go-back="handleGoBack"
    @navigate="emit('navigate', $event)"
    @logout="emit('logout')"
  />

  <!-- Show list page -->
  <div v-else class="app-container">
    <Sidebar :active-menu="activeMenu" @navigate="emit('navigate', $event)" @logout="emit('logout')" />
    <div class="main-content">
      <header class="top-header">
        <div class="search-bar">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="학생 및 과제 검색..." />
        </div>
      </header>

      <main class="content-area">
        <div class="list-header">
          <h1>과제 목록</h1>
          <p>모든 과목 과제 관리 및 추적</p>
        </div>

        <div class="filters">
          <button
            v-for="filter in filterTabs"
            :key="filter"
            class="filter-btn"
            :class="{ active: activeFilter === filter }"
            @click="setActiveFilter(filter)"
          >
            {{ filter }}
          </button>
        </div>

        <div v-if="loading" style="text-align: center; padding: 4rem; color: #6b7280;">
          로딩 중...
        </div>
        <div v-else-if="pagedAssignments.length === 0" style="text-align: center; padding: 4rem; color: #9ca3af;">
          과제가 없습니다.
        </div>
        <template v-else>
          <div class="card-list">
            <AssignmentCard
              v-for="item in pagedAssignments"
              :key="item.id"
              :data="item"
              @click="handleAssignmentClick" />
          </div>
          <PaginationBar
            :current-page="currentPage"
            :total-pages="totalPages"
            @change="onPageChange"
          />
        </template>
      </main>
    </div>
  </div>
</template>

<style src="../assets/css/assignment-list.css"></style>
