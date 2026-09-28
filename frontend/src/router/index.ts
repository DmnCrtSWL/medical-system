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
          path: 'analytics',
          name: 'analytics',
          component: () => import('../views/HealthAnalyticsView.vue'),
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
          path: 'patients',
          name: 'patients',
          component: () => import('../views/PatientsView.vue'),
        },
        {
          path: 'patients/:id',
          name: 'patient-profile',
          component: () => import('../views/PatientProfileView.vue'),
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/UsersView.vue'),
        },
        {
          path: 'contracts',
          name: 'contracts',
          component: () => import('../views/ContractsView.vue'),
        },
        {
          path: 'finance',
          name: 'finance',
          component: () => import('../views/FinanceView.vue'),
        },
      ],
    },
  ],
});

// Guard de Navegacion: Redirigir a /login si intenta acceder a rutas protegidas sin token JWT
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !token) {
    next({ name: 'login' });
  } else if (to.name === 'login' && token) {
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router;
