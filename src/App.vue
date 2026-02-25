<script setup lang="ts">
import { ref, provide, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import Login from './views/Login.vue';
import AssignmentListView from './views/AssignmentListView.vue';
import Dashboard from './views/Dashboard.vue';

const authStore = useAuthStore();
const currentPage = ref<string>('dashboard');
const initialLoading = ref(true);

onMounted(async () => {
  await authStore.fetchUser();
  initialLoading.value = false;
});

const handleLogin = () => {
  currentPage.value = 'dashboard';
};

const handleLogout = async () => {
  await authStore.logout();
  currentPage.value = 'dashboard';
};

const handleNavigate = (menuId: string) => {
  currentPage.value = menuId;
};

provide('navigate', handleNavigate);
provide('logout', handleLogout);
provide('currentPage', currentPage);
</script>

<template>
  <div v-if="initialLoading" class="loading-screen">
    <p>로딩 중...</p>
  </div>
  <Login v-else-if="!authStore.isLoggedIn" @login-success="handleLogin" />
  <template v-else>
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
    <Dashboard
      v-else
      :active-menu="currentPage"
      @navigate="handleNavigate"
      @logout="handleLogout"
    />
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
