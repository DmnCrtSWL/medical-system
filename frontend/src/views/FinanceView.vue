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
  X,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-vue-next';
import {
  useFinanceStore,
  type Transaction,
  type TransactionType,
  type TransactionCategory,
  type TransactionStatus,
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
const filterStatus = ref<TransactionStatus | ''>('');
const settlingId = ref<string | null>(null);
const downloadingReceiptId = ref<string | null>(null);

// Modal de Detalle de Transacción
const showDetailModal = ref(false);
const selectedTx = ref<Transaction | null>(null);

const openDetailModal = (tx: Transaction) => {
  selectedTx.value = tx;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedTx.value = null;
};

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
  const q = (searchQuery.value || '').toLowerCase().trim();
  return financeStore.transactions.filter((tx) => {
    const matchesSearch =
      !q ||
      tx.description.toLowerCase().includes(q) ||
      (tx.company?.name && tx.company.name.toLowerCase().includes(q)) ||
      (tx.doctor?.user?.name && tx.doctor.user.name.toLowerCase().includes(q));

    const matchesType = !filterType.value || tx.type === filterType.value;
    const matchesCategory = !filterCategory.value || tx.category === filterCategory.value;
    const matchesStatus = !filterStatus.value || (tx.status || 'COMPLETED') === filterStatus.value;

    return Boolean(matchesSearch && matchesType && matchesCategory && matchesStatus);
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

// Liquidar transacción pendiente
const handleSettle = async (id: string) => {
  if (confirm('¿Confirmas que el pago bancario ha sido verificado para liquidar este movimiento y emitir el comprobante oficial?')) {
    settlingId.value = id;
    try {
      await financeStore.settleTransaction(id);
      if (selectedTx.value && selectedTx.value.id === id) {
        selectedTx.value.status = 'COMPLETED';
      }
    } finally {
      settlingId.value = null;
    }
  }
};

// Descargar recibo de pago oficial en PDF
const handleDownloadReceipt = async (id: string) => {
  downloadingReceiptId.value = id;
  try {
    await financeStore.downloadReceipt(id);
  } finally {
    downloadingReceiptId.value = null;
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
        <h2 class="text-3xl font-extrabold text-foreground transition-colors duration-300 tracking-tight flex items-center gap-3">
          <DollarSign class="w-8 h-8 text-mint-500" />
          Control de Caja & Libro Contable
        </h2>
        <p class="text-muted-foreground transition-colors duration-300 mt-1">
          Administración centralizada de ingresos B2B, honorarios de la plantilla médica y gastos operativos.
        </p>
      </div>

      <Button
        class="bg-mint-500 hover:bg-mint-600 text-foreground transition-colors duration-300 font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-mint-500/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
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
      <Card class="border-none shadow-md bg-card transition-colors duration-300 rounded-2xl">
        <CardContent class="p-6 flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp class="w-7 h-7" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Ingresos Totales</p>
            <h3 class="text-2xl font-black text-foreground transition-colors duration-300 mt-1">
              {{ formatCurrency(financeStore.summary?.totalIncome) }}
            </h3>
          </div>
        </CardContent>
      </Card>

      <!-- Honorarios Médicos -->
      <Card class="border-none shadow-md bg-card transition-colors duration-300 rounded-2xl">
        <CardContent class="p-6 flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Stethoscope class="w-7 h-7" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Honorarios Médicos</p>
            <h3 class="text-2xl font-black text-foreground transition-colors duration-300 mt-1">
              {{ formatCurrency(financeStore.summary?.totalHonoraria) }}
            </h3>
          </div>
        </CardContent>
      </Card>

      <!-- Gastos Operativos -->
      <Card class="border-none shadow-md bg-card transition-colors duration-300 rounded-2xl">
        <CardContent class="p-6 flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown class="w-7 h-7" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Gastos Operativos</p>
            <h3 class="text-2xl font-black text-foreground transition-colors duration-300 mt-1">
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
    <Card class="border border-border shadow-sm bg-card transition-colors duration-300 rounded-2xl">
      <CardContent class="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <!-- Search Input -->
        <div class="relative w-full md:w-96">
          <Search class="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por concepto, empresa o doctor..."
            class="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500/50 text-foreground transition-colors duration-300"
          />
        </div>

        <!-- Filter Selects -->
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-slate-400" />
            <select
              v-model="filterType"
              class="bg-muted dark:bg-card border border-border text-foreground text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint-500"
            >
              <option value="" class="bg-card text-foreground">Todos los Tipos</option>
              <option value="INCOME" class="bg-card text-foreground">Ingresos</option>
              <option value="HONORARIUM" class="bg-card text-foreground">Honorarios Médicos</option>
              <option value="EXPENSE" class="bg-card text-foreground">Gastos Operativos</option>
            </select>
          </div>

          <select
            v-model="filterCategory"
            class="bg-muted dark:bg-card border border-border text-foreground text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint-500"
          >
            <option value="" class="bg-card text-foreground">Todas las Categorías</option>
            <option value="B2B_CONTRACT" class="bg-card text-foreground">Contratos B2B</option>
            <option value="DOCTOR_HONORARIUM" class="bg-card text-foreground">Honorarios Médicos</option>
            <option value="CONSULTATION_FEE" class="bg-card text-foreground">Cobro de Consultas</option>
            <option value="EQUIPMENT_MAINTENANCE" class="bg-card text-foreground">Mantenimiento & Equipo</option>
            <option value="OTHER" class="bg-card text-foreground">Otros Movimientos</option>
          </select>

          <select
            v-model="filterStatus"
            class="bg-muted dark:bg-card border border-border text-foreground text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint-500"
          >
            <option value="" class="bg-card text-foreground">Todos los Estados</option>
            <option value="COMPLETED" class="bg-card text-foreground">Liquidados</option>
            <option value="PENDING" class="bg-card text-foreground">Pendientes</option>
            <option value="CANCELLED" class="bg-card text-foreground">Cancelados</option>
          </select>
        </div>
      </CardContent>
    </Card>

    <!-- Table of Transactions -->
    <Card class="border border-border shadow-sm bg-card transition-colors duration-300 rounded-2xl overflow-hidden">
      <CardHeader class="p-6 border-b border-border flex flex-row items-center justify-between">
        <div>
          <CardTitle class="text-lg font-bold text-foreground transition-colors duration-300">Historial de Movimientos Contables</CardTitle>
          <p class="text-xs text-muted-foreground transition-colors duration-300 mt-0.5">Mostrando {{ filteredTransactions.length }} registros contables</p>
        </div>
      </CardHeader>

      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-left text-sm table-fixed text-muted-foreground transition-colors duration-300">
          <thead class="bg-muted text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-border">
            <tr>
              <th class="py-3 px-3 w-[85px]">Fecha</th>
              <th class="py-3 px-3 w-[28%]">Concepto / Categoría</th>
              <th class="py-3 px-3 w-[18%]">Entidad</th>
              <th class="py-3 px-2 w-[110px] text-center">Tipo</th>
              <th class="py-3 px-2 w-[120px] text-center">Estado</th>
              <th class="py-3 px-4 w-[130px] text-right">Monto</th>
              <th class="py-3 px-2 w-[75px] text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-black text-xs sm:text-sm">
            <tr v-if="filteredTransactions.length === 0">
              <td colspan="7" class="py-12 text-center text-slate-400 text-sm">
                No hay movimientos registrados que coincidan con la búsqueda.
              </td>
            </tr>

            <tr
              v-for="tx in filteredTransactions"
              :key="tx.id"
              class="hover:bg-muted/70 transition-colors cursor-pointer group"
              title="Haz clic para ver el detalle completo del movimiento"
              @click="openDetailModal(tx)"
            >
              <!-- Fecha -->
              <td class="py-3.5 px-3 font-medium text-xs text-muted-foreground whitespace-nowrap">
                {{ formatDate(tx.date) }}
              </td>

              <!-- Concepto / Categoría (Jerarquía en 2 líneas) -->
              <td class="py-3.5 px-3 min-w-0 overflow-hidden">
                <div class="flex flex-col min-w-0">
                  <span class="font-bold text-foreground text-xs sm:text-sm truncate group-hover:text-mint-600 transition-colors">
                    {{ tx.description }}
                  </span>
                  <span class="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {{ categoryLabels[tx.category] || tx.category }}
                  </span>
                </div>
              </td>

              <!-- Entidad Asociada (Empresa o Doctor) -->
              <td class="py-3.5 px-3 min-w-0 overflow-hidden">
                <div v-if="tx.company" class="flex items-center gap-1.5 text-xs text-foreground font-semibold min-w-0" :title="tx.company.name">
                  <Building2 class="w-3.5 h-3.5 text-mint-600 shrink-0" />
                  <span class="truncate">{{ tx.company.name }}</span>
                </div>
                <div v-else-if="tx.doctor" class="flex items-center gap-1.5 text-xs text-foreground font-medium min-w-0" :title="tx.doctor.user?.name || 'Doctor'">
                  <Stethoscope class="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span class="truncate">{{ tx.doctor.user?.name || 'Doctor' }}</span>
                </div>
                <span v-else class="text-slate-400 text-xs italic">-</span>
              </td>

              <!-- Tipo (Badge) -->
              <td class="py-3.5 px-2 text-center whitespace-nowrap">
                <span
                  v-if="tx.type === 'INCOME'"
                  class="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border border-emerald-200 dark:border-emerald-800/50 inline-flex items-center gap-1"
                >
                  <TrendingUp class="w-3 h-3" /> Ingreso
                </span>
                <span
                  v-else-if="tx.type === 'HONORARIUM'"
                  class="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border border-blue-200 dark:border-blue-800/50 inline-flex items-center gap-1"
                >
                  <Stethoscope class="w-3 h-3" /> Honorario
                </span>
                <span
                  v-else
                  class="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border border-rose-200 dark:border-rose-800/50 inline-flex items-center gap-1"
                >
                  <TrendingDown class="w-3 h-3" /> Gasto
                </span>
              </td>

              <!-- Estado (Badge) -->
              <td class="py-3.5 px-2 text-center whitespace-nowrap">
                <span
                  v-if="tx.status === 'COMPLETED' || !tx.status"
                  class="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-300 dark:border-emerald-700/50 inline-flex items-center gap-1"
                >
                  <CheckCircle2 class="w-3 h-3 text-emerald-500" /> Liquidado
                </span>
                <span
                  v-else-if="tx.status === 'PENDING'"
                  class="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-amber-300 dark:border-amber-700/50 inline-flex items-center gap-1"
                >
                  <Clock class="w-3 h-3 text-amber-500 animate-pulse" /> Pendiente
                </span>
                <span
                  v-else-if="tx.status === 'CANCELLED'"
                  class="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-rose-300 dark:border-rose-700/50 inline-flex items-center gap-1"
                >
                  <XCircle class="w-3 h-3 text-rose-500" /> Cancelado
                </span>
              </td>

              <!-- Monto -->
              <td
                :class="[
                  'py-3.5 px-4 font-black text-right whitespace-nowrap text-xs sm:text-sm',
                  tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : (tx.type === 'HONORARIUM' ? 'text-blue-600' : 'text-rose-600 dark:text-rose-400')
                ]"
              >
                {{ tx.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
              </td>

              <!-- Acciones -->
              <td class="py-3.5 px-2 text-center whitespace-nowrap" @click.stop>
                <div class="flex items-center justify-center gap-1.5">
                  <!-- Liquidar (si está PENDING) -->
                  <button
                    v-if="tx.status === 'PENDING'"
                    class="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-all cursor-pointer"
                    title="Confirmar ingreso bancario y liquidar pago"
                    :disabled="settlingId === tx.id"
                    @click.stop="handleSettle(tx.id)"
                  >
                    <CheckCircle2 class="w-4 h-4" />
                  </button>

                  <!-- Descargar Recibo (si está COMPLETED o es ingreso) -->
                  <button
                    v-if="tx.status === 'COMPLETED' || (!tx.status && tx.type === 'INCOME')"
                    class="p-1.5 text-mint-600 hover:text-mint-700 hover:bg-mint-500/15 dark:hover:bg-mint-950/40 rounded-lg transition-all cursor-pointer"
                    title="Descargar comprobante/recibo oficial en PDF"
                    :disabled="downloadingReceiptId === tx.id"
                    @click.stop="handleDownloadReceipt(tx.id)"
                  >
                    <FileText class="w-4 h-4" />
                  </button>

                  <!-- Eliminar -->
                  <button
                    class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                    title="Eliminar movimiento"
                    @click.stop="handleDelete(tx.id, tx.description)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>

    <!-- Modal Detalle Completo del Movimiento -->
    <div
      v-if="showDetailModal && selectedTx"
      class="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      @click.self="closeDetailModal"
    >
      <div class="bg-card transition-colors duration-300 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-border space-y-6 animate-in fade-in zoom-in duration-200">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-border pb-4">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-mint-500/10 text-mint-600 flex items-center justify-center">
              <DollarSign class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-foreground">Detalle del Movimiento</h3>
              <p class="text-xs text-muted-foreground">Ficha contable y comprobante de liquidación</p>
            </div>
          </div>
          <button
            class="text-slate-400 hover:text-foreground transition-colors p-1.5 rounded-xl hover:bg-muted"
            @click="closeDetailModal"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Hero Card (Monto + Estado) -->
        <div class="bg-muted/50 dark:bg-muted/20 border border-border rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span class="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Monto del Movimiento</span>
            <h2
              :class="[
                'text-3xl font-black mt-1',
                selectedTx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              ]"
            >
              {{ selectedTx.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(selectedTx.amount) }}
            </h2>
          </div>
          <div class="text-right flex flex-col items-end gap-1.5">
            <span
              v-if="selectedTx.status === 'COMPLETED' || !selectedTx.status"
              class="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-300 dark:border-emerald-700/50 inline-flex items-center gap-1.5"
            >
              <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" /> Liquidado
            </span>
            <span
              v-else-if="selectedTx.status === 'PENDING'"
              class="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-300 dark:border-amber-700/50 inline-flex items-center gap-1.5"
            >
              <Clock class="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Pendiente
            </span>
            <span
              v-else-if="selectedTx.status === 'CANCELLED'"
              class="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 px-3 py-1 rounded-full text-xs font-bold border border-rose-300 dark:border-rose-700/50 inline-flex items-center gap-1.5"
            >
              <XCircle class="w-3.5 h-3.5 text-rose-500" /> Cancelado
            </span>
            <span class="text-xs text-muted-foreground">{{ formatDate(selectedTx.date) }}</span>
          </div>
        </div>

        <!-- Información Contable -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Información Contable</h4>
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="bg-card border border-border p-3.5 rounded-xl col-span-2 space-y-1">
              <span class="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">Concepto</span>
              <p class="font-bold text-foreground text-sm leading-snug">{{ selectedTx.description }}</p>
            </div>

            <div class="bg-card border border-border p-3 rounded-xl">
              <span class="text-muted-foreground text-[11px] block font-semibold uppercase tracking-wider">Categoría</span>
              <span class="font-bold text-foreground text-xs mt-0.5 block">{{ categoryLabels[selectedTx.category] || selectedTx.category }}</span>
            </div>

            <div class="bg-card border border-border p-3 rounded-xl">
              <span class="text-muted-foreground text-[11px] block font-semibold uppercase tracking-wider">Tipo de Movimiento</span>
              <span class="font-bold text-foreground text-xs mt-0.5 block">
                {{ selectedTx.type === 'INCOME' ? 'Ingreso' : (selectedTx.type === 'HONORARIUM' ? 'Honorarios Médicos' : 'Gasto Operativo') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Entidad Asociada (Empresa o Doctor) -->
        <div v-if="selectedTx.company || selectedTx.doctor" class="space-y-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">
            {{ selectedTx.company ? 'Empresa Asociada' : 'Médico Asociado' }}
          </h4>
          <div v-if="selectedTx.company" class="bg-card border border-border p-4 rounded-xl space-y-2 text-xs">
            <div class="flex items-center gap-2">
              <Building2 class="w-4 h-4 text-mint-600 shrink-0" />
              <span class="font-bold text-foreground text-sm">{{ selectedTx.company.name }}</span>
            </div>
            <p v-if="selectedTx.company.taxId" class="text-muted-foreground">
              RFC Fiscal: <span class="font-mono text-foreground font-semibold">{{ selectedTx.company.taxId }}</span>
            </p>
          </div>
          <div v-else-if="selectedTx.doctor" class="bg-card border border-border p-4 rounded-xl space-y-2 text-xs">
            <div class="flex items-center gap-2">
              <Stethoscope class="w-4 h-4 text-blue-500 shrink-0" />
              <span class="font-bold text-foreground text-sm">{{ selectedTx.doctor.user?.name || 'Médico de Planta' }}</span>
            </div>
            <p v-if="selectedTx.doctor.specialty" class="text-muted-foreground">
              Especialidad: <span class="text-foreground font-semibold">{{ selectedTx.doctor.specialty }}</span>
            </p>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex items-center justify-between pt-4 border-t border-border">
          <button
            class="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            @click="handleDelete(selectedTx.id, selectedTx.description); closeDetailModal();"
          >
            <Trash2 class="w-4 h-4" />
            Eliminar
          </button>

          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              class="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
              @click="closeDetailModal"
            >
              Cerrar
            </Button>

            <!-- Botón Liquidar (si está PENDING) -->
            <button
              v-if="selectedTx.status === 'PENDING'"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              :disabled="settlingId === selectedTx.id"
              @click="handleSettle(selectedTx.id)"
            >
              <CheckCircle2 class="w-4 h-4" />
              {{ settlingId === selectedTx.id ? 'Liquidando...' : 'Confirmar Liquidación' }}
            </button>

            <!-- Botón Descargar Recibo (si está COMPLETED o es ingreso) -->
            <button
              v-if="selectedTx.status === 'COMPLETED' || (!selectedTx.status && selectedTx.type === 'INCOME')"
              class="px-4 py-2 bg-mint-500 hover:bg-mint-600 text-navy-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-mint-500/20 flex items-center gap-1.5 cursor-pointer"
              :disabled="downloadingReceiptId === selectedTx.id"
              @click="handleDownloadReceipt(selectedTx.id)"
            >
              <FileText class="w-4 h-4" />
              {{ downloadingReceiptId === selectedTx.id ? 'Descargando...' : 'Descargar Recibo (PDF)' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Crear Movimiento Contable -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-card transition-colors duration-300 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-border space-y-6 animate-in fade-in zoom-in duration-200">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-border pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-mint-100 text-mint-600 flex items-center justify-center">
              <PlusCircle class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-xl font-extrabold text-foreground transition-colors duration-300">Registrar Movimiento Contable</h3>
              <p class="text-xs text-muted-foreground transition-colors duration-300">Ingresa la información financiera de la transacción.</p>
            </div>
          </div>
          <button class="p-2 text-slate-400 hover:text-muted-foreground transition-colors duration-300 rounded-xl cursor-pointer" @click="showModal = false">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Form Body -->
        <form class="space-y-4" @submit.prevent="handleCreateTransaction">
          <!-- Concepto -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors duration-300 mb-1.5">Concepto / Descripción *</label>
            <input
              v-model="form.description"
              type="text"
              required
              placeholder="Ej. Pago Convenio Anual B2B TechCorp"
              class="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 text-foreground transition-colors duration-300 font-medium"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Monto -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors duration-300 mb-1.5">Monto ($ MXN) *</label>
              <input
                v-model.number="form.amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="150000"
                class="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 text-foreground transition-colors duration-300 font-bold"
              />
            </div>

            <!-- Fecha -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors duration-300 mb-1.5">Fecha *</label>
              <input
                v-model="form.date"
                type="date"
                required
                class="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 text-foreground transition-colors duration-300"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Tipo de Movimiento -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors duration-300 mb-1.5">Tipo de Movimiento *</label>
              <select
                v-model="form.type"
                class="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 text-foreground transition-colors duration-300 font-semibold"
              >
                <option value="INCOME">🟢 Ingreso</option>
                <option value="HONORARIUM">🔵 Honorario Médico</option>
                <option value="EXPENSE">🔴 Gasto Operativo</option>
              </select>
            </div>

            <!-- Categoría -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors duration-300 mb-1.5">Categoría *</label>
              <select
                v-model="form.category"
                class="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 text-foreground transition-colors duration-300"
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
            <label class="block text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors duration-300 mb-1.5">Empresa Cliente B2B (Opcional)</label>
            <select
              v-model="form.companyId"
              class="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 text-foreground transition-colors duration-300"
            >
              <option value="">Ninguna empresa asociada</option>
              <option v-for="c in companiesStore.companies" :key="c.id" :value="c.id">
                {{ c.name }} (RFC: {{ c.taxId || 'N/A' }})
              </option>
            </select>
          </div>

          <!-- Doctor Opcional -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors duration-300 mb-1.5">Doctor In-House (Opcional)</label>
            <select
              v-model="form.doctorId"
              class="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 text-foreground transition-colors duration-300"
            >
              <option value="">Ningún doctor asociado</option>
              <option v-for="d in doctorsStore.doctors" :key="d.id" :value="d.id">
                {{ d.user?.name || 'Doctor' }} - {{ d.specialty }}
              </option>
            </select>
          </div>

          <!-- Modal Actions -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              class="border-border text-muted-foreground transition-colors duration-300 rounded-xl cursor-pointer"
              @click="showModal = false"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              class="bg-mint-500 hover:bg-mint-600 text-foreground transition-colors duration-300 font-bold px-5 rounded-xl shadow-md cursor-pointer"
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
