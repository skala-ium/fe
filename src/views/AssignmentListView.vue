<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Sidebar from './side/Sidebar.vue';
import AssignmentCard from '@/components/AssignmentCard.vue';
import AssignmentDetail from './AssignmentDetail.vue';
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

// Filtered assignments based on active filter
const filteredAssignments = computed(() => {
  if (activeFilter.value === '전체') {
    return assignments.value;
  }
  return assignments.value.filter((a) => a.className === activeFilter.value);
});

const setActiveFilter = (filter: string): void => {
  activeFilter.value = filter;
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
        <div v-else-if="filteredAssignments.length === 0" style="text-align: center; padding: 4rem; color: #9ca3af;">
          과제가 없습니다.
        </div>
        <div v-else class="card-list">
          <AssignmentCard
            v-for="item in filteredAssignments"
            :key="item.id"
            :data="item"
            @click="handleAssignmentClick" />
        </div>
      </main>
    </div>
  </div>
</template>

<style src="../assets/css/assignment-list.css"></style>
