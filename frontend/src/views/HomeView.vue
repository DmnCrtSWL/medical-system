<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Building2, FileText, DollarSign, TrendingUp, Bell, Users } from 'lucide-vue-next';
import Button from '../components/ui/Button.vue';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  if (authStore.token && !authStore.user) {
    authStore.fetchProfile();
  }
});

const stats = [
  { name: 'Empresas Afiliadas', value: '24', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-100' },
  { name: 'Contratos Activos', value: '18', icon: FileText, color: 'text-mint-500', bg: 'bg-mint-100' },
  { name: 'Pacientes Corporativos', value: '856', icon: Users, color: 'text-purple-500', bg: 'bg-purple-100' },
  { name: 'Ingresos B2B (Mes)', value: '$45,200', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-100' },
];

const companies = [
  { name: 'Tech Solutions Inc.', plan: 'Corporativo Premium', status: 'Activo', date: '21 Ago 2026' },
  { name: 'Industrias Delta', plan: 'Plan Salud Básica', status: 'Renovación Pendiente', date: '15 Ago 2026' },
  { name: 'Logística Express', plan: 'Corporativo Estándar', status: 'Activo', date: '10 Ago 2026' },
  { name: 'Agencia Creativa', plan: 'Plan Pyme', status: 'En revisión', date: '05 Ago 2026' },
];
</script>

<template>
  <div>
    <header class="flex justify-between items-center mb-10">
      <div>
        <h2 class="text-3xl font-bold text-slate-800">Resumen Corporativo B2B</h2>
        <p class="text-slate-500 mt-1">Métricas y administración general de la clínica.</p>
      </div>
      <button class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-slate-500 hover:text-mint-600 transition-colors relative">
        <Bell class="w-5 h-5" />
        <span class="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
      </button>
    </header>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <Card v-for="(stat, idx) in stats" :key="idx" class="border-none shadow-sm hover:shadow-md transition-shadow">
        <CardContent class="p-6 flex items-center gap-4">
          <div :class="[stat.bg, stat.color, 'w-14 h-14 rounded-2xl flex items-center justify-center']">
            <component :is="stat.icon" class="w-7 h-7" />
          </div>
          <div>
            <p class="text-sm font-medium text-slate-500">{{ stat.name }}</p>
            <h3 class="text-2xl font-bold text-slate-800 mt-1">{{ stat.value }}</h3>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Empresas -->
      <div class="lg:col-span-2">
        <Card class="border-slate-200 shadow-sm h-full">
          <CardHeader class="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <CardTitle class="text-lg font-bold text-slate-800">Cartera de Empresas B2B</CardTitle>
            <Button variant="outline" size="sm" class="text-mint-600 border-mint-200 hover:bg-mint-50" @click="router.push('/companies')">Gestionar</Button>
          </CardHeader>
          <CardContent class="p-0">
            <div class="divide-y divide-slate-100">
              <div v-for="(company, idx) in companies" :key="idx" class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div class="flex items-center gap-4">
                  <div class="w-1 h-10 rounded-full" :class="company.status === 'Activo' ? 'bg-emerald-400' : (company.status === 'En revisión' ? 'bg-blue-400' : 'bg-rose-400')"></div>
                  <div>
                    <p class="font-semibold text-slate-800">{{ company.name }}</p>
                    <p class="text-sm text-slate-500">{{ company.plan }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <span :class="{'px-3 py-1 rounded-full text-xs font-semibold': true, 'bg-emerald-100 text-emerald-700': company.status === 'Activo', 'bg-blue-100 text-blue-700': company.status === 'En revisión', 'bg-rose-100 text-rose-700': company.status === 'Renovación Pendiente'}">
                    {{ company.status }}
                  </span>
                  <p class="text-xs text-slate-400 mt-2">Afiliado: {{ company.date }}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Generador de Contratos -->
      <div>
        <Card class="border-slate-200 shadow-sm h-full bg-gradient-to-br from-navy-900 to-navy-800 text-white relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-mint-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
          <CardHeader>
            <CardTitle class="text-lg font-bold text-white flex items-center gap-2">
              <FileText class="w-5 h-5 text-mint-400" /> Nuevo Contrato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-slate-300 text-sm leading-relaxed mb-6">
              Generador automatizado de contratos en PDF para nuevas afiliaciones corporativas B2B.
            </p>
            <div class="space-y-4">
              <div class="p-3 bg-navy-950/50 rounded-xl border border-navy-700 flex items-center justify-between">
                <span class="text-sm text-slate-300 font-medium">Convenio Legal de Servicios</span>
                <span class="text-xs text-mint-400 bg-mint-400/10 px-2.5 py-1 rounded-lg font-semibold">PDF Oficial</span>
              </div>
              <Button class="w-full bg-mint-500 hover:bg-mint-600 text-navy-900 font-bold mt-4 shadow-lg shadow-mint-500/30" @click="router.push('/contracts')">
                Generar Documento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
