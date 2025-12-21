<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import FormField from "../components/FormField.vue";
import BaseButton from "../components/BaseButton.vue";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const login = ref("");
const password = ref("");
const loading = ref(false);
const error = ref<string | null>(null);

async function submit() {
  loading.value = true;
  error.value = null;
  try {
    await auth.login({ login: login.value, password: password.value });
    const redirect =
      typeof route.query.redirect === "string" ? route.query.redirect : "/";
    router.push(redirect);
  } catch (e: any) {
    error.value = e?.response?.data?.message || "Ошибка входа";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="wrap">
    <h1>Вход</h1>

    <form class="form" @submit.prevent="submit">
      <FormField label="Логин" v-model="login" placeholder="Введите логин" />
      <FormField
        label="Пароль"
        v-model="password"
        type="password"
        placeholder="Введите пароль"
      />

      <div class="actions">
        <BaseButton type="submit" variant="primary">Войти</BaseButton>
      </div>

      <div v-if="error" class="error">{{ error }}</div>
    </form>
  </div>
</template>

<style scoped>
.wrap {
  max-width: 420px;
  margin: 48px auto;
  padding: 0 16px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
  /* center the button on the login page */
  justify-content: center;
  /* override global .actions margin-left:auto */
  margin-left: 0 !important;
  margin-right: 0;
  width: 100%;
}

.actions .btn {
  /* Use the global `.btn` sizing so the button matches other pages */
  padding: 8px 12px;
  font-size: inherit;
  min-width: 120px;
  height: 40px;
  border-radius: 10px;
}

.error {
  margin-top: 12px;
  color: #b00020;
}
</style>
