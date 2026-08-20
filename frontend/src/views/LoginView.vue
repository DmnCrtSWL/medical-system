<template>
  <div class="min-h-screen bg-navy-900 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-slate-800">
      <div class="text-center mb-8">
        <span class="inline-block p-3 rounded-2xl bg-mint-100 text-mint-600 mb-3">
          🏥
        </span>
        <h2 class="text-2xl font-bold text-navy-900">Iniciar Sesión</h2>
        <p class="text-slate-500 text-sm mt-1">Accede con tus credenciales corporativas</p>
      </div>

      <form class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
          <input
            type="email"
            placeholder="doctor@ejemplo.com"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          type="button"
          class="w-full py-3 px-4 bg-mint-500 hover:bg-mint-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-mint-500/25 transition-all duration-200 mt-2"
        >
          Entrar al Sistema
        </button>
      </form>
    </div>
  </div>
</template>
