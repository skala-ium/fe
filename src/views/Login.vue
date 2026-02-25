<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const emit = defineEmits<{
  'login-success': []
}>();

const authStore = useAuthStore();

const loginForm = ref({
  identifier: '',
  password: '',
  rememberMe: false,
});

const activeTab = ref<'student' | 'teacher'>('student');
const errorMessage = ref('');
const isLoading = ref(false);

const loginButtonText = computed(() => {
  return activeTab.value === 'student' ? '학생으로 로그인' : '교수로 로그인';
});

const setActiveTab = (tab: 'student' | 'teacher'): void => {
  activeTab.value = tab;
  errorMessage.value = '';
};

const handleLogin = async (): Promise<void> => {
  errorMessage.value = '';
  isLoading.value = true;

  const role = activeTab.value === 'teacher' ? 'PROFESSOR' : 'STUDENT';

  try {
    await authStore.login(loginForm.value.identifier, loginForm.value.password, role);
    emit('login-success');
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message || '로그인에 실패했습니다. 정보를 확인해주세요.';
  } finally {
    isLoading.value = false;
  }
};

const handleForgotPassword = (): void => {
  alert('비밀번호 찾기 기능은 준비 중입니다.');
};
</script>

<template>
  <div class="login-container">
    <!-- Left Panel -->
    <div class="left-panel">
      <div class="branding">
        <h1>교육 관리 시스템</h1>
        <p>학생과 교수를 위한 통합 플랫폼</p>
      </div>

      <div class="features">
        <div class="feature-item">
          <div class="feature-icon">
            <span class="feature-emoji">🎓</span>
          </div>
          <div class="feature-text">
            <h3>학생</h3>
            <p>과제 제출, 성적 확인, 스케줄 관리</p>
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon">
            <span class="feature-emoji">👨‍🏫</span>
          </div>
          <div class="feature-text">
            <h3>교수</h3>
            <p>과제 관리, 학생 평가, 성적 분석</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="right-panel">
      <div class="login-box">
        <h2>로그인</h2>
        <p class="subtitle">계정에 로그인하세요</p>

        <!-- Role Tabs -->
        <div class="role-tabs">
          <button
            class="role-tab"
            :class="{ active: activeTab === 'student' }"
            @click="setActiveTab('student')"
          >
            학생
          </button>
          <button
            class="role-tab"
            :class="{ active: activeTab === 'teacher' }"
            @click="setActiveTab('teacher')"
          >
            교수
          </button>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="login-form">
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <div class="form-group">
            <label for="identifier">{{ activeTab === 'teacher' ? '이메일' : 'Slack User ID' }}</label>
            <input
              id="identifier"
              v-model="loginForm.identifier"
              type="text"
              :placeholder="activeTab === 'teacher' ? '이메일 입력' : 'Slack User ID 입력'"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">비밀번호</label>
            <input
              id="password"
              v-model="loginForm.password"
              type="password"
              placeholder="········"
              required
            />
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input v-model="loginForm.rememberMe" type="checkbox" />
              <span>로그인 상태 유지</span>
            </label>
            <button type="button" class="forgot-password" @click="handleForgotPassword">
              비밀번호 찾기
            </button>
          </div>

          <button type="submit" class="login-button" :disabled="isLoading">
            {{ isLoading ? '로그인 중...' : loginButtonText }}
          </button>

          <p class="signup-link">
            처음 방문이신가요? <a href="#" @click.prevent>회원가입(Myuniv)</a> 하기
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped src="../assets/css/login.css"></style>
