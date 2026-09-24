<template>
  <textarea
    ref="textarea"
    v-model="textareaContent"
    class="textarea-autosize"
    :cols="cols"
    :placeholder="placeholder"
    :rows="rows"
    :style="styles"
    wrap="hard"
    @focus="resize"
  ></textarea>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch, CSSProperties } from "vue";

defineOptions({
  name: "ResizeTextarea"
});

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    rows?: number;
    cols?: number;
    minHeight?: number;
    maxHeight?: number;
    modelValue?: string;
    autoResize?: boolean;
  }>(),
  {
    rows: 2,
    cols: 0,
    minHeight: 50,
    maxHeight: undefined,
    autoResize: true
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const textarea = ref<HTMLTextAreaElement | null>(null);
const height = ref<string>("");
const isScrollEnabled = ref<boolean>(false);

const textareaContent = computed<string>({
  get: () => props.modelValue ?? "",
  set: (value: string) => emit("update:modelValue", value)
});

const styles = computed<CSSProperties>(() => ({
  resize: props.autoResize ? "none" : "vertical",
  height: height.value,
  overflowY: isScrollEnabled.value ? "scroll" : "hidden"
}));

const resize = () => {
  const element = textarea.value;
  if (!element) return;
  const unit: string = "px";
  height.value = "auto !important";
  nextTick(() => {
    if (props.minHeight) {
      height.value = `${element.scrollHeight < props.minHeight ? props.minHeight : element.scrollHeight}${unit}`;
    }
    if (props.maxHeight) {
      if (element.scrollHeight > props.maxHeight) {
        height.value = `${props.maxHeight}${unit}`;
        isScrollEnabled.value = true;
      } else {
        isScrollEnabled.value = false;
      }
    }
  });
};

watch(() => props.modelValue, resize, { immediate: true, flush: "post" });
</script>

<style lang="css">
.textarea-autosize {
  &::-webkit-scrollbar {
    width: 8px;
    height: 0;
  }

  &::-webkit-scrollbar-track {
    background: none;
    border-radius: 8px;
    margin: 4px 0;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--border-secondary-enabled);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: var(--border-secondary-hover);
    cursor: pointer;
    border: 1px solid transparent;
  }
}
</style>
