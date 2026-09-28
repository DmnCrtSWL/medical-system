import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import AdminLayout from '../layouts/AdminLayout.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'companies',
          name: 'companies',
          component: () => import('../views/CompaniesView.vue'),
        },
        {
          path: 'doctors',
          name: 'doctors',
          component: () => import('../views/DoctorsView.vue'),
        },
        {
          path: 'contracts',
          name: 'contracts',
          component: () => import('../views/ContractsView.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'finance',
          name: 'finance',
          component: () => import('../views/FinanceView.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'analytics',
          name: 'analytics',
          component: () => import('../views/HealthAnalyticsView.vue'),
        },
      ],
    },
  ],
});

// Guard de Navegacion: Autenticacion JWT y Autorizacion por Rol (ADMIN / OPERATIVE)
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  let userRole = '';
  try {
    userRole = storedUser ? JSON.parse(storedUser).role?.toUpperCase() : '';
  } catch {
    userRole = '';
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !token) {
    next({ name: 'login' });
    return;
  }

  if (to.name === 'login' && token) {
    next({ name: 'home' });
    return;
  }

  // Restringir rutas exclusivas (como Contratos y Finanzas) si el rol no esta autorizado
  const requiredRoles = to.meta.roles as string[] | undefined;
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(userRole)) {
      next({ name: 'home' });
      return;
    }
  }

  next();
});

export default router;
