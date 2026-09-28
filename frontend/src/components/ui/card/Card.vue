<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '../../../lib/utils';

interface Props {
  class?: string;
}

const props = defineProps<Props>();

const classes = computed(() =>
  cn('rounded-2xl border border-border bg-card text-card-foreground transition-colors duration-300 shadow-xl transition-all duration-200', props.class)
);
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
