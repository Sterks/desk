<script setup lang="ts">
import { computed } from 'vue';
import TNSelectV2 from '@life_uikit/uikit/components/select_v2/select_v2.vue';
import TNButton from '@life_uikit/uikit/components/button/button.vue';
import type { BoardInfo, TaskItem } from '../api/types';
import type { Filters } from '../lib/filters';

const props = defineProps<{ board: BoardInfo; tasks: TaskItem[]; filters: Filters }>();
const emit = defineEmits<{ change: [Partial<Filters>]; create: [] }>();

const assignees = computed(() => [...new Set(props.tasks.flatMap((t) => (t.assignee ? [t.assignee] : [])))].sort());
const enumFields = computed(() => props.board.fields.filter((f) => (f.type === 'enum' || f.type === 'multi_enum') && f.values));

function onSearchInput(e: Event): void {
  emit('change', { q: (e.target as HTMLInputElement).value });
}
</script>

<template>
  <form role="search" class="filter-bar" @submit.prevent>
    <!--
      Не TNSearch: его template — единственный корень `<form class="tn-search">`, внутри которого
      настоящий `<input type="search">` (role=searchbox по умолчанию — это ОК) вложен на несколько
      уровней глубже. `aria-label`, переданный на `<TNSearch>` снаружи, не декларирован как проп у
      компонента и поэтому по стандартному fallthrough Vue уедет на этот корневой `<form>`, а не на
      вложенный input — доступное имя searchbox'а осталось бы пустым, и E2E-локатор
      `getByRole('searchbox', { name: 'Поиск по ID и названию' })` (Task 9) не нашёл бы элемент.
      TNSearch к тому же не даёт никакого проп для aria-label самого input. Обычный
      `<input type="search">` со своим aria-label — тот же вид, то же поведение, рабочая доступность.
    -->
    <input
      type="search"
      class="control filter-search"
      aria-label="Поиск по ID и названию"
      placeholder="Поиск: T-012 или слово из названия"
      :value="filters.q"
      @input="onSearchInput"
    />
    <TNSelectV2
      aria-label="Исполнитель"
      placeholder="Исполнитель"
      :options="assignees"
      :model-value="filters.assignee || undefined"
      @update:model-value="(v) => emit('change', { assignee: v ?? '' })"
    />
    <TNSelectV2
      v-for="f in enumFields"
      :key="f.id"
      :aria-label="f.id"
      :placeholder="f.id"
      :options="f.values ?? []"
      :model-value="filters.fields[f.id] || undefined"
      @update:model-value="(v) => emit('change', { fields: { ...filters.fields, [f.id]: v ?? '' } })"
    />
    <TNButton type="action" @click="emit('create')">Новая задача</TNButton>
  </form>
</template>
