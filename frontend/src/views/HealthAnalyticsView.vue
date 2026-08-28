<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  Activity,
  Building2,
  Users,
  Stethoscope,
  TrendingUp,
  AlertCircle,
  RotateCw,
  Scale,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button.vue';
import {
  analyticsService,
  type HealthAnalyticsData,
  type CompanyOption,
  type RecentConsultationItem,
} from '../services/analytics.service';

const selectedCompanyId = ref<string>('ALL');
const companies = ref<CompanyOption[]>([]);
const analytics = ref<HealthAnalyticsData | null>(null);
const recentConsultations = ref<RecentConsultationItem[]>([]);
const isLoading = ref<boolean>(true);
const errorMessage = ref<string | null>(null);

const selectedCompanyName = computed(() => {
  if (selectedCompanyId.value === 'ALL') {
    return 'Consolidado Global (Todos los Clientes)';
  }
  const found = companies.value.find((c) => c.id === selectedCompanyId.value);
  return found ? found.name : 'Empresa Seleccionada';
});

const loadData = async () => {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const [companiesList, analyticsData, consultationsList] = await Promise.all([
      analyticsService.getCompanies(),
      analyticsService.getHealthAnalytics(selectedCompanyId.value),
      analyticsService.getRecentConsultations(selectedCompanyId.value, 8),
    ]);

    companies.value = Array.isArray(companiesList) ? companiesList : [];
    analytics.value = analyticsData;
    recentConsultations.value = consultationsList;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al cargar las analíticas';
    errorMessage.value = msg;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadData();
});

