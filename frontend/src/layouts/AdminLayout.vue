<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useRouter, RouterLink } from 'vue-router';
import { Building2, FileText, LogOut, TrendingUp, Stethoscope, DollarSign, Activity } from 'lucide-vue-next';
import Button from '../components/ui/Button.vue';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col md:flex-row">
    <!-- Sidebar -->
    <aside class="w-full md:w-64 bg-navy-900 text-white flex flex-col shadow-2xl z-10">
      <div class="p-6 flex items-center justify-center border-b border-navy-800">
        <h1 class="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Building2 class="w-7 h-7 text-mint-400" />
          MedSys Admin
        </h1>
      </div>
      
      <div class="p-6 flex-1">
        <p class="text-xs uppercase tracking-widest text-slate-400 mb-4">Módulos</p>
        <nav class="space-y-2">
          <RouterLink to="/" class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-navy-800 hover:text-white rounded-xl transition-all font-medium">
            <TrendingUp class="w-5 h-5" /> Panel Principal
          </RouterLink>
          <RouterLink to="/analytics" class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-navy-800 hover:text-white rounded-xl transition-all font-medium">
            <Activity class="w-5 h-5 text-mint-400" /> Analíticas de Salud B2B
          </RouterLink>
          <RouterLink to="/companies" class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-navy-800 hover:text-white rounded-xl transition-all font-medium">
            <Building2 class="w-5 h-5" /> Empresas B2B
          </RouterLink>
          <RouterLink to="/doctors" class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-navy-800 hover:text-white rounded-xl transition-all font-medium">
            <Stethoscope class="w-5 h-5" /> Doctores
          </RouterLink>
          <RouterLink to="/contracts" class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-navy-800 hover:text-white rounded-xl transition-all font-medium">
            <FileText class="w-5 h-5" /> Contratos
          </RouterLink>
          <RouterLink to="/finance" class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-navy-800 hover:text-white rounded-xl transition-all font-medium">
            <DollarSign class="w-5 h-5" /> Caja & Finanzas
          </RouterLink>
        </nav>
      </div>

      <div class="p-6 border-t border-navy-800">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-mint-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {{ authStore.user?.name?.charAt(0) || 'A' }}
          </div>
          <div class="overflow-hidden">
            <p class="font-semibold text-sm truncate">{{ authStore.user?.name || 'Panel de Control' }}</p>
            <p class="text-xs text-mint-400 font-semibold truncate">{{ authStore.user?.role?.toUpperCase() === 'ADMIN' ? 'Administrador General' : 'Staff Administrativo' }}</p>
          </div>
        </div>
        <Button
          variant="outline"
          class="w-full bg-white border-slate-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4 text-rose-500" /> Cerrar Sesión
        </Button>
      </div>
    </aside>

    <!-- Main Content injected here via Router -->
    <main class="flex-1 p-6 md:p-10 overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>
