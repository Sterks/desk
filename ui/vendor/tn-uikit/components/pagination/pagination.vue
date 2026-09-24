<template>
  <div class="tn-pagination" :class="{ 'tn-pagination_medium': size === 'md' }">
    <TNButton
      v-if="showMoreButton"
      type="default"
      class="tn-pagination__more-button"
      :size="size"
      :disabled="moreButtonDisabled"
      block
      @click="handleClickMore"
    >
      {{ moreButtonText }}
    </TNButton>
    <hr v-if="size === 'lg'" class="tn-pagination__separator" />
    <div
      class="tn-pagination__pages-container"
      :class="{
        'tn-pagination__pages-container_sizes': pageSizeVariants.length
      }"
    >
      <div v-if="pageSizeVariants.length" class="tn-pagination__pages-sizes">
        <p class="tn-pagination__pages-size-text">{{ pageSizeText }}</p>
        <button
          v-for="pageSizeVariant in pageSizeVariants"
          :key="pageSizeVariant"
          class="tn-pagination__pages-size-variant"
          :class="{
            'tn-pagination__pages-size-variant_selected': pageSizeVariant === pageSize
          }"
          @click="handleSelectSize(pageSizeVariant)"
        >
          {{ pageSizeVariant }}
        </button>
      </div>
      <div class="tn-pagination__page-buttons-container">
        <button class="tn-pagination__arrow-button" :disabled="currentPage === 1" @click="handleSelectPage(currentPage - 1)">
          <TNIcon name="left-m" />
        </button>
        <template v-for="(page, index) in centerElements">
          <button
            v-if="page"
            :key="index"
            class="tn-pagination__page-button"
            :class="{
              'tn-pagination__page-button_selected': page === currentPage
            }"
            @click="handleSelectPage(page)"
          >
            {{ page }}
          </button>
          <div v-else :key="index + '1'" class="tn-pagination__page-separator"></div>
        </template>
        <button :disabled="currentPage === pagesCount" class="tn-pagination__arrow-button" @click="handleSelectPage(currentPage + 1)">
          <TNIcon name="right-m" />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import TNButton from "../button/button.vue";
import TNIcon from "../icons/icon.vue";

defineOptions({
  name: "TNPagination"
});

const props = withDefaults(
  defineProps<{
    /** Показывает кнопку в конце списка **/
    showMoreButton?: boolean;
    /** Отключить кнопку в конце списка **/
    moreButtonDisabled?: boolean;
    /** Текст кнопки в конце списка **/
    moreButtonText?: string;
    /** Текст кнопки выбора размера **/
    pageSizeText?: string;
    /** Варианты размера страницы **/
    pageSizeVariants?: number[];
    /** Текущий размер страницы **/
    pageSize?: number;
    /** Текущая страница **/
    currentPage: number;
    /** Общее количество страниц **/
    pagesCount: number;
    /** Количество элементов в центре **/
    centerElementsCount?: number;
    /** Размер компонента **/
    size?: "md" | "lg";
  }>(),
  {
    moreButtonText: "Показать еще",
    pageSizeText: "Показать на странице",
    pageSizeVariants: () => [],
    centerElementsCount: 3,
    size: "lg"
  }
);

const emit = defineEmits<{
  /** Событие вызывается при клике на кнопку "Показать еще **/
  (e: "click:more", $event: MouseEvent): void;
  /** Событие вызывается при выборе размера страницы **/
  (e: "select:size", size: number): void;
  /** Событие вызывается при выборе страницы **/
  (e: "select:page", page: number): void;
}>();

const handleClickMore = (event: MouseEvent) => {
  emit("click:more", event);
};

const handleSelectSize = (size: number) => {
  emit("select:size", size);
};

const handleSelectPage = (page: number) => {
  emit("select:page", page);
};

