<template>
  <div
    class="tn-form-item"
    :class="{
      'tn-form-item--required': !!required,
      'tn-form-item--error': !!error,
      'tn-form-item--warn': !!warn,
      'tn-form-item--success': !!success,
      'tn-form-item--smooth': !!smoothMessage
    }"
  >
    <slot name="header" />
    <label v-if="label" :for="itemId" class="tn-form-item__label" v-html="label" />
    <label v-else-if="hasLabelSlot" :for="itemId" class="tn-form-item__label">
      <slot name="label"></slot>
    </label>

    <p v-if="description" class="tn-form-item__description">
      {{ description }}
    </p>
    <p v-else-if="hasDescriptionSlot" class="tn-form-item__description">
      <slot name="description" />
    </p>

    <slot name="default" />

    <transition name="tn-form-item__message">
      <p v-if="error && error.trim()" key="errorMessage" class="tn-form-item__message tn-form-item__message--error">
        {{ error }}
      </p>
      <p v-else-if="success && success.trim()" key="successMessage" class="tn-form-item__message tn-form-item__message--success">
        {{ success }}
      </p>
      <p v-else-if="warn && warn.trim()" key="warnMessage" class="tn-form-item__message tn-form-item__message--warning">
        {{ warn }}
      </p>
    </transition>

    <slot name="footer" />
  </div>
</template>

<script lang="ts" setup>
import type { TNFormItemProps, TNFormItemSlots } from "./form-item.types";
import { computed, VNode } from "vue";

defineOptions({
  name: "TNFormItem"
});

defineProps<TNFormItemProps & { itemId?: string }>();

const slots = defineSlots<TNFormItemSlots & { default?: () => VNode }>();

const hasLabelSlot = computed<boolean>(() => !!slots.label);
const hasDescriptionSlot = computed<boolean>(() => !!slots.description);
</script>

<style lang="css">
.tn-form-item {
  font-family: var(--font-family-body);
}

.tn-form-item__label {
  display: block;
  font-weight: var(--font-weight-accent);
  color: var(--content-primary-a-enabled);
  margin-bottom: 10px;
  font-size: var(--font-size-body-medium);
  line-height: 16px;
}

.tn-form-item--required .tn-form-item__label:after {
  content: "*";
  color: var(--content-accent-enabled);
  margin-left: 2px;
}

.tn-form-item__description {
  color: var(--content-primary-a-enabled);
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
  margin-bottom: 10px;
}

.tn-form-item__message {
  padding: 2px 0;
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
}

.tn-form-item__message--error {
  color: var(--content-accent-enabled);
}

.tn-form-item__message--warning {
  color: var(--content-system-warning);
}

.tn-form-item__message--success {
  color: var(--content-system-positive);
}

.tn-form-item--smooth .tn-form-item__message-enter-active,
.tn-form-item--smooth .tn-form-item__message-leave-active {
  transition-property: opacity, transform, height;
  transition-duration: 0.3s;
  transition-timing-function: ease;
}

.tn-form-item--smooth .tn-form-item__message-enter,
.tn-form-item--smooth .tn-form-item__message-leave {
  transform: translateY(0);
  opacity: 1;
  height: auto;
}

.tn-form-item--smooth .tn-form-item__message-enter-from,
.tn-form-item--smooth .tn-form-item__message-leave-to {
  transform: translateY(-8px);
  opacity: 0;
  height: 0;
}
</style>
