<script setup lang="ts">
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';
import { LogOut } from 'lucide-vue-next';
import Button from '../ui/Button.vue';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
    <!-- Left Area (Empty space to push right elements) -->
    <div class="flex-1"></div>

    <!-- Right Area (Profile & Actions) -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-3 pl-2">
        <div class="text-right hidden sm:block">
          <p class="text-sm font-bold text-navy-900 leading-none mb-1">{{ authStore.user?.name || 'Panel de Control' }}</p>
          <p class="text-[11px] text-mint-600 font-bold leading-none tracking-wide">{{ authStore.user?.role?.toUpperCase() === 'ADMIN' ? 'ADMINISTRADOR' : 'OPERATIVO' }}</p>
        </div>
        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-mint-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-slate-50">
          {{ authStore.user?.name?.charAt(0) || 'A' }}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          class="ml-3 border-slate-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm rounded-xl px-3 h-9"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4 mr-1.5" /> Salir
        </Button>
      </div>
    </div>
  </header>
</template>
