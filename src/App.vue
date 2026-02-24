<script setup lang="ts">
import { ref, provide } from 'vue';
import Login from './views/Login.vue';
import AssignmentListView from './views/AssignmentListView.vue';
import Dashboard from './views/Dashboard.vue';

const showLogin = ref(true);
const currentPage = ref<string>('dashboard');

const handleLogin = () => {
  showLogin.value = false;
  currentPage.value = 'dashboard';
};

const handleLogout = () => {
  showLogin.value = true;
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
  <Login v-if="showLogin" @login-success="handleLogin" />
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
    <!-- Placeholder for other pages - show dashboard by default -->
    <Dashboard
      v-else
      :active-menu="currentPage"
      @navigate="handleNavigate"
      @logout="handleLogout"
    />
  </template>
</template>

<style scoped>
/* App container styles */
</style>
