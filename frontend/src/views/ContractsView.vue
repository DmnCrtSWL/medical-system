<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  FileText,
  Plus,
  Trash2,
  Pencil,
  ArrowLeft,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  FileDown,
  Stethoscope,
  Clock,
  CheckCircle2,
  UserCheck,
} from 'lucide-vue-next';
import { useContractStore, type Contract, type ContractTariff, type ContractDuration, type ContractStatus } from '../stores/contracts';
import { useCompanyStore } from '../stores/companies';
import { useDoctorStore } from '../stores/doctors';
import { Card, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';

const router = useRouter();
const contractStore = useContractStore();
const companyStore = useCompanyStore();
const doctorStore = useDoctorStore();

const showModal = ref(false);
const editingContractId = ref<string | null>(null);

const companyId = ref('');
const doctorId = ref('');
const tariff = ref<ContractTariff>('TARIFF_A');
const duration = ref<ContractDuration>('MONTHS_12');
const startDate = ref('');
const status = ref<ContractStatus>('ACTIVE');

const formError = ref('');
const isSubmitting = ref(false);
const successMessage = ref('');

onMounted(() => {
  contractStore.fetchContracts();
  companyStore.fetchCompanies();
  doctorStore.fetchDoctors();
});

const tariffAmounts: Record<ContractTariff, number> = {
  TARIFF_A: 30000,
  TARIFF_B: 40000,
  TARIFF_C: 50000,
};

const currentAmount = computed(() => tariffAmounts[tariff.value] || 30000);

const durationMonthsCount = computed(() => {
  switch (duration.value) {
    case 'MONTHS_6':
      return 6;
    case 'MONTHS_24':
      return 24;
    case 'MONTHS_12':
    default:
      return 12;
  }
});

const computedEndDate = computed(() => {
  if (!startDate.value) return '';
  const [year, month, day] = startDate.value.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setMonth(d.getMonth() + durationMonthsCount.value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayStr}`;
});

const selectedCompany = computed(() => {
  return companyStore.companies.find((c) => c.id === companyId.value);
});

const selectedDoctor = computed(() => {
  return doctorStore.doctors.find((d) => d.id === doctorId.value);
});

const formatDoctorTitle = (name: string) => {
  if (!name) return '';
  const trimmed = name.trim();
  return /^dr\.?\s+/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
};

const openCreateModal = () => {
  editingContractId.value = null;
  companyId.value = '';
  doctorId.value = '';
  tariff.value = 'TARIFF_A';
  duration.value = 'MONTHS_12';

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  startDate.value = `${y}-${m}-${d}`;

  status.value = 'ACTIVE';
  formError.value = '';
  showModal.value = true;
};

const openEditModal = (contract: Contract) => {
  editingContractId.value = contract.id;
  companyId.value = contract.companyId;
  doctorId.value = contract.doctorId || '';
  tariff.value = (contract.tariff as ContractTariff) || 'TARIFF_A';
  duration.value = (contract.duration as ContractDuration) || 'MONTHS_12';

  if (contract.startDate) {
    const d = new Date(contract.startDate);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    startDate.value = `${y}-${m}-${day}`;
  } else {
    startDate.value = '';
  }

  status.value = contract.status;
  formError.value = '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingContractId.value = null;
};

const handleSaveContract = async () => {
  if (!companyId.value) {
    formError.value = 'Debes seleccionar una Empresa Cliente B2B.';
    return;
  }

  if (!startDate.value) {
    formError.value = 'La fecha de inicio de vigencia es obligatoria.';
    return;
  }

  isSubmitting.value = true;
  formError.value = '';

  try {
    const payload = {
      companyId: companyId.value,
      doctorId: doctorId.value ? doctorId.value : null,
      tariff: tariff.value,
      duration: duration.value,
      startDate: startDate.value,
      endDate: computedEndDate.value,
      amount: currentAmount.value,
      status: status.value,
    };

    if (editingContractId.value) {
      await contractStore.updateContract(editingContractId.value, payload);
      successMessage.value = 'Contrato y asignación actualizados exitosamente.';
    } else {
      await contractStore.createContract(payload);
      successMessage.value = 'Contrato generado exitosamente. Machote oficial en PDF listo para descarga.';
    }
    closeModal();
    setTimeout(() => {
      successMessage.value = '';
    }, 6000);
  } catch (err) {
    if (err instanceof Error) {
      formError.value = err.message;
    } else {
      formError.value = 'Error al procesar la información del convenio.';
    }
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (id: string, companyName: string) => {
  if (confirm(`¿Estás seguro de que deseas eliminar el contrato de la empresa "${companyName}"?`)) {
    try {
      await contractStore.deleteContract(id);
      successMessage.value = `Contrato de "${companyName}" eliminado exitosamente.`;
      setTimeout(() => {
        successMessage.value = '';
      }, 4000);
    } catch {
      alert('Error al eliminar el contrato');
    }
  }
};

const handleDownloadPdf = async (contract: Contract) => {
  try {
    const name = contract.company.legalName || contract.company.name;
    await contractStore.downloadPdf(contract.id, name);
  } catch {
    alert('Error al descargar el archivo PDF del contrato.');
  }
};

const formatCurrency = (val?: number | null) => {
  if (val === undefined || val === null) return 'N/A';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getTariffBadge = (t?: string | null) => {
  switch (t) {
    case 'TARIFF_A':
      return { label: 'Tarifa A', amount: '$30,000 MXN', class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    case 'TARIFF_B':
      return { label: 'Tarifa B', amount: '$40,000 MXN', class: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    case 'TARIFF_C':
      return { label: 'Tarifa C', amount: '$50,000 MXN', class: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' };
    default:
      return { label: 'Tarifa A', amount: '$30,000 MXN', class: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
  }
};

const getDurationLabel = (d?: string | null) => {
  switch (d) {
    case 'MONTHS_6':
      return '6 Meses';
    case 'MONTHS_24':
      return '24 Meses';
    case 'MONTHS_12':
    default:
      return '12 Meses';
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header de Sección -->
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="sm" class="rounded-xl p-2 text-slate-400 hover:text-foreground cursor-pointer" @click="router.push('/')">
          <ArrowLeft class="w-5 h-5" />
        </Button>
        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-sm">
          <FileText class="w-6 h-6" />
        </div>
        <div>
          <h2 class="text-3xl font-extrabold tracking-tight text-foreground">Convenios & Contratos B2B</h2>
          <p class="text-sm font-medium text-muted-foreground mt-0.5">
            Gestión de convenios de personal médico in-house y generación de machotes PDF
          </p>
        </div>
      </div>

      <Button class="bg-mint-500 hover:bg-mint-600 text-white rounded-xl flex items-center gap-2 shadow-sm font-bold cursor-pointer" @click="openCreateModal">
        <Plus class="w-4 h-4" /> Nuevo Contrato
      </Button>
    </header>

    <!-- Banner de Notificación de Éxito -->
    <div
      v-if="successMessage"
      class="p-4 bg-mint-500/10 border border-mint-500/30 text-mint-700 dark:text-mint-300 rounded-2xl flex items-center justify-between text-sm font-semibold shadow-sm"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-5 h-5 text-mint-600 dark:text-mint-400" />
        <span>{{ successMessage }}</span>
      </div>
      <button class="text-xs hover:underline cursor-pointer" @click="successMessage = ''">Descartar</button>
    </div>

    <!-- Main Content Card -->
    <Card class="bg-card transition-colors duration-300 border border-border shadow-sm rounded-2xl overflow-hidden">
      <CardContent class="p-0">
        <!-- Loading State -->
        <div v-if="contractStore.isLoading && contractStore.contracts.length === 0" class="p-12 text-center text-muted-foreground transition-colors duration-300">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mint-500 mb-3"></div>
          <p>Cargando lista de convenios B2B...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="contractStore.contracts.length === 0" class="p-12 text-center text-muted-foreground transition-colors duration-300 space-y-3">
          <div class="w-16 h-16 rounded-2xl bg-muted/80 flex items-center justify-center mx-auto text-mint-500">
            <FileText class="w-8 h-8" />
          </div>
          <h3 class="text-lg font-semibold text-foreground transition-colors duration-300">No hay contratos registrados aún</h3>
          <p class="text-sm max-w-sm mx-auto">Comienza generando el primer convenio corporativo para habilitar la descarga del machote oficial en PDF.</p>
          <Button variant="default" class="mt-2 bg-mint-500 hover:bg-mint-600 text-white rounded-xl cursor-pointer" @click="openCreateModal">
            <Plus class="w-4 h-4 mr-1.5" />
            Generar Contrato
          </Button>
        </div>

        <!-- Table -->
        <div v-else class="w-full">
          <table class="w-full text-left text-sm text-muted-foreground transition-colors duration-300">
            <thead class="bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors duration-300 border-b border-border">
              <tr>
                <th class="px-4 py-3.5 font-bold">Cliente B2B / Empresa</th>
                <th class="px-4 py-3.5 font-bold">Médico Asignado</th>
                <th class="px-4 py-3.5 font-bold">Tarifa & Costo</th>
                <th class="px-4 py-3.5 font-bold">Duración & Vigencia</th>
                <th class="px-4 py-3.5 font-bold">Estatus</th>
                <th class="px-4 py-3.5 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-black font-medium">
              <tr v-for="contract in contractStore.contracts" :key="contract.id" class="hover:bg-muted/60 transition-colors">
                <!-- Empresa -->
                <td class="px-4 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {{ (contract.company.legalName || contract.company.name).charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-foreground truncate">{{ contract.company.legalName || contract.company.name }}</p>
                      <p v-if="contract.company.representativeName" class="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Building2 class="w-3 h-3 text-slate-400 shrink-0" />
                        Rep: {{ contract.company.representativeName }}
                      </p>
                    </div>
                  </div>
                </td>

                <!-- Médico Asignado -->
                <td class="px-4 py-3.5">
                  <div v-if="contract.doctor" class="space-y-0.5 min-w-0">
                    <p class="font-bold text-foreground text-xs flex items-center gap-1.5 truncate">
                      <Stethoscope class="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      {{ formatDoctorTitle(contract.doctor.user.name) }}
                    </p>
                    <p class="text-xs text-muted-foreground truncate">
                      Céd: {{ contract.doctor.licenseId || 'En trámite' }}
                    </p>
                  </div>
                  <span v-else class="text-xs text-slate-400 italic flex items-center gap-1">
                    <UserCheck class="w-3.5 h-3.5 text-slate-400" /> Sin médico asignado
                  </span>
                </td>

                <!-- Tarifa & Monto -->
                <td class="px-4 py-3.5 space-y-1">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold border"
                    :class="getTariffBadge(contract.tariff).class"
                  >
                    {{ getTariffBadge(contract.tariff).label }}
                  </span>
                  <div class="flex items-center gap-1 text-mint-600 dark:text-mint-400 font-bold text-xs">
                    <DollarSign class="w-3.5 h-3.5 shrink-0" />
                    <span>{{ formatCurrency(contract.amount) }}</span>
                  </div>
                </td>

                <!-- Duración & Vigencia -->
                <td class="px-4 py-3.5 space-y-0.5">
                  <div class="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground">
                    <Clock class="w-3 h-3 text-slate-400" />
                    <span>{{ getDurationLabel(contract.duration) }}</span>
                  </div>
                  <div class="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar class="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{{ formatDate(contract.startDate) }} - {{ formatDate(contract.endDate) }}</span>
                  </div>
                </td>

                <!-- Estatus -->
                <td class="px-4 py-3.5">
                  <span
                    v-if="contract.status === 'ACTIVE'"
                    class="inline-flex items-center bg-mint-500/10 text-mint-600 border border-mint-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  >
                    ACTIVO
                  </span>
                  <span
                    v-else-if="contract.status === 'EXPIRED'"
                    class="inline-flex items-center bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  >
                    EXPIRADO
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center bg-muted text-muted-foreground border border-border px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  >
                    INACTIVO
                  </span>
                </td>

                <!-- Acciones -->
                <td class="px-4 py-3.5 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      class="text-mint-600 hover:text-mint-700 hover:bg-mint-500/10 rounded-xl p-2 h-8 w-8 inline-flex items-center justify-center cursor-pointer transition-colors"
                      title="Descargar Machote Oficial en PDF"
                      :disabled="contractStore.isDownloading"
                      @click="handleDownloadPdf(contract)"
                    >
                      <FileDown class="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      class="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-xl p-2 h-8 w-8 inline-flex items-center justify-center cursor-pointer transition-colors"
                      title="Editar Convenio"
                      @click="openEditModal(contract)"
                    >
                      <Pencil class="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      class="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl p-2 h-8 w-8 inline-flex items-center justify-center cursor-pointer transition-colors"
                      title="Eliminar Convenio"
                      @click="handleDelete(contract.id, contract.company.legalName || contract.company.name)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Modal Form (Nuevo / Editar Contrato) -->
    <div v-if="showModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-card border border-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h2 class="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText class="w-5 h-5 text-amber-500" />
            {{ editingContractId ? 'Editar Convenio & Contrato B2B' : 'Generar Nuevo Contrato B2B' }}
          </h2>
          <button class="text-slate-400 hover:text-foreground text-lg font-bold cursor-pointer" @click="closeModal">&times;</button>
        </div>

        <form class="space-y-4" @submit.prevent="handleSaveContract">
          <div v-if="formError" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle class="w-4 h-4 text-rose-500 shrink-0" />
            <span>{{ formError }}</span>
          </div>

          <!-- Selección Empresa & Doctor -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Empresa Cliente B2B <span class="text-mint-500">*</span>
              </label>
              <select
                v-model="companyId"
                class="w-full h-11 px-3.5 py-2.5 bg-card border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 cursor-pointer"
                :disabled="isSubmitting"
                required
              >
                <option value="" disabled>-- Selecciona Empresa --</option>
                <option v-for="c in companyStore.companies" :key="c.id" :value="c.id">
                  {{ c.legalName || c.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Médico Residente Asignado
              </label>
              <select
                v-model="doctorId"
                class="w-full h-11 px-3.5 py-2.5 bg-card border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 cursor-pointer"
                :disabled="isSubmitting"
              >
                <option value="">-- Sin asignar / Asignar después --</option>
                <option v-for="d in doctorStore.doctors" :key="d.id" :value="d.id">
                  {{ formatDoctorTitle(d.user.name) }} ({{ d.specialty || 'General' }})
                </option>
              </select>
            </div>
          </div>

          <!-- Tarifas & Duración -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Tarifa Preestablecida <span class="text-mint-500">*</span>
              </label>
              <select
                v-model="tariff"
                class="w-full h-11 px-3.5 py-2.5 bg-card border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 cursor-pointer"
                :disabled="isSubmitting"
                required
              >
                <option value="TARIFF_A">Tarifa A ($30,000 MXN / mes)</option>
                <option value="TARIFF_B">Tarifa B ($40,000 MXN / mes)</option>
                <option value="TARIFF_C">Tarifa C ($50,000 MXN / mes)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Tiempo de Contrato <span class="text-mint-500">*</span>
              </label>
              <select
                v-model="duration"
                class="w-full h-11 px-3.5 py-2.5 bg-card border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 cursor-pointer"
                :disabled="isSubmitting"
                required
              >
                <option value="MONTHS_6">6 Meses</option>
                <option value="MONTHS_12">12 Meses (1 Año)</option>
                <option value="MONTHS_24">24 Meses (2 Años)</option>
              </select>
            </div>
          </div>

          <!-- Fecha de Inicio y Término Calculada -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Fecha de Inicio <span class="text-mint-500">*</span>
              </label>
              <Input
                v-model="startDate"
                type="date"
                class="bg-card border-input text-foreground"
                :disabled="isSubmitting"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Fecha de Término (Automática)
              </label>
              <div class="h-11 px-4 py-2.5 bg-muted/60 border border-input rounded-xl text-sm font-semibold flex items-center text-foreground">
                <Calendar class="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <span>{{ computedEndDate || 'Selecciona inicio' }}</span>
              </div>
            </div>
          </div>

          <!-- Estatus -->
          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Estatus del Contrato</label>
            <select
              v-model="status"
              class="w-full h-11 px-3.5 py-2.5 bg-card border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 cursor-pointer"
              :disabled="isSubmitting"
            >
              <option value="ACTIVE">ACTIVO (En Vigor)</option>
              <option value="INACTIVE">INACTIVO (Suspendido)</option>
              <option value="EXPIRED">EXPIRADO (Vencido)</option>
            </select>
          </div>

          <!-- Vista Previa del Machote Dinámico en Tiempo Real -->
          <div class="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5 text-xs">
            <div class="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
              <FileText class="w-4 h-4 text-amber-600" />
              <span>Vista Previa del Machote Legal:</span>
            </div>
            <p class="text-slate-600 dark:text-slate-300 leading-relaxed italic">
              "Nosotros como prestadores de servicios a la Empresa
              <strong class="text-foreground">{{ selectedCompany ? (selectedCompany.legalName || selectedCompany.name) : '[Empresa Seleccionada]' }}</strong>
              el servicio de personal médico residente
              <strong class="text-foreground">{{ selectedDoctor ? `(${formatDoctorTitle(selectedDoctor.user.name)})` : '(Médico Asignado)' }}</strong>
              para su empresa por el costo de
              <strong class="text-emerald-600 dark:text-emerald-400">{{ formatCurrency(currentAmount) }}</strong>
              en un periodo de
              <strong class="text-foreground">{{ durationMonthsCount }} meses</strong>.
              Fecha de emisión, nombres de los representantes legales y firma."
            </p>
          </div>

          <!-- Botones de Acción -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              class="rounded-xl cursor-pointer"
              :disabled="isSubmitting"
              @click="closeModal"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              class="bg-mint-500 hover:bg-mint-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">Procesando...</span>
              <span v-else>{{ editingContractId ? 'Guardar Cambios' : 'Generar Machote de Contrato' }}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
