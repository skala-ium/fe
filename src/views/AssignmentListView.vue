<script setup lang="ts">
import { ref, computed, type Ref } from 'vue';
import Sidebar from './side/Sidebar.vue';
import AssignmentCard from '@/components/AssignmentCard.vue';
import AssignmentDetail from './AssignmentDetail.vue';
import type { Assignment } from '@/types/Assignment';

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

// Filter tabs array
const filterTabs: string[] = ['전체', '1반', '2반', '3반', '클라우드반'];
const activeFilter = ref<string>('전체');

// Assignments array
const assignments: Ref<Assignment[]> = ref([
  {
    id: 1,
    title: '[파이썬 1일차 - Codelab ①] AST를 활용한 자동 보안 검사기',
    className: '1반',
    professor: '한상윤',
    description: 'ast.NodeVisitor를 사용하여 위험 함수(eval, exec 등)를 탐색하고 줄 번호가 포함된 리포트를 생성하는 과제입니다.',
    completePercent: 92,
    deadline: '2026년 2월 8일',
    submitCount: '7/8',
    submitRate: 92,
    isPassed: true,
    week: '1주차',
    topic: 'Python 기초',
    requirements: [
      'ast.NodeVisitor 상속 및 함수 호출 노드 탐색',
      '위험 함수(eval, exec, pickle.load, os.system) 감지',
      '파일명 및 라인 번호 리포트 생성',
    ],
  },
  {
    id: 2,
    title: '2주차: 자료구조',
    className: '2반',
    professor: '김교수',
    description: '연결 리스트, 스택, 큐를 포함한 일반적인 자료구조 구현하기',
    completePercent: 88,
    deadline: '2026년 1월 22일',
    submitCount: '7/8',
    submitRate: 88,
    isPassed: true
  },
  {
    id: 3,
    title: '4주차: Java 백엔드 기초',
    className: '1반',
    professor: '김교수',
    description: '기본 CRUD 작업을 수행하는 Spring Boot를 사용한 간단한 REST API 구축',
    completePercent: 62,
    deadline: '2026년 2월 5일',
    submitCount: '5/8',
    submitRate: 62,
    isPassed: true
  },
]);

// Filtered assignments based on active filter
const filteredAssignments = computed(() => {
  if (activeFilter.value === '전체') {
    return assignments.value;
  }
  return assignments.value.filter(a => a.className === activeFilter.value);
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

        <div class="card-list">
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
