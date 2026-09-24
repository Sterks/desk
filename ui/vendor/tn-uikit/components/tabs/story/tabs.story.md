---
title: TNTabs/Doc
group: navigation
---

# TNTabs

## Использование

**Использование и вид можно посмотреть в [Playground](./tabs-playground.story.vue)**

Принимает в качестве списка доступных опций массив объектов с полями `id`
(для уникализации элемента) и `name` (для вывода в интерфейс), а
результатом вычисления хранит выбранный элемент как объект.

**[Посмотреть в Playground](./tabs-playground.story.vue?variantId=tabs)**

```js

import { TNTabsOption }
  from "@life_uikit/uikit";

const options: TNTabsOption[] = [
  {
    id: 1,
    name: "Label"
  },
  {
    id: 2,
    name: "Label 2"
  },
  {
    id: 3,
    name: "Label 3"
  },
  {
    id: 4,
    name: "Label 4"
  }
];
let currentOption: TNTabsOption = {
  id: 1,
  name: "Label"
};
```

```vue
<TNTabs v-model="currentOptionId" :options="options" />
```

### Параметр disabled

Параметр `disabled` отключает возможность выбора таба.

**[Посмотреть в Playground](./tabs-playground.story.vue?variantId=disabled)**

```vue
<TNTabs v-model="currentOptionId" :options="options" disabled />
```

### Размеры

Изменяется в зависимости от переданного параметра `md` | `lg` по умолчанию `md`.

**[Посмотреть в Playground](./tabs-playground.story.vue?variantId=large)**

### Стиль компонента

В компоненте есть возможность установить accent или soft стиль, используя параметр `type` с соответствующим значением

**[Посмотреть в Playground](./tabs-playground.story.vue?variantId=soft)**

```vue
<TNTabs v-model="currentOptionId" :options="options" type="soft" />
```

### Иконки

Элемент поддерживает набор иконок для отображения в табах.
Назначение иконки из набора происходит через параметр `icon` в объекте опций:

**[Посмотреть в Playground](./tabs-playground.story.vue?variantId=icons)**

```js
const optionsWithIcons: TNTabsOption[] = [
  {
    id: 1,
    name: "Label",
    icon: "star"
  },
  {
    id: 2,
    name: "Label 2",
    icon: "bell"
  },
  {
    id: 3,
    name: "Label 3",
    icon: "filter-1"
  },
  {
    id: 4,
    name: "Label 4",
    icon: "map"
  }
];
```

### Использование слотов

В компоненте есть 2 слота `beforeContent` и `afterContent` в которые можно разместить доп. контент до или после основного текста таба.  
Оба слота имеют props - `item (TNTabsOption)` - опция, `active` - активность данной опции

**[Посмотреть в Playground](./tabs-playground.story.vue?variantId=slots)**

```vue
<TNTabs v-model="currentOptionId" :options="options">
  <template #beforeContent="props">
    {{ props.item.id }}
  </template>
  <template #afterContent="props">
    <TNIcon v-if="props.active" name="check" />
  </template>
</TNTabs>
```

## Параметры (props)

| Название       | Тип                    | Обязательность                      | Комментарий                              |
|----------------|------------------------|-------------------------------------|------------------------------------------|
| options        | `TNTabsOption[]`       | &check;                             | Варианты выбора табов                    |
| modelValue     | `string \| number`     | &cross; (по-умолчанию: `0`)         | Значение value переменной для компонента |
| type           | `"soft" \| "accent"`   | &cross; (по-умолчанию: `undefined`) | Стиль компонента                         |
| disabled       | `boolean`              | &cross; (по-умолчанию: `false`)     | Выключение компонента                    |
| soft           | `boolean`              | &cross; (по-умолчанию: `false`)     | **НЕ ИСПОЛЬЗОВАТЬ** soft-стиль           |
| scrollIntoView | `boolean`              | &cross; (по-умолчанию: `false`)     | Функция скролла к табу                   |
| size           | `"sm" \| "md" \| "lg"` | &cross; (по-умолчанию: `"md"`)      | Размер компонента                        |

## События (emits)

| Событие           | Возвращаемые данные             | Комментарий                              |
|-------------------|---------------------------------|------------------------------------------|
| update:modelValue | modelValue (`string \| number`) | Событие вызывается обновлении modelValue |

## Слоты

| Слот          | Описание                    | Scoped Slot                                                                                    |
|---------------|-----------------------------|------------------------------------------------------------------------------------------------|
| beforeContent | Слот контента перед текстом | `item` - опция, тип данных: `TNTabsOption`; `active` - активность опции, тип данных: `boolean` |
| afterContent  | Слот контента после текста  | `item` - опция, тип данных: `TNTabsOption`; `active` - активность опции, тип данных: `boolean` |
