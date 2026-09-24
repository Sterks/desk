---
title: TNCheckbox/Doc
group: form
---

# TNCheckbox

## Описание

Представляет собой checkbox и label.

## Использование

**Использование и вид можно посмотреть в [Playground](./checkbox-playground.story.vue)**

```vue
<TNCheckbox v-model="isCheckboxActive" label="Заголовок" />
<TNCheckbox
  v-model="isCheckboxActive"
  label="Заголовок"
  description="Описание"
  error="Текст ошибки"
  disabled
/>
```

## Параметры (props)

| Название    | Тип       | Обязательность | Комментарий                    |
|-------------|-----------|----------------|--------------------------------|
| label       | `string`  | &cross;        | Текст для заголовка компонента |
| description | `string`  | &cross;        | Текст для описания компонента  |
| modelValue  | `boolean` | &cross;        | Значение для чекбокса          |
| disabled    | `boolean` | &cross;        | Отключение чекбокса            |
| error       | `string`  | &cross;        | Текст для ошибки               |
| warn        | `string`  | &cross;        | Текст для предупреждения       |

## События (emits)

| Событие           | Возвращаемые данные | Комментарий                                           |
|-------------------|---------------------|-------------------------------------------------------|
| update:modelValue | `boolean`           | Событие вызывается при изменении параметра modelValue |

## Слоты

| Слот  | Описание       | Scoped Slot |
|-------|----------------|-------------|
| label | Слот для label | —           |
