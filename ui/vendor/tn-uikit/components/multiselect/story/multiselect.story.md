---
title: TNMultiSelector/Doc
group: form
---

# TNMultiSelector

## Описание

Представляет собой компонент, внешне похожий на TNSelector, но здесь можно выбрать несколько элементов и они будут отображены как "чипсы".

## Использование

**Использование и вид можно посмотреть в [Playground](./multiselect-playground.story.vue)**

**Описание параметров, событий и слотов можно посмотреть [внизу страницы](#параметры-props)**

Для работы селектора нужны важные параметры:

- `modelValue` - значение
- `options` - опции для выбора

Опции задаются следующим образом:

**[Посмотреть в Playground](./multiselect-playground.story.vue?variantId=main)**

```ts
const options: TNTreeProps.Option[] = [
  {
    id: 0,
    deep: 0,
    title: "Option 1",
    isCheck: false
  },
  {
    id: 1,
    deep: 0,
    title: "Option 2",
    isCheck: false
  },
  {
    id: 2,
    deep: 0,
    title: "Option 3",
    isCheck: false
  }
];
```

```vue
<TNMultiSelector v-model="modelValue" :options="options" />
```

### Информативные параметры

**В компоненте можно указать сопутствующую информацию, которая может помочь пользователю:** заголовок, описание, плейсхолдеры, подсказки, тексты ошибок

**[Посмотреть в Playground](./multiselect-playground.story.vue?variantId=info-param)**

```vue
<TNMultiSelector
  v-model="modelValue"
  :options="options"
  label="Заголовок компонента"
  description="Описание компонента"
  placeholder="Плейсхолдер при пустом выборе"
  :searchable="isSearchMode"
  search-placeholder="Плейсхолдер при пустом поле поиска (если поле поиска включено)"
  search-error="Выводимый текст при ошибке поиска"
  warn="Текст предупреждения"
  error="Текст ошибки"
  success="Текст успеха"
  emptyListHint="Подсказка, которая будет видна при пустом списке опций"
/>
```

### Внешний вид

**Внешне компонент можно изменять по следующим параметрам:** размер, обязательность, отключение компонента, указание заголовков в "чипсе" селектора, различные настройки всплывающего (popper) элемента

**[Посмотреть в Playground](./multiselect-playground.story.vue?variantId=appearance)**

```vue
<TNMultiSelector
  v-model="modelValue"
  :options="options"
  size="s"
  :disabled="isDisabled"
  required
  :flip="false"
  shift
  position="left-top"
  :popper-options="{
    strategy: 'fixed'
  }"
  :is-loading="isLoading"
/>
```

### Использование слотов

`Слоты` используются следующим образом

**[Посмотреть в Playground](./multiselect-playground.story.vue?variantId=slot)**

```vue
<TNMultiSelector v-model="modelValue" :options="options">
  <template #description>
    <span>Новое описание</span>
  </template>
  <template #value>
    <div>Новый компонент для отображения выделенных опций</div>
  </template>
  <template #items>
    <div>Новый компонент для отображения опций в списке</div>
  </template>
</TNMultiSelector>
```

## Параметры (props)

| Название               | Тип                    | Обязательность                          | Комментарий                                                                                                                                                                 |
|------------------------|------------------------|-----------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| size                   | `"s" \| "m"`           | &cross; (по-умолчанию: `"m"`)           | Размер компонента                                                                                                                                                           |
| searchError            | `string`               | &cross; (по-умолчанию: `""`)            | Текст ошибки поиска                                                                                                                                                         |
| searchable             | `boolean`              | &cross;                                 | Включение поисковой строки                                                                                                                                                  |
| searchPlaceholder      | `string`               | &cross; (по-умолчанию: `"Искать"`)      | Placeholder для поисковой строки                                                                                                                                            |
| placeholder            | `string`               | &cross; (по-умолчанию: `""`)            | Placeholder для поля компонента                                                                                                                                             |
| disabled               | `boolean`              | &cross;                                 | Отключение компонента                                                                                                                                                       |
| clearable              | `boolean`              | &cross; (по-умолчанию: `true`)          | Функционал очистки содержимого по кнопке                                                                                                                                    |
| label                  | `string`               | &cross; (по-умолчанию: `""`)            | Текст для заголовка компонента                                                                                                                                              |
| description            | `string`               | &cross; (по-умолчанию: `""`)            | Текст для описания компонента                                                                                                                                               |
| searchQuery            | `string`               | &cross; (по-умолчанию: `""`)            | Текст из поисковой строки                                                                                                                                                   |
| options                | `TNTreeProps.Option[]` | &cross; (по-умолчанию: `[]`)            | Массив опций для селектора                                                                                                                                                  |
| modelValue             | `(string \| number)[]` | &cross; (по-умолчанию: `[]`)            | Значение value переменной для компонента                                                                                                                                    |
| isLoading              | `boolean`              | &cross;                                 | Состояние загрузки компонента                                                                                                                                               |
| required               | `boolean`              | &cross;                                 | Выводит звездочку после заголовка компонента - лейбла                                                                                                                       |
| error                  | `string`               | &cross;                                 | Текст ошибки (включает «error» стиль у компонента)                                                                                                                          |
| warn                   | `string`               | &cross;                                 | Текст предупреждения (включает «warning» стиль у компонента)                                                                                                                |
| success                | `string`               | &cross;                                 | Текст успеха (включает «success» стиль у компонента)                                                                                                                        |
| teleportTo             | `string`               | &cross; (по-умолчанию: `"main"`)        | Силами teleport Vue вставляет компонент в нужный контейнер DOM-дерева                                                                                                       |
| isMobileMiniApp        | `boolean`              | &cross;                                 | Передача одноименного параметра для боттом-щита                                                                                                                             |
| flat                   | `boolean`              | &cross;                                 | Отображает одноуровневый список без вложенности                                                                                                                             |
| emptyListHint          | `string`               | &cross;                                 | Подсказка для пустого списка опций выбора                                                                                                                                   |
| bottomSheetCustomClass | `string`               | &cross; (по-умолчанию: `""`)            | Кастомный класс для компонента **TNBottomSheet**                                                                                                                            |
| scrollSelectedIntoView | `boolean`              | &cross;                                 | Включение функционала скролла к выбранным опциям                                                                                                                            |
| position               | `Placement`            | &cross; (по-умолчанию: `"bottom-left"`) | Позиционирование всплывающего окна (popper-элемента) относительно «триггер»-элемента                                                                                        |
| flip                   | `boolean`              | &cross; (по-умолчанию: `true`)          | Отображать всплывающее окно с другой стороны, если с нужной не хватает места. Например, если окно отображается сверху, то если сверху мало места, то будет отображено снизу |
| shift                  | `boolean`              | &cross;                                 | Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана                                                                                                          |
| popperOptions          | `IPopoverOptions`      | &cross;                                 | Опции для всплывающего окна (popper-элемента)                                                                                                                               |
| smoothMessage          | `boolean`              | &cross;                                 | Добавляет мягкую анимацию для появления текста ошибки/предупреждения/успеха (при этом добавляет отступ снизу компонента)                                                    |
| searchFocus            | `boolean`              | &cross;                                 | Установить фокус на поле ввода при открытии селектора (при включенном `searchable`)                                                                                         |
| chipsUnderWrapper      | `boolean`              | &cross;                                 | Отрисовывает выбранные чипсины под компонентом                                                                                                                              |

## События (emits)

| Событие           | Возвращаемые данные                | Комментарий                                         |
|-------------------|------------------------------------|-----------------------------------------------------|
| update:modelValue | modelValue(`(string \| number)[]`) | Событие вызывается при обновлении modelValue        |
| open              | -                                  | Событие вызывается при открытии селектора           |
| close             | -                                  | Событие вызывается при закрытии селектора           |
| searchHandler     | query (`string`)                   | Событие вызывается при вводе текста в строку поиска |
| iconButtonClick   | iconId (`string \| number`)        | Событие вызывается при нажатии на иконку            |

## Слоты

| Слот        | Описание                                            | Scoped Slot                                                                                                                       |
|-------------|-----------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| header      | Слот для кастомного header'a                        | –                                                                                                                                 |
| label       | Слот для кастомного заголовка компонента            | –                                                                                                                                 |
| description | Слот для кастомного описания компонента             | –                                                                                                                                 |
| value       | Слот для кастомного отображения выбранного элемента | `option` - выбранная опция из селектора, тип данных: `TNTreeProps.Option`; `isSelected` - выбрана ли опция, тип данных: `Boolean` |
| items       | Слот для кастомного отображения селектора           | `option` - опция из селектора, тип данных: `TNTreeProps.Option`; `isSelected` - выбрана ли опция, тип данных: `Boolean`           |
| footer      | Слот для кастомного footer'a                        | –                                                                                                                                 |
