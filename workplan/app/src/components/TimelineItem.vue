<script setup>
import { ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { Lock } from 'lucide-vue-next'

const props = defineProps({
  index: Number,
  align: {
    type: String,
    default: 'left' // 'left' or 'right'
  },
  progress: {
    type: Number,
    default: 0
  }
})

const target = ref(null)
const isVisible = ref(false)

useIntersectionObserver(
  target,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      isVisible.value = true
    }
  },
  { threshold: 0.2 }
)
</script>

<template>
  <div 
    ref="target" 
    class="relative flex flex-col md:flex-row items-center justify-between mb-24 w-full transition-all duration-1000 ease-out"
    :class="[
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16',
      align === 'right' ? 'md:flex-row-reverse' : ''
    ]"
  >
    <!-- Dot on timeline (Visible only on md+) -->
    <div 
      class="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full border-4 border-[#0A2540] z-20 items-center justify-center transition-colors duration-500"
      :class="[
        progress > 0 
          ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-pulse' 
          : 'bg-slate-600 shadow-[0_0_10px_rgba(71,85,105,0.3)]'
      ]"
    >
      <Lock v-if="progress === 0" class="w-3 h-3 text-slate-400" />
    </div>

    <!-- Content Card -->
    <div class="w-full md:w-5/12 z-10 px-4 md:px-0 relative">
      <div 
        class="bg-[#0f2e4d] border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl transition-all duration-300 relative group overflow-hidden"
        :class="[
          progress === 0 
            ? 'opacity-60 grayscale-[50%] border-slate-700/50' 
            : 'hover:shadow-2xl hover:border-yellow-500/40 border-yellow-500/20'
        ]"
      >
        <div 
          class="absolute top-0 right-0 w-32 h-32 rounded-full mix-blend-screen filter blur-[60px] opacity-10 pointer-events-none transition-opacity duration-700"
          :class="progress > 0 ? 'bg-yellow-500 group-hover:opacity-30' : 'bg-slate-500'"
        ></div>
        
        <!-- Header Injected via Slot but we can add progress wrapper or change the slot content in App.vue -->
        <slot></slot>
      </div>
    </div>

    <!-- Empty Space for the other side -->
    <div class="hidden md:block md:w-5/12"></div>
  </div>
</template>
