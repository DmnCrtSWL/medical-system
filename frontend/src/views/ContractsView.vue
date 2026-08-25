<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { FileText, Plus, Trash2, Pencil, ArrowLeft, AlertCircle, Building2, Calendar, DollarSign, FileDown } from 'lucide-vue-next';
import { useContractStore, type Contract } from '../stores/contracts';
import { useCompanyStore } from '../stores/companies';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';

const router = useRouter();
const contractStore = useContractStore();
const companyStore = useCompanyStore();

const showModal = ref(false);
const editingContractId = ref<string | null>(null);

const companyId = ref('');
const startDate = ref('');
const endDate = ref('');
const amount = ref<number | ''>('');
const status = ref<'ACTIVE' | 'INACTIVE' | 'EXPIRED'>('ACTIVE');
const formError = ref('');
const isSubmitting = ref(false);

onMounted(() => {
  contractStore.fetchContracts();
  companyStore.fetchCompanies();
});

const formatDateForInput = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
};

const openCreateModal = () => {
  editingContractId.value = null;
  companyId.value = companyStore.companies.length > 0 ? companyStore.companies[0].id : '';
  const today = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(today.getFullYear() + 1);

  startDate.value = today.toISOString().split('T')[0];
  endDate.value = nextYear.toISOString().split('T')[0];
  amount.value = 100000;
  status.value = 'ACTIVE';
  formError.value = '';
  showModal.value = true;
};

const openEditModal = (contract: Contract) => {
  editingContractId.value = contract.id;
  companyId.value = contract.companyId;
  startDate.value = formatDateForInput(contract.startDate);
  endDate.value = formatDateForInput(contract.endDate);
  amount.value = contract.amount ?? '';
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
    formError.value = 'Debes seleccionar una Empresa B2B Cliente.';
    return;
  }

  if (!startDate.value || !endDate.value) {
    formError.value = 'Las fechas de inicio y término de vigencia son obligatorias.';
    return;
  }

  if (new Date(startDate.value) >= new Date(endDate.value)) {
    formError.value = 'La fecha de término debe ser posterior a la fecha de inicio.';
    return;
  }

  isSubmitting.value = true;
  formError.value = '';

  try {
    const payload = {
      companyId: companyId.value,
      startDate: startDate.value,
      endDate: endDate.value,
      amount: amount.value !== '' ? Number(amount.value) : undefined,
      status: status.value,
    };

    if (editingContractId.value) {
      await contractStore.updateContract(editingContractId.value, payload);
    } else {
      await contractStore.createContract(payload);
    }
    closeModal();
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
    } catch (err) {
      alert('Error al eliminar el contrato');
    }
  }
};

const handleDownloadPdf = async (contract: Contract) => {
  try {
    await contractStore.downloadPdf(contract.id, contract.company.name);
  } catch (err) {
    alert('Error al descargar el archivo PDF del contrato.');
  }
};

const formatCurrency = (val?: number | null) => {
  if (val === undefined || val === null) return 'N/A';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};
</script>

