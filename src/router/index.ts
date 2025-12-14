import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import DocumentsListPage from '../pages/DocumentsListPage.vue';
import LoginPage from '../pages/LoginPage.vue';
import NomenclatureListPage from '../pages/NomenclatureListPage.vue';
import ProfilePage from '../pages/ProfilePage.vue';
import StockPage from '../pages/StockPage.vue';
import SuppliersListPage from '../pages/SuppliersListPage.vue';
import WarehousesPage from '../pages/WarehousesPage.vue';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    layout?: 'auth' | 'app';
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/nomenclature',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { layout: 'auth' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfilePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/documents',
      name: 'documents',
      component: DocumentsListPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/stock',
      name: 'stock',
      component: StockPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/nomenclature',
      name: 'nomenclature',
      component: NomenclatureListPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/suppliers',
      name: 'suppliers',
      component: SuppliersListPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/warehouses',
      name: 'warehouses',
      component: WarehousesPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (to.name === 'login') {
    await auth.ensureMeLoaded();
    if (auth.isAuthenticated) {
      const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/';
      return { path: redirect };
    }
    return true;
  }

  if (to.meta.requiresAuth) {
    await auth.ensureMeLoaded();

    if (!auth.isAuthenticated) {
      return {
        name: 'login',
        query: { redirect: typeof to.fullPath === 'string' ? to.fullPath : undefined },
      };
    }
  }

  return true;
});
