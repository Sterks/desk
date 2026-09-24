<script setup lang="ts">
import { computed } from 'vue';
import TNInput from '@life_uikit/uikit/components/input/input.vue';
import TNTextarea from '@life_uikit/uikit/components/textarea/textarea.vue';
import TNCheckbox from '@life_uikit/uikit/components/checkbox/checkbox.vue';
import TNSelectV2 from '@life_uikit/uikit/components/select_v2/select_v2.vue';
import TNMultiSelector from '@life_uikit/uikit/components/multiselect/multiselect.vue';
import type { FieldInfo, FieldValue } from '../api/types';
import { parseNumberInput } from '../lib/fields';

const props = defineProps<{ def: FieldInfo; value: FieldValue | undefined | null }>();
const emit = defineEmits<{ 'update:value': [FieldValue | null] }>();

const textValue = computed(() => (typeof props.value === 'string' ? props.value : ''));
const numberValue = computed(() => (typeof props.value === 'number' ? props.value : null));
const boolValue = computed(() => props.value === true);
const listValue = computed(() => (Array.isArray(props.value) ? props.value : []));
const orNull = (text: string): string | null => (text === '' ? null : text);

// TNMultiSelector рисует дерево (`TNTreeProps.Option`): нужен объект { id, title, isCheck, deep },
// не голая строка — см. ui/vendor/tn-uikit/components/tree/tree.types.ts. `flat: true` ниже отключает
// вложенность (isCheck/deep не используются в этом режиме, но остаются в типе как обязательные поля).
const multiOptions = computed(() => (props.def.values ?? []).map((v) => ({ id: v, title: v, isCheck: false, deep: 0 })));
</script>

<template>
  <div class="field-row">
    <TNSelectV2
      v-if="def.type === 'enum'"
      :label="def.id"
      :description="def.guide ?? undefined"
      :required="def.required"
      :options="def.values ?? []"
      :model-value="textValue || undefined"
      @update:model-value="(v) => emit('update:value', v ?? null)"
    />
    <TNMultiSelector
      v-else-if="def.type === 'multi_enum'"
      :label="def.id"
      :description="def.guide ?? undefined"
      :required="def.required"
      :options="multiOptions"
      flat
      :model-value="listValue"
      @update:model-value="(v) => emit('update:value', v && v.length > 0 ? v : null)"
    />
    <TNCheckbox
      v-else-if="def.type === 'bool'"
      :label="def.id"
      :description="def.guide ?? undefined"
      :model-value="boolValue"
      @update:model-value="(v) => emit('update:value', v ?? false)"
    />
    <TNInput
      v-else-if="def.type === 'number'"
      :label="def.id"
      :description="def.guide ?? undefined"
      :required="def.required"
      numeric-keyboard="decimal"
      :model-value="numberValue === null ? '' : String(numberValue)"
      @update:model-value="(v) => emit('update:value', parseNumberInput(v))"
    />
    <TNTextarea
      v-else-if="def.type === 'text'"
      :label="def.id"
      :description="def.guide ?? undefined"
      :required="def.required"
      :model-value="textValue"
      @update:model-value="(v) => emit('update:value', orNull(v))"
    />
    <TNInput
      v-else
      :label="def.id"
      :description="def.guide ?? undefined"
      :required="def.required"
      :model-value="textValue"
      @update:model-value="(v) => emit('update:value', orNull(v))"
    />
  </div>
</template>
