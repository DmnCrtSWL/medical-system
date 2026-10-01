<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Building2, FileText, DollarSign, Stethoscope } from 'lucide-vue-next';
import Button from '../components/ui/Button.vue';
import { useAuthStore } from '../stores/auth';
import { useCompanyStore } from '../stores/companies';
import { useContractStore } from '../stores/contracts';
import { useDoctorStore } from '../stores/doctors';

const router = useRouter();
const authStore = useAuthStore();
const companyStore = useCompanyStore();
const contractStore = useContractStore();
const doctorStore = useDoctorStore();

onMounted(() => {
  if (authStore.token && !authStore.user) {
    authStore.fetchProfile();
  }
  companyStore.fetchCompanies();
  contractStore.fetchContracts();
  doctorStore.fetchDoctors();
});

const stats = computed(() => {
  const activeContracts = contractStore.contracts.filter((c) => c.status === 'ACTIVE');
  const monthlyRevenue = activeContracts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  return [
    {
      name: 'Empresas Afiliadas',
      value: String(companyStore.companies.length),
      icon: Building2,
      color: 'text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-950/40',
    },
    {
      name: 'Contratos Activos',
      value: String(activeContracts.length),
      icon: FileText,
      color: 'text-mint-500',
      bg: 'bg-mint-100 dark:bg-mint-950/40',
    },
    {
      name: 'Médicos en Plantilla',
      value: String(doctorStore.doctors.length),
      icon: Stethoscope,
      color: 'text-purple-500',
      bg: 'bg-purple-100 dark:bg-purple-950/40',
    },
    {
      name: 'Póliza Mensual Activa',
      value: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(monthlyRevenue),
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    },
  ];
});

const recentCompanies = computed(() => {
  return companyStore.companies.slice(0, 5);
});
</script>

<template>
  <div>
    <header class="flex justify-between items-center mb-10">
      <div>
        <h2 class="text-3xl font-bold text-foreground transition-colors duration-300">Resumen Corporativo B2B</h2>
        <p class="text-muted-foreground transition-colors duration-300 mt-1">Métricas y administración general de la clínica.</p>
      </div>
    </header>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <Card v-for="(stat, idx) in stats" :key="idx" class="border-none shadow-sm hover:shadow-md transition-shadow">
        <CardContent class="p-6 flex items-center gap-4">
          <div :class="[stat.bg, stat.color, 'w-14 h-14 rounded-2xl flex items-center justify-center']">
            <component :is="stat.icon" class="w-7 h-7" />
          </div>
          <div>
            <p class="text-sm font-medium text-muted-foreground transition-colors duration-300">{{ stat.name }}</p>
            <h3 class="text-2xl font-bold text-foreground transition-colors duration-300 mt-1">{{ stat.value }}</h3>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Empresas -->
      <div class="lg:col-span-2">
        <Card class="border-border shadow-sm h-full">
          <CardHeader class="flex flex-row items-center justify-between border-b border-border pb-4">
            <CardTitle class="text-lg font-bold text-foreground transition-colors duration-300">Cartera de Empresas B2B</CardTitle>
            <Button variant="outline" size="sm" class="text-mint-600 border-mint-200 hover:bg-mint-50" @click="router.push('/companies')">Gestionar</Button>
          </CardHeader>
          <CardContent class="p-0">
            <div v-if="recentCompanies.length === 0" class="p-8 text-center text-muted-foreground text-sm">
              No hay empresas registradas aún.
            </div>
            <div v-else class="divide-y divide-slate-100 dark:divide-black">
              <div v-for="company in recentCompanies" :key="company.id" class="p-4 flex items-center justify-between hover:bg-muted transition-colors cursor-pointer" @click="router.push('/companies')">
                <div class="flex items-center gap-4 min-w-0">
                  <div class="w-1 h-10 rounded-full bg-mint-500 shrink-0"></div>
                  <div class="min-w-0">
                    <p class="font-semibold text-foreground truncate">{{ company.legalName || company.name }}</p>
                    <p class="text-xs text-muted-foreground truncate">{{ company.representativeName || company.email || 'Convenio corporativo' }}</p>
                  </div>
                </div>
                <div class="text-right shrink-0 ml-3">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-mint-100 dark:bg-mint-950 text-mint-700 dark:text-mint-300">
                    Afiliada
                  </span>
                  <p class="text-[11px] text-slate-400 mt-1">
                    {{ new Date(company.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Generador de Contratos -->
      <div>
        <Card class="border-border shadow-sm h-full bg-gradient-to-br from-navy-900 to-navy-800 text-white relative overflow-hidden">
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
              <Button class="w-full bg-mint-500 hover:bg-mint-600 text-foreground transition-colors duration-300 font-bold mt-4 shadow-lg shadow-mint-500/30" @click="router.push('/contracts')">
                Generar Documento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
