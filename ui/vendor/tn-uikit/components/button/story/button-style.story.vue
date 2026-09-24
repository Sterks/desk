<template>
  <Story title="TNButton/Playground" group="form" :layout="{ type: 'grid' }">
    <template #controls="{ state }">
      <ControlFieldSelect
        v-model="state.size"
        title="size"
        :options="['sm', 'md', 'lg', 'xl']"
        default-value="sm"
        field-type='"sm" | "md" | "lg" | "xl"'
        desc="Размер кнопки"
      />
      <ControlFieldSelect
        v-model="state.type"
        title="size"
        :options="['secondary', 'action', 'outline', 'white', 'link']"
        default-value="sm"
        field-type='"secondary" | "action" | "outline" | "white" | "link"'
        desc="Стиль кнопки"
      />
      <ControlFieldBoolean v-model="state.rounded" title="rounded" default-value="false" field-type="boolean" desc="Скруглить углы кнопки" />
      <ControlFieldBoolean v-model="state.disabled" title="disabled" field-type="boolean" desc="Отключить кнопку (применяется disabled стиль)" />
      <ControlFieldBoolean
        v-model="state.block"
        title="block"
        field-type="boolean"
        desc='Применяет кнопке стиль "display: block", из-за чего ширина кнопки становится 100% от родительского контейнера'
      />
      <ControlFieldBoolean
        v-model="state.loading"
        title="loading"
        default-value="false"
        field-type="boolean"
        desc="Отключает кнопку и включает состояние загрузки (loader)"
      />
      <ControlFieldSelect v-model="state.icon" title="icon" field-type="IconNames" :options="iconNamesArray" desc="Вставка иконки слева" />
      <ControlFieldSelect v-model="state.iconRight" title="iconRight" field-type="IconNames" :options="iconNamesArray" desc="Вставка иконки справа" />
      <ControlFieldText v-model="state.href" title="href" field-type="String" desc="Открывает проброшенную ссылку через Vue Router. Должна быть валидным URL" />
      <ControlFieldBoolean
        v-model="state.norouter"
        title="norouter"
        field-type="boolean"
        desc="Открывает проброшенную в параметре href ссылку с перезагрузкой страницы"
      />
      <ControlFieldText
        v-model="state.target"
        title="target"
        field-type="String"
        desc="Открывает проброшенную в параметре href ссылку в новой вкладке. параметр norouter использовать при этом необязательно"
      />
      <ControlFieldNumber
        v-model="state.iconSizeOverride"
        title="iconSizeOverride"
        field-type="String | Number"
        desc="Устанавливает размер иконки (в пикселях)"
      />
    </template>
    <Variant title="Playground" auto-props-disabled>
      <template #default="{ state }">
        <TNButton v-bind="filterState(state)">Кнопка для тестов</TNButton>
      </template>
    </Variant>
    <Variant id="styles" title="Стили и состояния">
      <TNButton type="action">Кнопка действия</TNButton>
      <br />
      <TNButton type="default">Простая кнопка</TNButton>
      <br />
      <TNButton type="outline">Кнопка с обводкой</TNButton>
      <br />
      <TNButton type="link">Кнопка ссылка</TNButton>
      <br />
      <TNButton type="white">Кнопка белая</TNButton>
    </Variant>
    <Variant id="size" title="Размеры">
      <TNButton size="xl">Кнопка с size="xl"</TNButton>
      <br />
      <TNButton size="lg">Кнопка с size="lg"</TNButton>
      <br />
      <TNButton size="md">Кнопка с size="md"</TNButton>
      <br />
      <TNButton size="sm">Кнопка с size="sm"</TNButton>
    </Variant>
    <Variant id="rounded" title="Скругления" auto-props-disabled>
      <template #default="{ state }">
        <TNButton v-bind="filterState(state)" rounded>Кнопка</TNButton>
      </template>
    </Variant>
    <Variant id="block" title="Отображение как блока" auto-props-disabled>
      <template #default="{ state }">
        <TNButton v-bind="filterState(state)" block>Кнопка</TNButton>
      </template>
    </Variant>
    <Variant id="disabled" title="Блокировка" auto-props-disabled>
      <template #default="{ state }">
        <TNButton v-bind="filterState(state)" disabled>Кнопка</TNButton>
      </template>
    </Variant>
    <Variant id="icon" title="Добавление иконки" auto-props-disabled>
      <template #default="{ state }">
        <TNButton v-bind="filterState(state)" icon="star">Кнопка</TNButton>
      </template>
    </Variant>
    <Variant id="button-icon" title="Кнопки-иконки" auto-props-disabled>
      <template #default="{ state }">
        <TNButton v-bind="filterState(state)" icon="star" />
      </template>
    </Variant>
    <Variant id="customSVG" title="Добавление иконки через слот" auto-props-disabled>
      <template #default="{ state }">
        <TNButton v-bind="filterState(state)">
          В избранное
          <template #icon-right>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8.00004 1.33333L10.06 5.50666L14.6667 6.18L11.3334
          9.42666L12.12 14.0133L8.00004 11.8467L3.88004 14.0133L4.66671
          9.42666L1.33337 6.18L5.94004 5.50666L8.00004 1.33333Z"
                fill="currentColor"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </template>
        </TNButton>
      </template>
    </Variant>
    <Variant id="href" title="Кнопка в качестве ссылки" auto-props-disabled>
      <template #default>
        <TNButton type="link" href="https://www.google.com/" target="_blank"> Открыть Google в новой вкладке </TNButton>
      </template>
    </Variant>
    <Variant id="loading" title="Состояние загрузки" auto-props-disabled>
      <template #default>
        <TNButton loading>Кнопка</TNButton>
      </template>
    </Variant>
  </Story>
</template>

<docs lang="md">
## Стили и состояния

У кнопок есть три цветовые схемы, которые активируются соответствующими параметрами:

- `action` - Кнопка действия (по-умолчанию).
- `secondary` - Простая кнопка.
- `outline` - Кнопка с обводкой.
- `link` - Кнопка, визуально напоминающая ссылку.
- `white` - Кнопка белая.

```vue
<TNButton action>Кнопка действия</TNButton>
<TNButton secondary>Простая кнопка</TNButton>
<TNButton outline>Кнопка с обводкой</TNButton>
<TNButton link>Кнопка ссылка</TNButton>
<TNButton white>Кнопка белая</TNButton>
```
</docs>

<script setup lang="ts">
import { filterState, iconNamesArray } from "../../../consts/consts";
import ControlFieldNumber from "../../../.histoire/components/controls/control-field-number/control-field-number.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
</script>
