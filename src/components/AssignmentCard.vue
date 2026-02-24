<template>
  <div class="assignment-card" @click="handleClick">
    <div class="card-body">
      <div class="icon-section">
        <i class="bi bi-file-earmark-pdf-fill"></i>
      </div>
      <div class="content-section">
        <div class="title-row">
          <h3>{{ data.title }}</h3>
          <span class="badge class-badge">{{ data.className }}</span>
          <span class="professor-name">{{ data.professor }}</span>
        </div>
        <p class="description">{{ data.description }}</p>
      </div>
      <div class="stats-badge" :class="statusClass">
        {{ data.completePercent }}% 완료
      </div>
    </div>

    <div class="card-footer">
      <div class="footer-item">
        <i class="bi bi-calendar"></i> 마감: {{ data.deadline }} 
        <span v-if="data.isPassed" class="passed">(마감 지남)</span>
      </div>
      <div class="footer-item"><i class="bi bi-people"></i> {{ data.submitCount }} 제출</div>
      <div class="footer-item"><i class="bi bi-graph-up"></i> {{ data.submitRate }}% 제출률</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { Assignment } from '@/types/Assignment';

const props = defineProps({
  data: {
    type: Object as PropType<Assignment>,
    required: true,
  },
});

const emit = defineEmits<{
  'click': [assignment: Assignment]
}>();

const statusClass = computed((): string => {
  if (props.data.completePercent >= 90) return 'high';
  if (props.data.completePercent >= 70) return 'medium';
  return 'low';
});

const handleClick = (): void => {
  emit('click', props.data);
};
</script>

<style scoped src="@/assets/css/card.css"></style>