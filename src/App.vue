<script setup lang="ts">
import { ref, provide, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import Login from './views/Login.vue'
import SignUp from './views/SignUp.vue'
import AssignmentListView from './views/AssignmentListView.vue'
import AssignmentCreateView from './views/AssignmentCreateView.vue'
import Dashboard from './views/Dashboard.vue'
import StudentDashboard from './views/StudentDashboard.vue'
import StudentAssignmentList from './views/StudentAssignmentList.vue'
import StudentAssignmentDetail from './views/StudentAssignmentDetail.vue'

const authStore = useAuthStore();
const currentPage = ref<string>('dashboard');
const currentAssignmentId = ref<string>('');
const currentAuthView = ref<'login' | 'signup'>('login');
const initialLoading = ref(true);

onMounted(async () => {
  await authStore.fetchUser();
  initialLoading.value = false;
});

const handleLogin = () => {
  currentPage.value = 'dashboard';
  currentAuthView.value = 'login';
};

const handleLogout = async () => {
  await authStore.logout();
  currentPage.value = 'dashboard';
};

const handleNavigate = (menuId: string, params?: any) => {
  currentPage.value = menuId;
  if (params?.assignmentId) {
    currentAssignmentId.value = params.assignmentId;
  }
};

provide('navigate', handleNavigate);
provide('logout', handleLogout);
provide('currentPage', currentPage);
</script>

<template>
  <div v-if="initialLoading" class="loading-screen">
    <p>로딩 중...</p>
  </div>
  <Login
    v-else-if="!authStore.isLoggedIn && currentAuthView === 'login'"
    @login-success="handleLogin"
    @go-signup="currentAuthView = 'signup'"
  />
  <SignUp
    v-else-if="!authStore.isLoggedIn && currentAuthView === 'signup'"
    @signup-success="currentAuthView = 'login'"
    @go-login="currentAuthView = 'login'"
  />
  <template v-else>
    <!-- 교수 포털 -->
    <template v-if="authStore.user?.role === 'PROFESSOR'">
      <Dashboard
        v-if="currentPage === 'dashboard'"
        :active-menu="currentPage"
        @navigate="handleNavigate"
        @logout="handleLogout"
      />
      <AssignmentListView
        v-else-if="currentPage === 'assignments'"
        :active-menu="currentPage"
        @navigate="handleNavigate"
        @logout="handleLogout"
      />
      <AssignmentCreateView
        v-else-if="currentPage === 'create-assignment'"
        :active-menu="currentPage"
        @navigate="handleNavigate"
        @logout="handleLogout"
      />
      <Dashboard
        v-else
        :active-menu="currentPage"
        @navigate="handleNavigate"
        @logout="handleLogout"
      />
    </template>

    <!-- 학생 포털 -->
    <template v-else-if="authStore.user?.role === 'STUDENT'">
      <StudentDashboard
        v-if="currentPage === 'dashboard'"
        :active-menu="currentPage"
        @navigate="handleNavigate"
        @logout="handleLogout"
      />
      <StudentAssignmentList
        v-else-if="currentPage === 'assignments'"
        :active-menu="currentPage"
        @navigate="handleNavigate"
        @logout="handleLogout"
      />
      <StudentAssignmentDetail
        v-else-if="currentPage === 'assignment-detail'"
        :active-menu="'assignments'"
        :assignment-id="currentAssignmentId"
        @navigate="handleNavigate"
        @logout="handleLogout"
      />
      <StudentDashboard
        v-else
        :active-menu="currentPage"
        @navigate="handleNavigate"
        @logout="handleLogout"
      />
    </template>
  </template>
</template>

<style scoped>
.loading-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: #6b7280;
}
</style>
