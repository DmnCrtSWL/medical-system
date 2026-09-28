<script setup lang="ts">
import Sidebar from '../components/layout/Sidebar.vue';
import Header from '../components/layout/Header.vue';
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex h-screen overflow-hidden font-sans">
    <!-- Sidebar (Left) -->
    <Sidebar class="hidden md:flex" />

    <!-- Main Wrapper (Right) -->
    <div class="flex-1 flex flex-col h-screen overflow-hidden bg-background text-foreground">
      <!-- Top Header -->
      <Header />

      <!-- Scrollable Content Area -->
      <main class="flex-1 p-6 md:p-8 overflow-y-auto relative">
        <!-- Floating shapes for aesthetics (Breathing room) -->
        <div class="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-slate-100 to-transparent pointer-events-none -z-10"></div>
        
        <!-- Max width container for consistent spacing -->
        <div class="max-w-7xl mx-auto w-full h-full">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