const centerElements = computed<number[]>(() => {
  const defaultList = Array(props.pagesCount)
    .fill(1)
    .map((item, index) => index + 1);
  if (props.pagesCount <= props.centerElementsCount) {
    return defaultList;
  }

  const elementList = defaultList.map(page => {
    if (page === 1) {
      return 1;
    } else if (page === props.pagesCount) {
      return props.pagesCount;
    } else if (props.currentPage <= Math.ceil(props.centerElementsCount / 2) && page <= props.centerElementsCount) {
      return page;
    } else if (props.currentPage >= props.pagesCount - Math.ceil(props.centerElementsCount / 2) && page >= props.pagesCount - props.centerElementsCount) {
      return page;
    } else if (
      page >= props.currentPage - Math.floor(props.centerElementsCount / 2) &&
      page <= props.currentPage + Math.floor(props.centerElementsCount / 2) - (props.centerElementsCount % 2 ? 0 : 1)
    ) {
      return page;
    }
    return 0;
  });

  return elementList.reduce<number[]>((prev, curr, index) => {
    if (elementList[index - 1] === 0 && curr === 0) {
      return prev;
    }
    return [...prev, curr];
  }, []);
});
</script>

<style>
.tn-pagination {
  user-select: none;
  font-family: var(--font-family-body);
  box-sizing: border-box;
  outline: none;
}

.tn-pagination__more-button {
  margin: 0 0 24px;
}

.tn-pagination__separator {
  margin: 0 0 24px;
  border: none;
  border-bottom: 1px solid var(--border-secondary-enabled);
}

.tn-pagination__pages-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.tn-pagination__pages-container_sizes {
  justify-content: space-between;
}

.tn-pagination_medium .tn-pagination__pages-container {
  flex-flow: column-reverse;
}

.tn-pagination__pages-sizes {
  display: flex;
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
  margin-right: 16px;
}

.tn-pagination_medium .tn-pagination__pages-sizes {
  margin-right: 0;
  margin-top: 16px;
}

.tn-pagination__pages-sizes > *:not(:last-child) {
  margin-right: 16px;
}

.tn-pagination__pages-size-text {
  color: var(--content-secondary-enabled);
}

.tn-pagination__pages-size-variant {
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-weight: var(--font-weight-accent);
  color: var(--content-secondary-enabled);
  padding: 0;
  transition: color 0.1s linear;
}

.tn-pagination__pages-size-variant:hover {
  color: var(--content-secondary-hover);
}

.tn-pagination__pages-size-variant:active {
  color: var(--content-secondary-pressed);
}

.tn-pagination__pages-size-variant_selected {
  color: var(--content-primary-a-enabled);
}

.tn-pagination__pages-size-variant_selected:hover {
  color: var(--content-primary-a-hover);
}

.tn-pagination__pages-size-variant_selected:active {
  color: var(--content-primary-a-pressed);
}

.tn-pagination__page-buttons-container {
  display: flex;
  align-items: center;
  column-gap: 8px;
}

.tn-pagination__page-separator {
  width: 16px;
  height: 1px;
  background-color: var(--border-secondary-enabled);
}

.tn-pagination__page-button {
  border-radius: 8px;
  padding: 16px 0;
  border: 1px solid var(--border-secondary-enabled);
  background-color: var(--background-primary-a-enabled);
  width: 48px;
  cursor: pointer;
  font-size: var(--font-size-body-medium);
  font-weight: var(--font-weight-accent);
  line-height: var(--font-lineHeight-body-medium);
  transition-property: background-color, border-color;
  transition-duration: 0.1s;
  transition-timing-function: linear;
  color: var(--content-primary-a-enabled);
}

.tn-pagination_medium .tn-pagination__page-button {
  width: 40px;
  padding: 12px 0;
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
}

.tn-pagination__page-button:hover {
  background-color: var(--background-primary-a-hover);
}

.tn-pagination__page-button:active {
  background-color: var(--background-primary-a-pressed);
}

.tn-pagination__page-button_selected {
  background-color: var(--background-tertiary-enabled);
  border-color: var(--background-tertiary-enabled);
  pointer-events: none;
}

.tn-pagination__arrow-button {
  background-color: transparent;
  transition: color 0.1s linear;
  color: var(--content-secondary-enabled);
  padding: 0;
  height: 56px;
  border: none;
  cursor: pointer;
}

.tn-pagination__arrow-button:hover {
  color: var(--content-secondary-hover);
}

.tn-pagination__arrow-button:active {
  color: var(--content-secondary-pressed);
}

.tn-pagination__arrow-button:disabled {
  pointer-events: none;
  color: var(--content-secondary-disabled);
}
</style>
