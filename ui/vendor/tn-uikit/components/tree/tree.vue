<template>
  <div class="tree">
    <ul class="tree__list">
      <TNTreeItem
        v-for="option in options"
        :key="option.id"
        :multiple="multiple"
        :option="option"
        :is-async="isAsync"
        :is-depends-parent="isDependsParent"
        :children="option.children"
        :no-children="isNoChildren"
        :simple="simple"
        :highlight-disable="highlightDisable"
        @load-options="$emit('loadOptions', $event)"
        @handle-click-title="toggleOptionOpened"
        @handle-check="handleCheck"
        @icon-button-click="$emit('iconButtonClick', $event)"
      />
    </ul>
  </div>
</template>

<script setup lang="ts" generic="TId extends string | number = string | number">
import TNTreeItem from "./components/tree__item.vue";
import type { TNTreeProps } from "./tree.types";
import { recursive, recursiveParents, getIsIndeterminate, recursiveArray, getIsDependsParent } from "./helpers";
import { debounce } from "../../helpers";
import { computed, nextTick, ref, watch } from "vue";

defineOptions({
  name: "TNTree"
});

const props = withDefaults(
  defineProps<{
    /** Значение value переменной для компонента. */
    modelValue: Array<TId>;
    /** Массив опций для дерева. */
    options?: TNTreeProps.Option<TId>[];
    /** Асинхронное дерево. */
    isAsync?: boolean;
    /** Авто-выбор родителя. */
    isDependsParent?: boolean;
    /** Опредеяет можно ли выбрать несколько элементов дерерва. */
    multiple?: boolean;
    /** При true, выбор родительского элемента автоматически выберет все дочерние элементы. */
    childRecursiveSelect?: boolean;
    /** Изменяет стиль заголовка элемента, когда элемент выбран. */
    simple?: boolean;
    /** Изменяет стиль заголовка элемента, когда элемент отключен или выбор элемента отключен. */
    highlightDisable?: boolean;
  }>(),
  {
    options: () => [],
    isAsync: false,
    isDependsParent: true,
    multiple: true,
    childRecursiveSelect: true,
    simple: false,
    highlightDisable: false
  }
);

const emit = defineEmits<{
  /** Событие вызывается при открытии асинхронного дерева. */
  (event: "loadOptions", option: TNTreeProps.Option<TId>): void;
  /** Событие вызывается при обновлении modelValue. */
  (event: "update:modelValue", modelValue: Array<TId>, isSync: boolean): void;
  /** Событие вызывается при клике на иконку. */
  (event: "iconButtonClick", optionId: TId): void;
}>();

const isWatchValue = ref<boolean>(true);

const isLoadOptions = computed<boolean>(() => {
  let isLoad = false;

  recursive(props.options, option => {
    if (option.isLoad) {
      isLoad = true;
    }
  });

  return isLoad;
});

const isNoChildren = computed<boolean>(() => props.options.every(o => !o.children));

const toggleOptionOpenedSync = (option: TNTreeProps.Option<TId>, isOpen: boolean, isSetChecked = false) => {
  option.isOpen = isOpen;

  if (option.children && props.childRecursiveSelect) {
    option.children.forEach(child => {
      if (!option.isOpen || (option.isOpen && option.isCheck)) {
        if (isSetChecked && !child.disableSelect) {
          child.isCheck = option.isCheck;
        }
        toggleOptionOpened(child, option.isOpen, isSetChecked);
      }
    });
  }
};

const toggleOptionOpened = (option: TNTreeProps.Option<TId>, isOpen?: boolean, isSetChecked = false) => {
  const nextIsOpen = isOpen ?? !option.isOpen;

  if (props.isAsync && nextIsOpen) {
    option.isLoad = true;

    emit("loadOptions", option);

    const unWatchOptionIsLoad = watch(
      () => option.isLoad,
      () => {
        toggleOptionOpenedSync(option, nextIsOpen, isSetChecked);
        unWatchOptionIsLoad();
      }
    );
  } else {
    toggleOptionOpenedSync(option, nextIsOpen, isSetChecked);
  }
};

const handleInput = (optionChecked?: TNTreeProps.Option<TId>) => {
  isWatchValue.value = false;
  if (!props.multiple && optionChecked) {
    if (!optionChecked.disableSelect && !optionChecked.disabled) {
      recursive(props.options, child => {
        if (child.id !== optionChecked.id) {
          child.isCheck = false;
        }
      });

      emit("update:modelValue", [optionChecked.id], false);
    }
    return;
  }
  const answer: Array<TId> = [];

  recursive(props.options, child => {
    if (child.isCheck) {
      answer.push(child.id);
    }
  });

  emit("update:modelValue", answer, true);

  nextTick().then(() => {
    isWatchValue.value = true;
  });
};

const watchIsLoadOptionsDebounce = () => {
  return debounce(() => {
    if (props.isAsync && !isLoadOptions.value) {
      handleInput();
    }
  }, 700);
};

watch(
  () => isLoadOptions.value,
  () => {
    watchIsLoadOptionsDebounce()();
  }
);

watch(
  () => props.modelValue,
  (_newValue, oldValue) => {
    if (props.modelValue && isWatchValue.value) {
      if (props.isAsync) {
        if (oldValue !== undefined) handleInput();
      } else {
        if (props.modelValue.length) {
          recursive(props.options, option => {
            let isCheck = false;

            recursiveArray(props.modelValue, (item: TId) => {
              if (item === option.id) {
                isCheck = true;
              }
            });

            option.isCheck = isCheck;
          });
          recursive(props.options, option => {
            const isOpen = !!(option.isCheck || getIsIndeterminate(option));
            toggleOptionOpenedSync(option, isOpen, props.multiple);
          });
        } else {
          recursive(props.options, option => {
            option.isCheck = false;
            toggleOptionOpenedSync(option, false);
          });
        }
        if (oldValue !== undefined) handleInput();
      }
    }
  },
  {
    deep: true,
    immediate: true
  }
);

const checkParent = (option: TNTreeProps.Option<TId>) => {
  if (getIsDependsParent(option, props.isDependsParent)) {
    recursiveParents(option, parent => {
      if (parent.children) {
        parent.isCheck = parent.children.every(i => i.isCheck);
        if (parent.isCheck || getIsIndeterminate(parent)) {
          parent.isOpen = true;
        }
      }
    });
  }
};

const handleCheck = (option: TNTreeProps.Option<TId>) => {
  if (!option.disabled && !option.disableSelect) {
    if (option.isCheck) {
      toggleOptionOpened(option, true, true);
    } else if (option.children && props.childRecursiveSelect) {
      recursive(option.children, child => {
        child.isCheck = false;
      });
    }
  }

  checkParent(option);

  if (props.isAsync) {
    watchIsLoadOptionsDebounce()();
  } else {
    handleInput(option);
  }
};
</script>
<style lang="css">
.tree {
  font-family: var(--font-family-body);
  user-select: none;
}

.tree__list {
  margin: 0;
  padding: 0;
  list-style: none;
  transition: margin 0.3s ease;
}
</style>
