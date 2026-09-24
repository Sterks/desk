<template>
  <ul
    v-click-outside="closeHandler"
    class="tn-table-filter"
    :class="{
      'tn-table-filter_resettable': resettable
    }"
  >
    <li
      v-for="item in columnFilterMenu"
      :key="item.id"
      class="tn-table-filter__item"
      :class="{
        'tn-table-filter__item_disabled': disabledFields?.includes(item.id)
      }"
    >
      <p class="tn-table-filter__title">{{ item.title }}</p>
      <TNCheckbox :model-value="visibleFields.includes(item.id)" :disabled="disabledFields?.includes(item.id)" @update:model-value="selectHandler(item.id)" />
    </li>
    <li v-if="resettable" class="tn-table-filter__item tn-table-filter__item_reset">
      <TNButton class="tn-table-filter__reset-button" block type="outline" :disabled="disabledReset" @click="resetHandler"> Сбросить </TNButton>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import TNCheckbox from "../../checkbox/checkbox.vue";
import TNButton from "../../button/button.vue";
import { vClickOutside } from "../../../directives/click-outside";

defineOptions({
  name: "TNTableFilter"
});

defineProps<{
  visibleFields: string[];
  disabledFields?: string[];
  columnFilterMenu?: {
    title: string;
    id: string;
  }[];
  resettable?: boolean;
  disabledReset?: boolean;
}>();

const emit = defineEmits<{
  (e: "select", id: string): void;
  (e: "close"): void;
  (e: "reset"): void;
}>();

const selectHandler = (id: string) => {
  emit("select", id);
};

const closeHandler = () => {
  emit("close");
};

const resetHandler = () => {
  emit("reset");
};
</script>

<style lang="css">
.tn-table-filter {
  margin: 0;
  display: block;
  background-color: var(--background-primary-a-enabled);
  padding: 8px 0;
  border-radius: 12px;
  overflow: auto;
  box-shadow: var(--shadow-large);
}

.tn-table-filter_resettable {
  padding: 8px 0 0;
}

.tn-table-filter__item {
  background-color: var(--background-primary-a-enabled);
  padding: 4px 12px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.tn-table-filter__item_disabled {
  background-color: var(--background-primary-a-disabled);
  color: var(--content-primary-a-disabled);
}

.tn-table-filter__item_reset {
  padding: 12px 16px;
  display: block;
  position: sticky;
  bottom: 0;
  right: 0;
  left: 0;
  box-shadow: 0 -4px 12px 0 rgba(0, 0, 0, 0.09);
}

.tn-table-filter__title {
  white-space: nowrap;
  font-weight: var(--font-weight-text);
}

.tn-table-filter::-webkit-scrollbar {
  width: 12px;
}

.tn-table-filter::-webkit-scrollbar-thumb {
  border: 4px solid rgba(0, 0, 0, 0);
  background-clip: padding-box;
  border-radius: 24px;
  background-color: var(--border-secondary-pressed);
}
</style>
