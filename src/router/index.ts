import { createRouter, createWebHistory } from "vue-router";
import DashboardPage from "../pages/DashboardPage.vue";
import DocumentDetailPage from "../pages/DocumentDetailPage.vue";
import DocumentEditPage from "../pages/DocumentEditPage.vue";
import DocumentsListPage from "../pages/DocumentsListPage.vue";
import ItemDetailPage from "../pages/ItemDetailPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import NomenclatureListPage from "../pages/NomenclatureListPage.vue";
import ProfilePage from "../pages/ProfilePage.vue";
import ReportsPage from "../pages/ReportsPage.vue";
import StockPage from "../pages/StockPage.vue";
import SupplierDetailPage from "../pages/SupplierDetailPage.vue";
import SuppliersListPage from "../pages/SuppliersListPage.vue";
import WarehouseDetailPage from "../pages/WarehouseDetailPage.vue";
import WarehousesPage from "../pages/WarehousesPage.vue";
import { useAuthStore } from "../stores/auth";

declare module "vue-router" {
	interface RouteMeta {
		requiresAuth?: boolean;
		layout?: "auth" | "app";
	}
}

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: "/",
			name: "dashboard",
			component: DashboardPage,
			meta: { requiresAuth: true },
		},
		{
			path: "/login",
			name: "login",
			component: LoginPage,
			meta: { layout: "auth" },
		},
		{
			path: "/profile",
			name: "profile",
			component: ProfilePage,
			meta: { requiresAuth: true },
		},
		{
			path: "/documents",
			name: "documents",
			component: DocumentsListPage,
			meta: { requiresAuth: true },
		},
		{
			path: "/documents/new",
			name: "document-create",
			component: DocumentEditPage,
			meta: { requiresAuth: true },
		},
		{
			path: "/documents/:id",
			name: "document-detail",
			component: DocumentDetailPage,
			meta: { requiresAuth: true },
		},
		{
			path: "/documents/:id/edit",
			name: "document-edit",
			component: DocumentEditPage,
			meta: { requiresAuth: true },
		},
		{
			path: "/stock",
			name: "stock",
			component: StockPage,
			meta: { requiresAuth: true },
		},
		{
			path: "/items/:id",
			name: "item-detail",
			component: ItemDetailPage,
			meta: { requiresAuth: true },
		},
		{
			path: "/nomenclature",
			name: "nomenclature",
			component: NomenclatureListPage,
			meta: { requiresAuth: true },
		},
		{
			path: "/suppliers",
			name: "suppliers",
			component: SuppliersListPage,
			meta: { requiresAuth: true },
		},
		{
			path: "/suppliers/:id",
			name: "supplier-detail",
			component: SupplierDetailPage,
			meta: { requiresAuth: true },
		},
		{
			path: "/warehouses",
			name: "warehouses",
			component: WarehousesPage,
			meta: { requiresAuth: true },
		},
		{
			path: "/warehouses/:id",
			name: "warehouse-detail",
			component: WarehouseDetailPage,
			meta: { requiresAuth: true },
		},
		{
			path: "/reports",
			name: "reports",
			component: ReportsPage,
			meta: { requiresAuth: true },
		},
		{
			path: "/:pathMatch(.*)*",
			redirect: "/",
		},
	],
});

router.beforeEach(async (to) => {
	const auth = useAuthStore();

	if (to.name === "login") {
		await auth.ensureMeLoaded();
		if (auth.isAuthenticated) {
			const redirect =
				typeof to.query.redirect === "string" ? to.query.redirect : "/";
			return { path: redirect };
		}
		return true;
	}

	if (to.meta.requiresAuth) {
		await auth.ensureMeLoaded();

		if (!auth.isAuthenticated) {
			return {
				name: "login",
				query: {
					redirect: typeof to.fullPath === "string" ? to.fullPath : undefined,
				},
			};
		}
	}

	return true;
});
