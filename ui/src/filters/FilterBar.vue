<script setup lang="ts">
import { computed } from 'vue';
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
    <!-- Фильтры — нативные <select> с aria-label, как в React-версии, а не TNSelectV2: у того
         триггер — <div> без role/tabindex/клавиатуры, а aria-label падал на инертную обёртку
         .tn-form-item (fallthrough на корень компонента). Нативный select — combobox с именем. -->
    <select
      class="control"
      aria-label="Исполнитель"
      :value="filters.assignee"
      @change="emit('change', { assignee: ($event.target as HTMLSelectElement).value })"
    >
      <option value="">все исполнители</option>
      <option v-for="a in assignees" :key="a" :value="a">{{ a }}</option>
    </select>
    <select
      v-for="f in enumFields"
      :key="f.id"
      class="control"
      :aria-label="f.id"
      :value="filters.fields[f.id] ?? ''"
      @change="emit('change', { fields: { ...filters.fields, [f.id]: ($event.target as HTMLSelectElement).value } })"
    >
      <option value="">{{ f.id }}: все</option>
      <option v-for="v in f.values ?? []" :key="v" :value="v">{{ v }}</option>
    </select>
    <TNButton type="action" @click="emit('create')">Новая задача</TNButton>
  </form>
</template>
