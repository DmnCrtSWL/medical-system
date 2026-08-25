<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Stethoscope,
  Building2,
  PlusCircle,
  Trash2,
  Filter,
  Search,
  Calendar,
  X,
  FileText,
} from 'lucide-vue-next';
import {
  useFinanceStore,
  type TransactionType,
  type TransactionCategory,
  type CreateTransactionPayload,
} from '../stores/finance';
import { useCompanyStore } from '../stores/companies';
import { useDoctorStore } from '../stores/doctors';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button.vue';

const financeStore = useFinanceStore();
const companiesStore = useCompanyStore();
const doctorsStore = useDoctorStore();

// Estados reactivos locales
const showModal = ref(false);
const searchQuery = ref('');
const filterType = ref<TransactionType | ''>('');
const filterCategory = ref<TransactionCategory | ''>('');

// Formulario de nueva transacción
const form = ref<CreateTransactionPayload>({
  description: '',
  amount: 0,
  type: 'INCOME',
  category: 'B2B_CONTRACT',
  companyId: '',
  doctorId: '',
  date: new Date().toISOString().split('T')[0],
});

onMounted(async () => {
  await Promise.all([
    financeStore.fetchSummary(),
    financeStore.fetchTransactions(),
    companiesStore.fetchCompanies(),
    doctorsStore.fetchDoctors(),
  ]);
});

// Formateador de moneda MXN
const formatCurrency = (val: number | undefined): string => {
  if (val === undefined || isNaN(val)) return '$0.00 MXN';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(val);
};

// Formateador de fecha
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Filtrar transacciones en cliente
const filteredTransactions = computed(() => {
  return financeStore.transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (tx.company?.name && tx.company.name.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (tx.doctor?.user?.name && tx.doctor.user.name.toLowerCase().includes(searchQuery.value.toLowerCase()));

    const matchesType = !filterType.value || tx.type === filterType.value;
    const matchesCategory = !filterCategory.value || tx.category === filterCategory.value;

    return matchesSearch && matchesType && matchesCategory;
  });
});

// Resetear y abrir modal
const openCreateModal = () => {
  form.value = {
    description: '',
    amount: 0,
    type: 'INCOME',
    category: 'B2B_CONTRACT',
    companyId: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
  };
  showModal.value = true;
};

// Guardar nueva transacción
const handleCreateTransaction = async () => {
  if (!form.value.description.trim() || form.value.amount <= 0) {
    alert('Por favor completa la descripción y un monto mayor a $0');
    return;
  }

  const success = await financeStore.createTransaction({
    description: form.value.description,
    amount: Number(form.value.amount),
    type: form.value.type,
    category: form.value.category,
    companyId: form.value.companyId || null,
    doctorId: form.value.doctorId || null,
    date: form.value.date ? new Date(form.value.date).toISOString() : new Date().toISOString(),
  });

  if (success) {
    showModal.value = false;
  }
};

// Eliminar transacción
const handleDelete = async (id: string, description: string) => {
  if (confirm(`¿Estás seguro de eliminar la transacción "${description}"?`)) {
    await financeStore.deleteTransaction(id);
  }
};

