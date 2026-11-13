<script setup lang="ts">
import { Stethoscope } from 'lucide-vue-next';
defineProps<{ dark?: boolean }>();
</script>

<template>
  <RouterLink to="/" class="flex items-center gap-2.5">
    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-500 text-white shadow-sm">
      <Stethoscope class="h-5 w-5" />
    </span>
    <span class="text-lg font-extrabold tracking-tight" :class="dark ? 'text-white' : 'text-navy-800'">
      MedSys<span class="text-mint-500">.</span>
    </span>
  </RouterLink>
</template>
