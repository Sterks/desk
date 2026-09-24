<template>
  <Story title="Icons/TNFileIcon" group="data" :layout="{ type: 'grid', width: '15%' }">
    <template #controls="{ state }">
      <ControlFieldText v-model="state.extension" title="extension" field-type="string" required desc="Расширение файла. Указывается без точки." />
      <ControlFieldText v-model="state.size" title="size" field-type="string | number" default-value="32" desc="Размер иконки в пикселях" />
    </template>
    <Variant title="Файл .pdf" :init-state="() => ({ extension: 'pdf' })">
      <template #default="{ state }">
        <TNFileIcon v-bind="filterState(state)" :extension="state.extension" :size="state.size" />
      </template>
    </Variant>
    <Variant title="Изображение" :init-state="() => ({ extension: 'jpeg' })">
      <template #default="{ state }">
        <TNFileIcon v-bind="filterState(state)" :extension="state.extension" :size="state.size" />
      </template>
    </Variant>
    <Variant title="Документ" :init-state="() => ({ extension: 'docx' })">
      <template #default="{ state }">
        <TNFileIcon v-bind="filterState(state)" :extension="state.extension" :size="state.size" />
      </template>
    </Variant>
    <Variant title="Таблица" :init-state="() => ({ extension: 'xlsx' })">
      <template #default="{ state }">
        <TNFileIcon v-bind="filterState(state)" :extension="state.extension" :size="state.size" />
      </template>
    </Variant>
    <Variant title="Презентация" :init-state="() => ({ extension: 'asp' })">
      <template #default="{ state }">
        <TNFileIcon v-bind="filterState(state)" :extension="state.extension" :size="state.size" />
      </template>
    </Variant>
    <Variant title="Архив" :init-state="() => ({ extension: '7z' })">
      <template #default="{ state }">
        <TNFileIcon v-bind="filterState(state)" :extension="state.extension" :size="state.size" />
      </template>
    </Variant>
    <Variant title="Видео" :init-state="() => ({ extension: 'mp4' })">
      <template #default="{ state }">
        <TNFileIcon v-bind="filterState(state)" :extension="state.extension" :size="state.size" />
      </template>
    </Variant>
    <Variant title="Аудио" :init-state="() => ({ extension: 'mp3' })">
      <template #default="{ state }">
        <TNFileIcon v-bind="filterState(state)" :extension="state.extension" :size="state.size" />
      </template>
    </Variant>
    <Variant title="Код" :init-state="() => ({ extension: 'aspx' })">
      <template #default="{ state }">
        <TNFileIcon v-bind="filterState(state)" :extension="state.extension" :size="state.size" />
      </template>
    </Variant>
    <Variant title="Файл" :init-state="() => ({ extension: 'ini' })">
      <template #default="{ state }">
        <TNFileIcon v-bind="filterState(state)" :extension="state.extension" :size="state.size" />
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import { filterState } from "../../../consts/consts";
</script>

<docs lang="md">
[Полная документация](../../icons/story/icons.story.md)

## Использование

```vue
<TNFileIcon extension="pdf" />
```

## Параметры

Основным и обязательным параметром компонента является `extension`,
который является расширением (без точки) целевого файла.

Поддерживаются следующие категории иконок файлов:

- Изображения
- Документы
- Таблицы
- Презентации
- Архивы
- PDF-файлы
- Видео
- Аудио
- Код
- Прочие

С помощью параметра `extended-extensions` можно расширить список расширений
для типов файлов:

```vue
<TNFileIcon extension="wow" :extended-extensions="{ pdf: ['wow'] }" />
```
</docs>