const handleCompanyChange = () => {
  loadData();
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getBmiBadgeClass = (bmi?: number) => {
  if (!bmi) return 'bg-slate-100 text-slate-700 border-slate-200';
  if (bmi < 18.5) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (bmi < 25) return 'bg-mint-50 text-mint-700 border-mint-200';
  if (bmi < 30) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
};

const getBmiCategoryLabel = (bmi?: number) => {
  if (!bmi) return 'N/A';
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidad';
};
</script>

<template>
  <div class="space-y-8">
    <!-- Header y Selector de Empresa -->
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-mint-500/10 border border-mint-500/20 flex items-center justify-center text-mint-600 shadow-sm">
            <Activity class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-3xl font-extrabold tracking-tight text-slate-900">Analíticas de Salud B2B</h2>
            <p class="text-sm font-medium text-slate-500 mt-0.5">
              Monitoreo epidemiológico y morbilidad laboral de trabajadores en planta
            </p>
          </div>
        </div>
      </div>

      <!-- Selector de Empresa Corporativa -->
      <div class="flex items-center gap-3">
        <div class="relative min-w-[280px]">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Building2 class="w-4 h-4" />
          </div>
          <select
            v-model="selectedCompanyId"
            @change="handleCompanyChange"
            class="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-mint-500 shadow-sm transition-all cursor-pointer"
          >
            <option value="ALL">🌐 Consolidado Global (Todos los Clientes)</option>
            <option v-for="comp in companies" :key="comp.id" :value="comp.id">
              🏢 {{ comp.name }}
            </option>
          </select>
        </div>

        <Button
          variant="outline"
          class="rounded-xl border-slate-300 hover:bg-slate-100 flex items-center gap-2 text-slate-700 px-3.5"
          :disabled="isLoading"
          @click="loadData"
        >
          <RotateCw :class="['w-4 h-4 text-slate-600', isLoading ? 'animate-spin' : '']" />
          <span class="hidden sm:inline">Actualizar</span>
        </Button>
      </div>
    </header>

    <!-- Error Banner -->
    <div
      v-if="errorMessage"
      class="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 text-sm"
    >
      <AlertCircle class="w-5 h-5 flex-shrink-0 text-rose-500" />
      <span class="flex-1 font-medium">{{ errorMessage }}</span>
      <Button variant="outline" class="text-xs h-8 bg-white border-rose-300 text-rose-700 hover:bg-rose-50" @click="loadData">
        Reintentar
      </Button>
    </div>

    <!-- Indicador de Empresa Activa (Texto Limpio sin Background) -->
    <div class="flex items-center gap-2 text-sm text-slate-600 py-1">
      <span class="text-slate-400 font-medium">Reporte para:</span>
      <span class="font-bold text-slate-900 text-base">{{ selectedCompanyName }}</span>
    </div>

    <!-- KPIs Principales de Salud -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- KPI 1: Total Consultas -->
      <Card class="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
        <CardContent class="p-5 flex items-center gap-4">
          <div class="w-13 h-13 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <Activity class="w-6 h-6" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consultas Atendidas</p>
            <h3 class="text-2xl font-extrabold text-slate-900 mt-1">
              {{ analytics?.totalConsultations ?? 0 }}
            </h3>
            <p class="text-xs text-mint-600 font-medium mt-0.5 flex items-center gap-1">
              <TrendingUp class="w-3 h-3" /> Expedientes sincronizados
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- KPI 2: Pacientes Únicos -->
      <Card class="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
        <CardContent class="p-5 flex items-center gap-4">
          <div class="w-13 h-13 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
            <Users class="w-6 h-6" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trabajadores Evaluados</p>
            <h3 class="text-2xl font-extrabold text-slate-900 mt-1">
              {{ analytics?.uniquePatients ?? 0 }}
            </h3>
            <p class="text-xs text-slate-500 font-medium mt-0.5">
              Plantilla laboral cubierta
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- KPI 3: Padecimiento #1 -->
      <Card class="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
        <CardContent class="p-5 flex items-center gap-4">
          <div class="w-13 h-13 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner">
            <AlertCircle class="w-6 h-6" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Padecimiento #1 Frecuente</p>
            <h3 class="text-base font-extrabold text-slate-900 mt-1 truncate" :title="analytics?.topDiagnoses[0]?.name || 'Sin registros'">
              {{ analytics?.topDiagnoses[0]?.name || 'Ninguno' }}
            </h3>
            <p class="text-xs text-slate-500 font-medium mt-0.5">
              {{ analytics?.topDiagnoses[0]?.percentage ?? 0 }}% del total de consultas
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- KPI 4: IMC Promedio -->
      <Card class="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
        <CardContent class="p-5 flex items-center gap-4">
          <div class="w-13 h-13 rounded-2xl bg-mint-50 text-mint-600 flex items-center justify-center shadow-inner">
            <Scale class="w-6 h-6" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">IMC Promedio</p>
            <div class="flex items-baseline gap-2 mt-1">
              <h3 class="text-2xl font-extrabold text-slate-900">
                {{ analytics?.vitals?.averageBmi ? `${analytics.vitals.averageBmi} kg/m²` : 'N/A' }}
              </h3>
            </div>
            <p class="text-xs font-medium text-slate-500 mt-0.5">
              Presión media: {{ analytics?.vitals?.averageBloodPressure?.systolic || 120 }}/{{ analytics?.vitals?.averageBloodPressure?.diastolic || 80 }} mmHg
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Sección de Gráficos e Inteligencia Médica -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Top 5 Diagnósticos Laborales -->
      <Card class="lg:col-span-7 border-slate-200/80 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader class="border-b border-slate-100 bg-white px-6 py-5">
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope class="w-5 h-5 text-mint-500" />
                Top Diagnósticos y Motivos de Consulta
              </CardTitle>
              <CardDescription class="text-xs text-slate-500 mt-0.5">
                Enfermedades y molestias más recurrentes reportadas por el equipo médico
              </CardDescription>
            </div>
            <span class="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 font-semibold rounded-lg">
              Prevalencia
            </span>
          </div>
        </CardHeader>
        <CardContent class="p-6">
          <div v-if="!analytics?.topDiagnoses || analytics.topDiagnoses.length === 0" class="py-12 text-center text-slate-400 text-sm">
            No hay consultas suficientes para generar el ranking de diagnósticos.
          </div>

          <div v-else class="space-y-5">
            <div v-for="(item, idx) in analytics.topDiagnoses" :key="idx" class="space-y-2">
              <div class="flex justify-between items-center text-sm">
                <span class="font-semibold text-slate-800 flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs flex items-center justify-center font-bold">
                    {{ idx + 1 }}
                  </span>
                  {{ item.name }}
                </span>
                <div class="text-right">
                  <span class="font-extrabold text-slate-900">{{ item.count }}</span>
                  <span class="text-xs text-slate-500 ml-1 font-medium">({{ item.percentage }}%)</span>
                </div>
              </div>

              <!-- Barra de Porcentaje Dinámica -->
              <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="[
                    idx === 0 ? 'bg-mint-500' :
                    idx === 1 ? 'bg-blue-500' :
                    idx === 2 ? 'bg-indigo-500' :
                    idx === 3 ? 'bg-amber-500' : 'bg-slate-400'
                  ]"
                  :style="{ width: `${item.percentage}%` }"
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Distribución por Categorías Ocupacionales -->
      <Card class="lg:col-span-5 border-slate-200/80 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader class="border-b border-slate-100 bg-white px-6 py-5">
          <CardTitle class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck class="w-5 h-5 text-blue-500" />
            Clasificación Ocupacional
          </CardTitle>
          <CardDescription class="text-xs text-slate-500 mt-0.5">
            Distribución por área preventiva y riesgo en el trabajo
          </CardDescription>
        </CardHeader>
        <CardContent class="p-6">
          <div class="space-y-4">
            <div
              v-for="(cat, idx) in analytics?.categoryDistribution"
              :key="idx"
              class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all flex items-center justify-between"
            >
              <div class="space-y-0.5">
                <p class="text-xs font-bold text-slate-800">{{ cat.category }}</p>
                <p class="text-xs text-slate-400 font-medium">{{ cat.count }} consultas registradas</p>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div class="h-full bg-slate-800 rounded-full" :style="{ width: `${cat.percentage}%` }"></div>
                </div>
                <span class="text-xs font-extrabold text-slate-800 min-w-[34px] text-right">
                  {{ cat.percentage }}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Sección de Somatometría e IMC Corporativo -->
    <Card class="border-slate-200/80 shadow-sm rounded-3xl overflow-hidden">
      <CardHeader class="border-b border-slate-100 bg-white px-6 py-5">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Scale class="w-5 h-5 text-emerald-500" />
              Perfil Somatométrico de la Plantilla Laboral
            </CardTitle>
            <CardDescription class="text-xs text-slate-500 mt-0.5">
              Estado de nutrición e Índice de Masa Corporal (IMC) del personal evaluado
            </CardDescription>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <span class="flex items-center gap-1.5 font-medium text-slate-600">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Bajo Peso (&lt;18.5)
            </span>
            <span class="flex items-center gap-1.5 font-medium text-slate-600">
              <span class="w-2.5 h-2.5 rounded-full bg-mint-500"></span> Normal (18.5 - 24.9)
            </span>
            <span class="flex items-center gap-1.5 font-medium text-slate-600">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Sobrepeso (25 - 29.9)
            </span>
            <span class="flex items-center gap-1.5 font-medium text-slate-600">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Obesidad (&ge;30)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent class="p-6">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-center">
            <p class="text-xs font-bold text-blue-800 uppercase tracking-wide">Bajo Peso</p>
            <p class="text-2xl font-black text-blue-900 mt-1">
              {{ analytics?.vitals?.bmiCategories?.underweight ?? 0 }}
            </p>
            <p class="text-xs text-blue-600 mt-0.5 font-medium">&lt; 18.5 kg/m²</p>
          </div>

          <div class="p-4 rounded-2xl bg-mint-50/60 border border-mint-200/80 text-center">
            <p class="text-xs font-bold text-mint-800 uppercase tracking-wide">Normal (Saludable)</p>
            <p class="text-2xl font-black text-mint-900 mt-1">
              {{ analytics?.vitals?.bmiCategories?.normal ?? 0 }}
            </p>
            <p class="text-xs text-mint-600 mt-0.5 font-medium">18.5 - 24.9 kg/m²</p>
          </div>

          <div class="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
            <p class="text-xs font-bold text-amber-800 uppercase tracking-wide">Sobrepeso</p>
            <p class="text-2xl font-black text-amber-900 mt-1">
              {{ analytics?.vitals?.bmiCategories?.overweight ?? 0 }}
            </p>
            <p class="text-xs text-amber-600 mt-0.5 font-medium">25.0 - 29.9 kg/m²</p>
          </div>

          <div class="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 text-center">
            <p class="text-xs font-bold text-rose-800 uppercase tracking-wide">Obesidad</p>
            <p class="text-2xl font-black text-rose-900 mt-1">
              {{ analytics?.vitals?.bmiCategories?.obese ?? 0 }}
            </p>
            <p class="text-xs text-rose-600 mt-0.5 font-medium">&ge; 30.0 kg/m²</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Tabla de Últimas Consultas Registradas -->
    <Card class="border-slate-200/80 shadow-sm rounded-3xl overflow-hidden">
      <CardHeader class="border-b border-slate-100 bg-white px-6 py-5">
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet class="w-5 h-5 text-slate-700" />
              Expedientes Clínicos Recientes
            </CardTitle>
            <CardDescription class="text-xs text-slate-500 mt-0.5">
              Consultas médicas sincronizadas desde la app móvil del médico
            </CardDescription>
          </div>
          <span class="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-xl">
            {{ recentConsultations.length }} mostrados
          </span>
        </div>
      </CardHeader>
      <CardContent class="p-0">
        <div v-if="recentConsultations.length === 0" class="p-12 text-center text-slate-400 text-sm">
          No hay expedientes clínicos registrados aún para este corporativo.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200/80">
              <tr>
                <th class="py-3.5 px-6 font-bold">Trabajador (Paciente)</th>
                <th class="py-3.5 px-6 font-bold">Empresa</th>
                <th class="py-3.5 px-6 font-bold">Diagnóstico Emitido</th>
                <th class="py-3.5 px-6 font-bold">Somatometría (IMC)</th>
                <th class="py-3.5 px-6 font-bold">Médico Tratante</th>
                <th class="py-3.5 px-6 font-bold text-right">Fecha</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              <tr v-for="consultation in recentConsultations" :key="consultation.id" class="hover:bg-slate-50/60 transition-colors">
                <td class="py-4 px-6">
                  <div class="font-bold text-slate-900">
                    {{ consultation.patient?.firstName }} {{ consultation.patient?.lastName }}
                  </div>
                  <div class="text-xs text-slate-400 font-medium">
                    Ficha: {{ consultation.patient?.employeeNumber || 'Sin ficha' }}
                  </div>
                </td>
                <td class="py-4 px-6 text-slate-700 font-semibold">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">
                    <Building2 class="w-3.5 h-3.5 text-slate-500" />
                    {{ consultation.company?.name || 'In-House' }}
                  </span>
                </td>
                <td class="py-4 px-6">
                  <div class="font-semibold text-slate-800">{{ consultation.diagnosisDescription }}</div>
                  <div class="text-xs text-slate-500 truncate max-w-xs font-normal">{{ consultation.chiefComplaint }}</div>
                </td>
                <td class="py-4 px-6">
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
                    :class="getBmiBadgeClass(consultation.bmi)"
                  >
                    {{ consultation.bmi ? `${consultation.bmi} kg/m²` : 'N/A' }}
                    ({{ getBmiCategoryLabel(consultation.bmi) }})
                  </span>
                  <div v-if="consultation.bloodPressureSystolic" class="text-xs text-slate-400 mt-0.5">
                    PA: {{ consultation.bloodPressureSystolic }}/{{ consultation.bloodPressureDiastolic }} mmHg
                  </div>
                </td>
                <td class="py-4 px-6 text-slate-700 text-xs">
                  <div class="font-bold text-slate-800">{{ consultation.doctor?.user?.name || 'Dr. Médico' }}</div>
                  <div class="text-slate-400">Médico Ocupacional</div>
                </td>
                <td class="py-4 px-6 text-right text-xs text-slate-500 font-semibold whitespace-nowrap">
                  {{ formatDate(consultation.consultationDate) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