// Mapeo legible de categorías
const categoryLabels: Record<TransactionCategory, string> = {
  B2B_CONTRACT: 'Contrato B2B',
  DOCTOR_HONORARIUM: 'Honorarios Médicos',
  CONSULTATION_FEE: 'Cobro de Consulta',
  EQUIPMENT_MAINTENANCE: 'Mantenimiento & Equipo',
  OTHER: 'Otro Movimiento',
};
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <DollarSign class="w-8 h-8 text-mint-500" />
          Control de Caja & Libro Contable
        </h2>
        <p class="text-slate-500 mt-1">
          Administración centralizada de ingresos B2B, honorarios de la plantilla médica y gastos operativos.
        </p>
      </div>

      <Button
        class="bg-mint-500 hover:bg-mint-600 text-navy-900 font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-mint-500/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
        @click="openCreateModal"
      >
        <PlusCircle class="w-5 h-5" />
        Nuevo Movimiento
      </Button>
    </header>

    <!-- Error Alert -->
    <div v-if="financeStore.error" class="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm font-medium">
      {{ financeStore.error }}
    </div>

    <!-- Stats Grid (4 Tarjetas de Métricas) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- Ingresos Totales -->
      <Card class="border-none shadow-md bg-white rounded-2xl">
        <CardContent class="p-6 flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp class="w-7 h-7" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Ingresos Totales</p>
            <h3 class="text-2xl font-black text-slate-800 mt-1">
              {{ formatCurrency(financeStore.summary?.totalIncome) }}
            </h3>
          </div>
        </CardContent>
      </Card>

      <!-- Honorarios Médicos -->
      <Card class="border-none shadow-md bg-white rounded-2xl">
        <CardContent class="p-6 flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Stethoscope class="w-7 h-7" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Honorarios Médicos</p>
            <h3 class="text-2xl font-black text-slate-800 mt-1">
              {{ formatCurrency(financeStore.summary?.totalHonoraria) }}
            </h3>
          </div>
        </CardContent>
      </Card>

      <!-- Gastos Operativos -->
      <Card class="border-none shadow-md bg-white rounded-2xl">
        <CardContent class="p-6 flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown class="w-7 h-7" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Gastos Operativos</p>
            <h3 class="text-2xl font-black text-slate-800 mt-1">
              {{ formatCurrency(financeStore.summary?.totalExpenses) }}
            </h3>
          </div>
        </CardContent>
      </Card>

      <!-- Balance Neto -->
      <Card class="border-none shadow-md bg-gradient-to-br from-navy-900 to-navy-800 text-white rounded-2xl relative overflow-hidden">
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-mint-500/10 rounded-full blur-2xl"></div>
        <CardContent class="p-6 flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-mint-500/20 text-mint-400 flex items-center justify-center shrink-0 border border-mint-500/30">
            <DollarSign class="w-7 h-7" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-300">Balance Neto</p>
            <h3 class="text-2xl font-black text-mint-400 mt-1">
              {{ formatCurrency(financeStore.summary?.netBalance) }}
            </h3>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters & Search Bar -->
    <Card class="border border-slate-200 shadow-sm bg-white rounded-2xl">
      <CardContent class="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <!-- Search Input -->
        <div class="relative w-full md:w-96">
          <Search class="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por concepto, empresa o doctor..."
            class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500/50 text-slate-800"
          />
        </div>

        <!-- Filter Selects -->
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-slate-400" />
            <select
              v-model="filterType"
              class="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint-500"
            >
              <option value="">Todos los Tipos</option>
              <option value="INCOME">Ingresos</option>
              <option value="HONORARIUM">Honorarios Médicos</option>
              <option value="EXPENSE">Gastos Operativos</option>
            </select>
          </div>

          <select
            v-model="filterCategory"
            class="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint-500"
          >
            <option value="">Todas las Categorías</option>
            <option value="B2B_CONTRACT">Contratos B2B</option>
            <option value="DOCTOR_HONORARIUM">Honorarios Médicos</option>
            <option value="CONSULTATION_FEE">Cobro de Consultas</option>
            <option value="EQUIPMENT_MAINTENANCE">Mantenimiento & Equipo</option>
            <option value="OTHER">Otros Movimientos</option>
          </select>
        </div>
      </CardContent>
    </Card>

    <!-- Table of Transactions -->
    <Card class="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardHeader class="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle class="text-lg font-bold text-slate-800">Historial de Movimientos Contables</CardTitle>
          <p class="text-xs text-slate-500 mt-0.5">Mostrando {{ filteredTransactions.length }} registros contables</p>
        </div>
      </CardHeader>

      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
            <tr>
              <th class="py-3.5 px-6">Fecha</th>
              <th class="py-3.5 px-6">Concepto</th>
              <th class="py-3.5 px-6">Categoría</th>
              <th class="py-3.5 px-6">Entidad Asociada</th>
              <th class="py-3.5 px-6">Tipo</th>
              <th class="py-3.5 px-6 text-right">Monto ($ MXN)</th>
              <th class="py-3.5 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredTransactions.length === 0">
              <td colspan="7" class="py-12 text-center text-slate-400">
                No hay movimientos registrados que coincidan con la búsqueda.
              </td>
            </tr>

            <tr v-for="tx in filteredTransactions" :key="tx.id" class="hover:bg-slate-50/80 transition-colors">
              <!-- Fecha -->
              <td class="py-4 px-6 font-medium text-slate-500 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <Calendar class="w-4 h-4 text-slate-400" />
                  {{ formatDate(tx.date) }}
                </div>
              </td>

              <!-- Concepto -->
              <td class="py-4 px-6 font-bold text-slate-800">
                {{ tx.description }}
              </td>

              <!-- Categoría -->
              <td class="py-4 px-6 whitespace-nowrap">
                <span class="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                  {{ categoryLabels[tx.category] || tx.category }}
                </span>
              </td>

              <!-- Entidad Asociada (Empresa o Doctor) -->
              <td class="py-4 px-6 whitespace-nowrap">
                <div v-if="tx.company" class="flex items-center gap-1.5 text-xs text-navy-800 font-semibold">
                  <Building2 class="w-3.5 h-3.5 text-mint-600 shrink-0" />
                  {{ tx.company.name }}
                </div>
                <div v-else-if="tx.doctor" class="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                  <Stethoscope class="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  {{ tx.doctor.user?.name || 'Doctor' }}
                </div>
                <span v-else class="text-slate-400 text-xs italic">-</span>
              </td>

              <!-- Tipo (Badge) -->
              <td class="py-4 px-6 whitespace-nowrap">
                <span
                  v-if="tx.type === 'INCOME'"
                  class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-200 inline-flex items-center gap-1"
                >
                  <TrendingUp class="w-3 h-3" /> Ingreso
                </span>
                <span
                  v-else-if="tx.type === 'HONORARIUM'"
                  class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-extrabold border border-blue-200 inline-flex items-center gap-1"
                >
                  <Stethoscope class="w-3 h-3" /> Honorario
                </span>
                <span
                  v-else
                  class="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-extrabold border border-rose-200 inline-flex items-center gap-1"
                >
                  <TrendingDown class="w-3 h-3" /> Gasto
                </span>
              </td>

              <!-- Monto -->
              <td
                :class="[
                  'py-4 px-6 font-black text-right whitespace-nowrap text-base',
                  tx.type === 'INCOME' ? 'text-emerald-600' : (tx.type === 'HONORARIUM' ? 'text-blue-600' : 'text-rose-600')
                ]"
              >
                {{ tx.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
              </td>

              <!-- Acciones -->
              <td class="py-4 px-6 text-center whitespace-nowrap">
                <button
                  class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                  title="Eliminar movimiento"
                  @click="handleDelete(tx.id, tx.description)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>

    <!-- Modal Crear Movimiento Contable -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in duration-200">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-mint-100 text-mint-600 flex items-center justify-center">
              <PlusCircle class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-xl font-extrabold text-slate-800">Registrar Movimiento Contable</h3>
              <p class="text-xs text-slate-500">Ingresa la información financiera de la transacción.</p>
            </div>
          </div>
          <button class="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer" @click="showModal = false">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Form Body -->
        <form class="space-y-4" @submit.prevent="handleCreateTransaction">
          <!-- Concepto -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Concepto / Descripción *</label>
            <input
              v-model="form.description"
              type="text"
              required
              placeholder="Ej. Pago Convenio Anual B2B TechCorp"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 text-slate-800 font-medium"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Monto -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Monto ($ MXN) *</label>
              <input
                v-model.number="form.amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="150000"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 text-slate-800 font-bold"
              />
            </div>

            <!-- Fecha -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Fecha *</label>
              <input
                v-model="form.date"
                type="date"
                required
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 text-slate-800"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Tipo de Movimiento -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Tipo de Movimiento *</label>
              <select
                v-model="form.type"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 text-slate-800 font-semibold"
              >
                <option value="INCOME">🟢 Ingreso</option>
                <option value="HONORARIUM">🔵 Honorario Médico</option>
                <option value="EXPENSE">🔴 Gasto Operativo</option>
              </select>
            </div>

            <!-- Categoría -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Categoría *</label>
              <select
                v-model="form.category"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 text-slate-800"
              >
                <option value="B2B_CONTRACT">Contrato B2B</option>
                <option value="DOCTOR_HONORARIUM">Honorarios Médicos</option>
                <option value="CONSULTATION_FEE">Cobro de Consulta</option>
                <option value="EQUIPMENT_MAINTENANCE">Mantenimiento & Equipo</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>

          <!-- Empresa B2B Opcional -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Empresa Cliente B2B (Opcional)</label>
            <select
              v-model="form.companyId"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 text-slate-800"
            >
              <option value="">Ninguna empresa asociada</option>
              <option v-for="c in companiesStore.companies" :key="c.id" :value="c.id">
                {{ c.name }} (RFC: {{ c.taxId || 'N/A' }})
              </option>
            </select>
          </div>

          <!-- Doctor Opcional -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Doctor In-House (Opcional)</label>
            <select
              v-model="form.doctorId"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 text-slate-800"
            >
              <option value="">Ningún doctor asociado</option>
              <option v-for="d in doctorsStore.doctors" :key="d.id" :value="d.id">
                {{ d.user?.name || 'Doctor' }} - {{ d.specialty }}
              </option>
            </select>
          </div>

          <!-- Modal Actions -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              class="border-slate-200 text-slate-600 rounded-xl cursor-pointer"
              @click="showModal = false"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              class="bg-mint-500 hover:bg-mint-600 text-navy-900 font-bold px-5 rounded-xl shadow-md cursor-pointer"
              :disabled="financeStore.loading"
            >
              {{ financeStore.loading ? 'Guardando...' : 'Guardar Transacción' }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
