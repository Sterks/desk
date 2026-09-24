<template>
  <div v-if="isLoading" class="tn-select-v2__loader">
    <TNIcon class="tn-select-v2__loader-icon" name="load" />
  </div>
  <p v-else-if="!items.length && hasQuery && notFoundHint" class="tn-select-v2__empty">
    {{ notFoundHint }}
  </p>
  <p v-else-if="!items.length && emptyListHint" class="tn-select-v2__empty">
    {{ emptyListHint }}
  </p>
  <ul v-else class="tn-select-v2__list">
    <li
      v-for="(item, index) in items"
      :key="item.id"
      :class="{
        'tn-select-v2__item_selected': item.selected,
        'tn-select-v2__item_disabled': item.disabled
      }"
      class="tn-select-v2__item"
      @click="onClick(item)"
    >
      <slot
        v-if="$slots.option"
        name="option"
        :option="item.option"
        :label="item.label"
        :index="index"
        :is-selected="item.selected"
        :is-disabled="item.disabled"
      />
      <template v-else>
        <span class="tn-select-v2__item-title">{{ item.label }}</span>
        <TNIcon v-if="item.selected" class="tn-select-v2__item-check" name="check" />
      </template>
    </li>
  </ul>
</template>

<script lang="ts" setup generic="TOption">
import type { VNode } from "vue";
import TNIcon from "../../../icons/icon.vue";
import type { TNSelectV2Item } from "./select_v2-options.types";
import type { TNSelectV2OptionSlotScope } from "../../select_v2.types";

defineOptions({
  name: "TNSelectV2Options"
});

defineProps<{
  /** Нормализованный список опций. */
  items: TNSelectV2Item<TOption>[];
  /** Состояние загрузки списка. */
  isLoading?: boolean;
  /** Подсказка для пустого списка. */
  emptyListHint?: string;
  /** Подсказка, когда по поисковому запросу ничего не найдено. */
  notFoundHint?: string;
  /** Есть ли активный поисковый запрос — выбирает текст пустого состояния. */
  hasQuery?: boolean;
}>();

const emit = defineEmits<{
  /** Вызывается при клике по доступной опции. */
  (e: "select", item: TNSelectV2Item<TOption>): void;
}>();

defineSlots<{
  /** Кастомное отображение опции в списке. */
  option?: (scope: TNSelectV2OptionSlotScope<TOption>) => VNode[];
}>();

const onClick = (item: TNSelectV2Item<TOption>) => {
  if (!item.disabled) emit("select", item);
};
</script>

<style lang="css" src="./select_v2-options.css"></style>
