<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { Building2, FileText, TrendingUp, Stethoscope, DollarSign, Activity } from 'lucide-vue-next';
import { useAuthStore } from '../../stores/auth';
import { computed } from 'vue';

const route = useRoute();
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role?.toUpperCase() === 'ADMIN');
</script>

<template>
  <aside class="w-64 bg-navy-900 text-white flex flex-col shadow-2xl z-20 flex-shrink-0">
    <div class="h-16 flex items-center justify-center border-b border-navy-800 flex-shrink-0">
      <h1 class="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
        <Building2 class="w-6 h-6 text-mint-400" />
        MedSys Admin
      </h1>
    </div>
    
    <div class="p-4 flex-1 overflow-y-auto">
      <p class="text-[10px] uppercase tracking-widest text-slate-400 mb-4 px-2 font-bold">Módulos</p>
      <nav class="space-y-1.5">
        <RouterLink to="/" class="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm" :class="[route.path === '/' ? 'bg-mint-500/15 text-mint-400 shadow-inner' : 'text-slate-400 hover:bg-navy-800 hover:text-white']">
          <TrendingUp class="w-4 h-4" /> Panel Principal
        </RouterLink>
        <RouterLink to="/analytics" class="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm" :class="[route.path === '/analytics' ? 'bg-mint-500/15 text-mint-400 shadow-inner' : 'text-slate-400 hover:bg-navy-800 hover:text-white']">
          <Activity class="w-4 h-4" /> Analíticas B2B
        </RouterLink>
        <RouterLink to="/companies" class="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm" :class="[route.path === '/companies' ? 'bg-mint-500/15 text-mint-400 shadow-inner' : 'text-slate-400 hover:bg-navy-800 hover:text-white']">
          <Building2 class="w-4 h-4" /> Empresas B2B
        </RouterLink>
        <RouterLink to="/doctors" class="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm" :class="[route.path === '/doctors' ? 'bg-mint-500/15 text-mint-400 shadow-inner' : 'text-slate-400 hover:bg-navy-800 hover:text-white']">
          <Stethoscope class="w-4 h-4" /> Doctores
        </RouterLink>
        <RouterLink v-if="isAdmin" to="/contracts" class="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm" :class="[route.path === '/contracts' ? 'bg-mint-500/15 text-mint-400 shadow-inner' : 'text-slate-400 hover:bg-navy-800 hover:text-white']">
          <FileText class="w-4 h-4" /> Contratos
        </RouterLink>
        <RouterLink v-if="isAdmin" to="/finance" class="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm" :class="[route.path === '/finance' ? 'bg-mint-500/15 text-mint-400 shadow-inner' : 'text-slate-400 hover:bg-navy-800 hover:text-white']">
          <DollarSign class="w-4 h-4" /> Caja & Finanzas
        </RouterLink>
      </nav>
    </div>
  </aside>
</template>
