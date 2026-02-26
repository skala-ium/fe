<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  currentPage: number;  // 0-indexed
  totalPages: number;
}>();

const emit = defineEmits<{
  change: [page: number];
}>();

const pageWindow = computed(() => {
  const total = props.totalPages;
  const current = props.currentPage;
  const windowSize = 5;

  let start = Math.max(0, current - Math.floor(windowSize / 2));
  let end = Math.min(total - 1, start + windowSize - 1);
  if (end - start < windowSize - 1) {
    start = Math.max(0, end - windowSize + 1);
  }

  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});
</script>

<template>
  <div v-if="totalPages > 1" class="pagination">
    <button
      class="page-btn"
      :disabled="currentPage === 0"
      @click="emit('change', currentPage - 1)"
    >
      <i class="bi bi-chevron-left"></i>
    </button>

    <button
      v-for="page in pageWindow"
      :key="page"
      class="page-btn"
      :class="{ active: page === currentPage }"
      @click="page !== currentPage && emit('change', page)"
    >
      {{ page + 1 }}
    </button>

    <button
      class="page-btn"
      :disabled="currentPage === totalPages - 1"
      @click="emit('change', currentPage + 1)"
    >
      <i class="bi bi-chevron-right"></i>
    </button>
  </div>
</template>

<style src="../assets/css/pagination.css"></style>
