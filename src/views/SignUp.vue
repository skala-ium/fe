<script setup lang="ts">
import { ref } from 'vue';
import { authApi } from '@/api/auth';

const emit = defineEmits<{
  'signup-success': [];
  'go-login': [];
}>();

const currentStep = ref<1 | 2 | 3>(1);

// 1단계 입력
const slackEmail = ref('');
// 1단계 응답 → 2단계 요청에 사용
const slackUserId = ref('');
// 2단계 응답 → 3단계 요청에 사용
const tempToken = ref('');
// 2단계 입력
const verifyCode = ref('');
// 3단계 입력
const name = ref('');
const password = ref('');
const confirmPassword = ref('');

const isLoading = ref(false);
const errorMessage = ref('');
const passwordMismatch = ref(false);

const clearError = () => {
  errorMessage.value = '';
  passwordMismatch.value = false;
};

// FastAPI HTTPException 에러 메시지 추출
const getErrorMessage = (err: any, fallback: string): string =>
  err.response?.data?.detail || fallback;

// 1단계: 슬랙 DM 인증 코드 발송 → slack_user_id 저장
const handleSendCode = async () => {
  clearError();
  isLoading.value = true;
  try {
    const { data } = await authApi.sendVerificationCode(slackEmail.value);
    slackUserId.value = data.slack_user_id;
    currentStep.value = 2;
  } catch (err: any) {
    errorMessage.value = getErrorMessage(err, '인증 코드 발송에 실패했습니다. 이메일을 확인해주세요.');
  } finally {
    isLoading.value = false;
  }
};

// 2단계: 코드 검증 → temp_token 저장
const handleVerifyCode = async () => {
  clearError();
  isLoading.value = true;
  try {
    const { data } = await authApi.verifyCode(slackUserId.value, verifyCode.value);
    tempToken.value = data.temp_token;
    currentStep.value = 3;
  } catch (err: any) {
    errorMessage.value = getErrorMessage(err, '인증 코드가 올바르지 않습니다. 다시 확인해주세요.');
  } finally {
    isLoading.value = false;
  }
};

// 코드 재발송 (slackEmail로 다시 요청)
const handleResend = async () => {
  clearError();
  verifyCode.value = '';
  isLoading.value = true;
  try {
    const { data } = await authApi.sendVerificationCode(slackEmail.value);
    slackUserId.value = data.slack_user_id;
  } catch (err: any) {
    errorMessage.value = getErrorMessage(err, '재발송에 실패했습니다.');
  } finally {
    isLoading.value = false;
  }
};

