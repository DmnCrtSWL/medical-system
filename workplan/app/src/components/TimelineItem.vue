<script setup>
import { ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const props = defineProps({
  index: Number,
  align: {
    type: String,
    default: 'left' // 'left' or 'right'
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
    <div class="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-[#34D399] border-4 border-[#0A2540] z-20 shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>

    <!-- Content Card -->
    <div class="w-full md:w-5/12 z-10 px-4 md:px-0 relative">
      <div 
        class="bg-[#0f2e4d] border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl hover:border-[#34D399]/40 transition-all duration-300 relative group overflow-hidden"
      >
        <div class="absolute top-0 right-0 w-32 h-32 bg-[#34D399] rounded-full mix-blend-screen filter blur-[60px] opacity-10 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"></div>
        <slot></slot>
      </div>
    </div>

    <!-- Empty Space for the other side -->
    <div class="hidden md:block md:w-5/12"></div>
  </div>
</template>
