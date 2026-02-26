<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Sidebar from './side/Sidebar.vue';
import { classApi } from '@/api/class';
import { assignmentApi } from '@/api/assignment';
import type { ClassListItem } from '@/types/api';

const props = defineProps<{
  activeMenu: string;
}>();

const emit = defineEmits<{
  'navigate': [menuId: string];
  'logout': [];
}>();

const classes = ref<ClassListItem[]>([]);
const selectedClassId = ref('');
const title = ref('');
const description = ref('');
const topic = ref('');
const deadlineDate = ref('');
const deadlineHour = ref('11');
const deadlineMinute = ref('50');
const deadlinePeriod = ref('오후');
const requirements = ref<string[]>(['']);

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ['00', '10', '20', '30', '40', '50'];

const deadlineISO = computed(() => {
  if (!deadlineDate.value) return '';
  let hour = parseInt(deadlineHour.value);
  if (deadlinePeriod.value === '오전') {
    if (hour === 12) hour = 0;
  } else {
    if (hour !== 12) hour += 12;
  }
  const hh = String(hour).padStart(2, '0');
  const mm = deadlineMinute.value;
  return `${deadlineDate.value}T${hh}:${mm}:00+09:00`;
});

const submitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

onMounted(async () => {
  try {
    const { data } = await classApi.getClasses();
    if (data.data) {
      classes.value = data.data;
      if (classes.value.length > 0) {
        selectedClassId.value = classes.value[0]?.classId ?? '';
      }
    }
  } catch (err) {
    console.error('반 목록 로드 실패:', err);
  }
});

const addRequirement = () => {
  requirements.value.push('');
};

const removeRequirement = (index: number) => {
  requirements.value.splice(index, 1);
};

const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!selectedClassId.value || !title.value.trim() || !deadlineDate.value) {
    errorMessage.value = '반, 제목, 마감일시는 필수 항목입니다.';
    return;
  }

  submitting.value = true;
  try {
    await assignmentApi.createAssignment({
      classId: selectedClassId.value,
      title: title.value.trim(),
      description: description.value.trim(),
      topic: topic.value.trim(),
      deadline: deadlineISO.value,
      requirements: requirements.value.filter((r) => r.trim() !== ''),
    });
    successMessage.value = '과제가 성공적으로 생성되었습니다.';
    setTimeout(() => {
      emit('navigate', 'assignments');
    }, 1000);
  } catch (err) {
    errorMessage.value = '과제 생성에 실패했습니다. 다시 시도해주세요.';
    console.error('과제 생성 실패:', err);
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => {
  emit('navigate', 'assignments');
};
</script>

<template>
  <div class="app-container">
    <Sidebar
      :active-menu="props.activeMenu"
      @navigate="(id) => emit('navigate', id)"
      @logout="() => emit('logout')"
    />

    <div class="main-content">
      <header class="top-header">
        <div class="search-bar" style="visibility: hidden;">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="" />
        </div>
      </header>

      <div class="content-area">
        <div class="create-header">
          <h1>과제 생성</h1>
          <p>새로운 과제를 등록하세요.</p>
        </div>

        <div class="create-form-card">
          <div v-if="errorMessage" class="alert alert-error">
            <i class="bi bi-exclamation-circle"></i> {{ errorMessage }}
          </div>
          <div v-if="successMessage" class="alert alert-success">
            <i class="bi bi-check-circle"></i> {{ successMessage }}
          </div>

          <form @submit.prevent="handleSubmit">
            <!-- 반 선택 -->
            <div class="form-group">
              <label>반 <span class="required">*</span></label>
              <select v-model="selectedClassId" class="form-control" required>
                <option value="" disabled>반을 선택하세요</option>
                <option
                  v-for="cls in classes"
                  :key="cls.classId"
                  :value="cls.classId"
                >
                  {{ cls.className }} ({{ cls.generation }}기)
                </option>
              </select>
            </div>

            <!-- 제목 -->
            <div class="form-group">
              <label>제목 <span class="required">*</span></label>
              <input
                v-model="title"
                type="text"
                class="form-control"
                placeholder="과제 제목을 입력하세요"
                required
              />
            </div>

            <!-- 설명 -->
            <div class="form-group">
              <label>설명</label>
              <textarea
                v-model="description"
                class="form-control"
                placeholder="과제에 대한 설명을 입력하세요"
              ></textarea>
            </div>

            <!-- 주제 -->
            <div class="form-group">
              <label>주제</label>
              <input
                v-model="topic"
                type="text"
                class="form-control"
                placeholder="예: React Hooks"
              />
            </div>

            <!-- 마감일시 -->
            <div class="form-group">
              <label>마감일시 <span class="required">*</span></label>
              <div class="time-picker">
              <input
                  v-model="deadlineDate"
                  type="date"
                  class="form-control time-picker-date"
                required
              />
                <select v-model="deadlinePeriod" class="form-control time-picker-period">
                  <option>오전</option>
                  <option>오후</option>
                </select>
                <select v-model="deadlineHour" class="form-control time-picker-select">
                  <option v-for="h in HOURS" :key="h" :value="h">{{ h }}시</option>
                </select>
                <select v-model="deadlineMinute" class="form-control time-picker-select">
                  <option v-for="m in MINUTES" :key="m" :value="m">{{ m }}분</option>
                </select>
              </div>
            </div>

            <!-- 요구사항 -->
            <div class="form-group">
              <label>요구사항</label>
              <div class="requirements-editor">
                <div
                  v-for="(_, idx) in requirements"
                  :key="idx"
                  class="requirement-edit-row"
                >
                  <span class="req-edit-number">{{ idx + 1 }}</span>
                  <input
                    type="text"
                    class="form-control"
                    :value="requirements[idx]"
                    placeholder="요구사항을 입력하세요"
                    @input="requirements[idx] = ($event.target as HTMLInputElement).value"
                  />
                  <button
                    type="button"
                    class="btn-req-remove"
                    @click="removeRequirement(idx)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
                <button type="button" class="btn-req-add" @click="addRequirement">
                  <i class="bi bi-plus-circle"></i> 요구사항 추가
                </button>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-submit" :disabled="submitting">
                <i class="bi bi-plus-circle"></i>
                {{ submitting ? '생성 중...' : '과제 생성' }}
              </button>
              <button type="button" class="btn-cancel" @click="handleCancel">
                취소
              </button>              
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="../assets/css/assignment-create.css"></style>
