<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import ModalForm from "../components/ModalForm.vue";
import FormField from "../components/FormField.vue";
import { useAuthStore } from "../stores/auth";
import { getPermissions } from "../shared/auth/permissions";

const route = useRoute();
const router = useRouter();
const supplierId = route.params.id as string;

const supplier = ref<any>(null);
const loading = ref(true);
const showEdit = ref(false);
const saving = ref(false);
const formModel = ref<any>({});

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

onMounted(async () => {
	// Mock data assigned synchronously (no artificial delay)
	supplier.value = {
		id: supplierId,
		name: 'ООО "Поставщик"',
		inn: "7700000000",
		contactPerson: "Иванов Иван Иванович",
		phone: "+7 (999) 000-00-00",
		email: "info@supplier.com",
		address: "г. Москва, ул. Пушкина, д. 10",
		documents: [
			{
				id: 1,
				number: "ПР-0001",
				date: "2025-12-13",
				amount: 50000,
				status: "completed",
			},
			{
				id: 3,
				number: "ПР-0003",
				date: "2025-12-11",
				amount: 12000,
				status: "completed",
			},
		],
	};
	loading.value = false;
});

const goBack = () => router.back();

function openEdit() {
	formModel.value = {
		name: supplier.value.name,
		inn: supplier.value.inn,
		contactPerson: supplier.value.contactPerson,
		phone: supplier.value.phone,
		email: supplier.value.email,
		address: supplier.value.address,
	};
	showEdit.value = true;
}

async function submitEdit() {
	saving.value = true;
	try {
		// minimal validation
		if (!formModel.value.name || !formModel.value.inn) {
			throw new Error("Имя и ИНН обязательны");
		}

		// apply locally (frontend-only)
		supplier.value = {
			...supplier.value,
			name: String(formModel.value.name),
			inn: String(formModel.value.inn),
			contactPerson: String(formModel.value.contactPerson || ""),
			phone: String(formModel.value.phone || ""),
			email: String(formModel.value.email || ""),
			address: String(formModel.value.address || ""),
		};

		showEdit.value = false;
	} catch (e: any) {
		// for now, show a browser alert — simple UX for mock
		alert(e?.message || "Не удалось сохранить");
	} finally {
		saving.value = false;
	}
}
</script>

<template>
	<div>
		<div class="pageHeader">
			<div class="headerLeft">
				<button @click="goBack" class="backBtn">← Назад</button>
				<h1>{{ supplier?.name || "Поставщик" }}</h1>
			</div>
			<div class="actions">
				<button v-if="permissions.canEditNomenclature" class="btn" type="button"
					@click="openEdit">Редактировать</button>
			</div>
		</div>

		<div v-if="loading" class="loading">Загрузка...</div>

		<div v-else-if="supplier" class="content">
			<div class="card infoCard">
				<h3>Контактная информация</h3>
				<div class="infoGrid">
					<div class="infoItem">
						<span class="label">ИНН:</span>
						<span class="value">{{ supplier.inn }}</span>
					</div>
					<div class="infoItem">
						<span class="label">Контактное лицо:</span>
						<span class="value">{{ supplier.contactPerson }}</span>
					</div>
					<div class="infoItem">
						<span class="label">Телефон:</span>
						<span class="value">{{ supplier.phone }}</span>
					</div>
					<div class="infoItem">
						<span class="label">Email:</span>
						<span class="value">{{ supplier.email }}</span>
					</div>
					<div class="infoItem fullWidth">
						<span class="label">Адрес:</span>
						<span class="value">{{ supplier.address }}</span>
					</div>
				</div>
			</div>

			<div class="card">
				<h3>История поставок</h3>
				<table class="table">
					<thead>
						<tr>
							<th>Номер документа</th>
							<th>Дата</th>
							<th>Сумма</th>
							<th>Статус</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="doc in supplier.documents" :key="doc.id">
							<td>
								<router-link :to="`/documents/${doc.id}`" class="link">{{ doc.number }}</router-link>
							</td>
							<td>{{ doc.date }}</td>
							<td>{{ doc.amount.toLocaleString() }} ₽</td>
							<td>{{ doc.status }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<ModalForm v-model="showEdit" title="Редактировать поставщика">
			<div>
				<FormField label="Название" v-model="formModel.name" placeholder="ООО Ромашка" />
				<FormField label="ИНН" v-model="formModel.inn" placeholder="7700000000" />
				<FormField label="Контактное лицо" v-model="formModel.contactPerson" placeholder="ФИО" />
				<FormField label="Телефон" v-model="formModel.phone" placeholder="+7 (900) 000-00-00" />
				<FormField label="Email" v-model="formModel.email" placeholder="contact@company.test" />
				<FormField label="Адрес" type="textarea" v-model="formModel.address" placeholder="город, улица, дом" />
			</div>

			<template #footer>
				<button class="btn" type="button" @click="showEdit = false">Отмена</button>
				<button class="btn btnPrimary" type="button" @click="submitEdit" :disabled="saving">{{ saving ? 'Сохраняю...' :
					'Сохранить' }}</button>
			</template>
		</ModalForm>
	</div>
</template>

<style scoped>
.pageHeader {
	display: flex;
	align-items: center;
	margin-bottom: var(--space-4);
}

.headerLeft {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}

.backBtn {
	background: none;
	border: none;
	color: var(--muted);
	cursor: pointer;
	font-size: 1rem;
	padding: 0;
}

.content {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.card {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: var(--space-4);
}

.infoGrid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	gap: var(--space-3);
	margin-top: var(--space-3);
}

.infoItem {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.infoItem.fullWidth {
	grid-column: 1 / -1;
}

.label {
	color: var(--muted);
	font-size: 0.9rem;
}

.value {
	font-weight: 500;
}

.table {
	width: 100%;
	border-collapse: collapse;
	margin-top: var(--space-3);
}

.table th,
.table td {
	text-align: left;
	padding: var(--space-2);
	border-bottom: 1px solid var(--border);
}

.table th {
	color: var(--muted);
	font-weight: 500;
}

.link {
	color: #646cff;
	text-decoration: none;
}

.link:hover {
	text-decoration: underline;
}
</style>
