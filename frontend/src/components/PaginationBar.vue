<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Number, default: 1 },
  totalItems: { type: Number, default: 0 },
  pageSize: { type: Number, default: 10 },
});

const emit = defineEmits(["update:modelValue"]);

const totalPages = computed(() => Math.max(1, Math.ceil((props.totalItems || 0) / props.pageSize)));
const page = computed(() => Math.min(Math.max(props.modelValue || 1, 1), totalPages.value));
const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, page.value - 2);
  const end = Math.min(totalPages.value, start + 4);
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
});

function setPage(value) {
  const next = Math.min(Math.max(value, 1), totalPages.value);
  emit("update:modelValue", next);
}
</script>

<template>
  <div
    v-if="totalItems > pageSize"
    class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3"
  >
    <small class="text-muted">Total: {{ totalItems }} records | Page {{ page }} / {{ totalPages }}</small>
    <nav aria-label="Pagination">
      <ul class="pagination pagination-sm mb-0">
        <li class="page-item" :class="{ disabled: page <= 1 }">
          <button class="page-link" @click="setPage(page - 1)">Prev</button>
        </li>
        <li class="page-item" v-for="p in visiblePages" :key="p" :class="{ active: p === page }">
          <button class="page-link" @click="setPage(p)">{{ p }}</button>
        </li>
        <li class="page-item" :class="{ disabled: page >= totalPages }">
          <button class="page-link" @click="setPage(page + 1)">Next</button>
        </li>
      </ul>
    </nav>
  </div>
</template>
