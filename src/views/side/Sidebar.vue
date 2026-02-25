<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

interface MenuItem {
  label: string;
  icon: string;
  id: string;
}

const props = defineProps<{
  activeMenu: string;
}>();

const emit = defineEmits<{
  'navigate': [menuId: string];
  'logout': [];
}>();

const authStore = useAuthStore();

const userName = computed(() => authStore.user?.name ?? '');
const userEmail = computed(() => authStore.user?.principal ?? '');
const userInitial = computed(() => userName.value.charAt(0) || '?');

const menuItems: MenuItem[] = [
  { label: '대시보드', icon: 'bi-grid', id: 'dashboard' },
  { label: '과제 목록', icon: 'bi-file-earmark-text', id: 'assignments' },
  { label: '학생 관리', icon: 'bi-people', id: 'students' },
  { label: '설정', icon: 'bi-gear', id: 'settings' },
];

const handleMenuClick = (menuId: string) => {
  emit('navigate', menuId);
};

const handleLogout = () => {
  emit('logout');
};
</script>

<template>
  <aside class="sidebar">
    <div class="logo-section">
      <h2>교수 포털</h2>
      <p>과제 관리 시스템</p>
    </div>

    <nav class="menu">
      <div
        v-for="item in menuItems"
        :key="item.id"
        class="menu-item"
        :class="{ active: activeMenu === item.id }"
        @click="handleMenuClick(item.id)"
      >
        <i class="bi" :class="item.icon"></i> {{ item.label }}
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="profile">
        <div class="avatar">{{ userInitial }}</div>
        <div class="info">
          <p class="name">{{ userName }}</p>
          <p class="email">{{ userEmail }}</p>
        </div>
      </div>
      <div class="logout-btn" @click="handleLogout">
        <i class="bi bi-box-arrow-left"></i> 로그아웃
      </div>
    </div>
  </aside>
</template>

<style src="../../assets/sidebar.css"></style>