// 3단계: temp_token + 이름 + 비밀번호로 최종 가입
const handleSignUp = async () => {
  clearError();

  if (password.value !== confirmPassword.value) {
    passwordMismatch.value = true;
    return;
  }

  isLoading.value = true;
  try {
    await authApi.signup({
      temp_token: tempToken.value,
      name: name.value,
      password: password.value,
    });
    emit('signup-success');
  } catch (err: any) {
    errorMessage.value = getErrorMessage(err, '회원가입에 실패했습니다. 다시 시도해주세요.');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="signup-container">
    <!-- Left Panel -->
    <div class="left-panel">
      <div class="branding">
        <h1>교육 관리 시스템</h1>
        <p>슬랙 인증으로 간편하게 가입하세요</p>
      </div>

      <div class="steps-guide">
        <div class="step-guide-item">
          <div class="step-guide-num">1</div>
          <div class="step-guide-text">
            <h3>슬랙 이메일 입력</h3>
            <p>워크스페이스에 가입된 이메일을 입력하세요</p>
          </div>
        </div>
        <div class="step-guide-item">
          <div class="step-guide-num">2</div>
          <div class="step-guide-text">
            <h3>슬랙 DM 인증</h3>
            <p>슬랙으로 발송된 코드를 입력하세요</p>
          </div>
        </div>
        <div class="step-guide-item">
          <div class="step-guide-num">3</div>
          <div class="step-guide-text">
            <h3>가입 정보 입력</h3>
            <p>이름, 아이디, 비밀번호를 설정하세요</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="right-panel">
      <div class="signup-box">
        <h2>회원가입</h2>
        <p class="subtitle">슬랙 인증 후 계정을 만드세요</p>

        <!-- Step Indicator -->
        <div class="step-indicator">
          <div class="step-dot" :class="{ active: currentStep === 1, done: currentStep > 1 }">
            <i v-if="currentStep > 1" class="bi bi-check"></i>
            <span v-else>1</span>
          </div>
          <div class="step-line" :class="{ done: currentStep > 1 }"></div>
          <div class="step-dot" :class="{ active: currentStep === 2, done: currentStep > 2 }">
            <i v-if="currentStep > 2" class="bi bi-check"></i>
            <span v-else>2</span>
          </div>
          <div class="step-line" :class="{ done: currentStep > 2 }"></div>
          <div class="step-dot" :class="{ active: currentStep === 3 }">
            <span>3</span>
          </div>
        </div>

        <!-- 1단계: 이메일 입력 -->
        <form v-if="currentStep === 1" class="signup-form" @submit.prevent="handleSendCode">
          <div v-if="errorMessage" class="error-message">
            <i class="bi bi-exclamation-circle"></i> {{ errorMessage }}
          </div>

          <div class="form-group">
            <label for="slack-email">슬랙 워크스페이스 이메일</label>
            <input
              id="slack-email"
              v-model="slackEmail"
              type="email"
              placeholder="slack@workspace.com"
              required
            />
            <span class="hint-text">워크스페이스에 가입된 이메일을 입력하세요</span>
          </div>

          <button type="submit" class="primary-button" :disabled="isLoading">
            {{ isLoading ? '발송 중...' : '인증 코드 발송' }}
          </button>

          <p class="login-link">
            이미 계정이 있으신가요? <a href="#" @click.prevent="emit('go-login')">로그인하기</a>
          </p>
        </form>

        <!-- 2단계: 인증 코드 입력 -->
        <form v-else-if="currentStep === 2" class="signup-form" @submit.prevent="handleVerifyCode">
          <div v-if="errorMessage" class="error-message">
            <i class="bi bi-exclamation-circle"></i> {{ errorMessage }}
          </div>

          <div class="info-box">
            <i class="bi bi-slack"></i>
            <span><strong>{{ slackEmail }}</strong>로 슬랙 DM을 발송했습니다. 코드를 입력해주세요.</span>
          </div>

          <div class="form-group">
            <label for="verify-code">인증 코드</label>
            <input
              id="verify-code"
              v-model="verifyCode"
              type="text"
              placeholder="코드 6자리 입력"
              maxlength="6"
              required
            />
          </div>

          <div class="resend-link">
            코드를 받지 못하셨나요?
            <button type="button" :disabled="isLoading" @click="handleResend">
              {{ isLoading ? '발송 중...' : '코드 재발송' }}
            </button>
          </div>

          <button type="submit" class="primary-button" :disabled="isLoading">
            {{ isLoading ? '확인 중...' : '코드 확인' }}
          </button>

          <p class="login-link">
            <a href="#" @click.prevent="emit('go-login')">로그인으로 돌아가기</a>
          </p>
        </form>

        <!-- 3단계: 가입 정보 입력 -->
        <form v-else class="signup-form" @submit.prevent="handleSignUp">
          <div v-if="errorMessage" class="error-message">
            <i class="bi bi-exclamation-circle"></i> {{ errorMessage }}
          </div>

          <div class="form-group">
            <label for="name">이름</label>
            <input
              id="name"
              v-model="name"
              type="text"
              placeholder="홍길동"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">비밀번호</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="········"
              required
            />
          </div>

          <div class="form-group">
            <label for="confirm-password">비밀번호 확인</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              placeholder="········"
              :class="{ 'input-error': passwordMismatch }"
              required
            />
            <span v-if="passwordMismatch" class="field-error">비밀번호가 일치하지 않습니다.</span>
          </div>

          <button type="submit" class="primary-button" :disabled="isLoading">
            {{ isLoading ? '가입 중...' : '회원가입 완료' }}
          </button>

          <p class="login-link">
            <a href="#" @click.prevent="emit('go-login')">로그인으로 돌아가기</a>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped src="../assets/css/signup.css"></style>
