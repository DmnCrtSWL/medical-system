<template>
  <div v-if="loading" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center">
    <div class="w-10 h-10 border-4 border-mint-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading?: boolean;
}>();
</script>