<template>
  <div class="p-6 md:p-10">
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Top Bar / Action Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <Button variant="ghost" class="text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer" @click="router.push('/')">
            <ArrowLeft class="w-5 h-5 mr-1" />
            Volver
          </Button>
          <div>
            <h1 class="text-2xl md:text-3xl font-bold flex items-center gap-2 text-slate-800">
              <FileText class="w-8 h-8 text-mint-500" />
              Convenios & Contratos B2B
            </h1>
            <p class="text-sm text-slate-500">Gestión de convenios de servicios médicos corporativos y generación de PDF</p>
          </div>
        </div>

        <Button variant="default" class="bg-mint-500 hover:bg-mint-600 text-white font-semibold shadow-md rounded-xl cursor-pointer" @click="openCreateModal">
          <Plus class="w-5 h-5 mr-1.5" />
          Nuevo Contrato
        </Button>
      </div>

      <!-- Main Content Card -->
      <Card class="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader class="border-b border-slate-100 pb-4">
          <CardTitle class="text-xl text-slate-800">Directorio de Convenios Médicos</CardTitle>
          <CardDescription class="text-slate-500">Listado de contratos registrados con clientes corporativos y descargas de PDF</CardDescription>
        </CardHeader>

        <CardContent class="p-0">
          <!-- Loading State -->
          <div v-if="contractStore.isLoading && contractStore.contracts.length === 0" class="p-12 text-center text-slate-500">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mint-500 mb-3"></div>
            <p>Cargando lista de convenios B2B...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="contractStore.contracts.length === 0" class="p-12 text-center text-slate-500 space-y-3">
            <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-mint-500">
              <FileText class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-semibold text-slate-800">No hay contratos registrados aún</h3>
            <p class="text-sm max-w-sm mx-auto">Comienza generando el primer convenio corporativo para habilitar la descarga del PDF oficial.</p>
            <Button variant="default" class="mt-2 bg-mint-500 hover:bg-mint-600 text-white rounded-xl cursor-pointer" @click="openCreateModal">
              <Plus class="w-4 h-4 mr-1.5" />
              Generar Contrato
            </Button>
          </div>

          <!-- Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th class="px-6 py-4">Cliente B2B / Empresa</th>
                  <th class="px-6 py-4">Vigencia del Convenio</th>
                  <th class="px-6 py-4">Monto Acordado</th>
                  <th class="px-6 py-4">Estatus</th>
                  <th class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="contract in contractStore.contracts" :key="contract.id" class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-mint-100 text-mint-600 flex items-center justify-center">
                        <Building2 class="w-5 h-5" />
                      </div>
                      <div>
                        <p class="font-semibold text-slate-800">{{ contract.company.name }}</p>
                        <p v-if="contract.company.taxId" class="text-xs text-slate-500 font-mono">
                          RFC: {{ contract.company.taxId }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-xs text-slate-600">
                    <div class="flex items-center gap-1.5 font-medium">
                      <Calendar class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{{ formatDate(contract.startDate) }} - {{ formatDate(contract.endDate) }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 font-semibold text-slate-800">
                    <div class="flex items-center gap-1 text-mint-600">
                      <DollarSign class="w-4 h-4 shrink-0" />
                      <span>{{ formatCurrency(contract.amount) }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      v-if="contract.status === 'ACTIVE'"
                      class="inline-flex items-center bg-mint-50 text-mint-600 border border-mint-200 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    >
                      ACTIVO
                    </span>
                    <span
                      v-else-if="contract.status === 'EXPIRED'"
                      class="inline-flex items-center bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    >
                      EXPIRADO
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    >
                      INACTIVO
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      class="text-mint-600 hover:text-mint-700 hover:bg-mint-50 rounded-lg p-2 cursor-pointer transition-colors"
                      title="Descargar PDF del Contrato"
                      :disabled="contractStore.isDownloading"
                      @click="handleDownloadPdf(contract)"
                    >
                      <FileDown class="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      class="text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg p-2 cursor-pointer transition-colors"
                      title="Editar Contrato"
                      @click="openEditModal(contract)"
                    >
                      <Pencil class="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      class="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-2 cursor-pointer transition-colors"
                      title="Eliminar Contrato"
                      @click="handleDelete(contract.id, contract.company.name)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Modal Form (Nuevo / Editar Contrato) -->
    <div v-if="showModal" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText class="w-5 h-5 text-mint-500" />
            {{ editingContractId ? 'Editar Convenio B2B' : 'Registrar Nuevo Convenio B2B' }}
          </h2>
          <button class="text-slate-400 hover:text-slate-800 text-lg font-bold cursor-pointer" @click="closeModal">&times;</button>
        </div>

        <form class="space-y-4" @submit.prevent="handleSaveContract">
          <div v-if="formError" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle class="w-4 h-4 text-rose-500 shrink-0" />
            <span>{{ formError }}</span>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Empresa Cliente B2B <span class="text-mint-500">*</span></label>
            <select
              v-model="companyId"
              class="w-full h-11 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 cursor-pointer"
              :disabled="isSubmitting"
              required
            >
              <option value="" disabled>-- Selecciona una Empresa --</option>
              <option v-for="company in companyStore.companies" :key="company.id" :value="company.id">
                {{ company.name }} {{ company.taxId ? `(${company.taxId})` : '' }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Inicio de Vigencia <span class="text-mint-500">*</span></label>
              <Input v-model="startDate" type="date" class="bg-white border-slate-300 text-slate-800" :disabled="isSubmitting" required />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Término de Vigencia <span class="text-mint-500">*</span></label>
              <Input v-model="endDate" type="date" class="bg-white border-slate-300 text-slate-800" :disabled="isSubmitting" required />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Monto Acordado del Convenio ($ MXN)</label>
            <Input v-model="amount" type="number" step="0.01" min="0" class="bg-white border-slate-300 text-slate-800" placeholder="Ej. 150000" :disabled="isSubmitting" />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Estatus del Contrato</label>
            <select
              v-model="status"
              class="w-full h-11 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 cursor-pointer"
              :disabled="isSubmitting"
            >
              <option value="ACTIVE">ACTIVO (En Vigor)</option>
              <option value="INACTIVE">INACTIVO (Suspendido)</option>
              <option value="EXPIRED">EXPIRADO (Vencido)</option>
            </select>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" class="text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer" :disabled="isSubmitting" @click="closeModal">
              Cancelar
            </Button>
            <Button type="submit" variant="default" class="bg-mint-500 hover:bg-mint-600 text-white font-semibold rounded-xl shadow-md cursor-pointer" :disabled="isSubmitting">
              <span v-if="isSubmitting">Guardando...</span>
              <span v-else>{{ editingContractId ? 'Guardar Cambios' : 'Generar Contrato' }}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
