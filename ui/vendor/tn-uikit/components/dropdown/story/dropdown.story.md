---
title: TNDropdown/Doc
group: data
---

# TNDropdown

## Описание

Выпадающий список, который может быть отрисован как самостоятельно, так и вокруг какого-либо компонента

## Использование

**Использование и вид можно посмотреть в [Playground](./dropdown-playground.story.vue)**

**[Посмотреть в Playground](./dropdown-playground.story.vue?variantId=main)**

```vue
<TNDropdown
  :options="options"
  :is-visible="isShowDropdown"
  @select="selectHandler"
/>
```

Пример с вложенным списком:

**[Посмотреть в Playground](./dropdown-playground.story.vue?variantId=inside)**

```vue
<TNDropdown
  class="demo-dropdown"
  :is-visible="isShowDropdown"
  :options="options"
  collapse-by-click
  expand-by-click
  @click:outside="isShowDropdown = false"
  @select="selectHandler"
/>
```

### Кастомный класс

Имеется параметр `bottomSheetCustomClass` для задания кастомного класса ботомщита.

**[Посмотреть в Playground](./dropdown-playground.story.vue?variantId=custom)**

```vue
<TNDropdown
  :is-visible="isShowDropdownCustomClass"
  :options="optionsCustomClass"
  bottom-sheet-custom-class="bottomsheet-custom-class"
/>
```

### Мобильная версия

Точка перехода в мобильный вид настраивается глобально через опцию плагина
библиотеки `useLibraryOptions`.
Для назначения кастомного класса для окна мобильной версии используется
параметр `bottomSheetCustomClass` для задания кастомного класса ботомщита.

### Расположение

За расположение выпадающего меню и дочерних списков отвечают параметры `posiion`

```vue
<TNDropdown
  :is-visible="isShowDropDownPosition"
  :options="options"
  collapse-by-click
  expand-by-click
  position="top-left"
  @click:outside="isShowDropDownPosition = false"
  @select="selectHandler"
/>
```

## Параметры (props)

| Название               | Тип                                                   | Обязательность                                          | Комментарий                                                                                                                                                                 |
|------------------------|-------------------------------------------------------|---------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| options                | `ITNDropdownMenu[]`                                   | &check;                                                 | Массив элементов выпадающего меню                                                                                                                                           |
| expandByClick          | `boolean`                                             | &cross;                                                 | Раскрывать элементы меню при клике                                                                                                                                          |
| collapseByClick        | `boolean`                                             | &cross;                                                 | Сворачивать элементы меню при клике                                                                                                                                         |
| isVisible              | `boolean`                                             | &cross;                                                 | Показать выпадающее меню                                                                                                                                                    |
| mobileLeftIcon         | `boolean`                                             | &cross;                                                 | Отображать иконку с левой стороны в мобильном виде                                                                                                                          |
| bottomSheetCustomClass | `string`                                              | &cross;                                                 | Кастомный класс для **TNBottomSheet**                                                                                                                                       |
| position               | `Placement`                                           | &cross; (по-умолчанию: `"bottom-left"`)                 | Указать позицию всплывающего окна меню относительно триггер-элемента                                                                                                        |
| flip                   | `boolean`                                             | &cross;                                                 | Отображать всплывающее окно с другой стороны, если с нужной не хватает места. Например, если окно отображается сверху, то если сверху мало места, то будет отображено снизу |
| shift                  | `boolean`                                             | &cross;                                                 | Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана                                                                                                          |
| popperOptions          | `IPopoverOptions`                                     | &cross;                                                 | Опции для всплывающего окна                                                                                                                                                 |
| offset                 | `number \| { crossAxis?: number; mainAxis?: number }` | &cross; (по-умолчанию: `{ mainAxis: 8, crossAxis: 0 }`) | Настроить отступ всплывающего окна относительно триггер-элемента                                                                                                            |
| maxHeight              | `number`                                              | &cross;                                                 | Максимальная высота всплывающего окна меню (работает только в паре с `scrollableContent`)                                                                                   |
| scrollableContent      | `boolean`                                             | &cross;                                                 | Добавить возможность проскроллить контент при ограниченной высоте всплывающего окна                                                                                         |
| customClass            | `string`                                              | &cross;                                                 | Кастомный класс для Popover-элемента                                                                                                                                        |

## События (emits)

| Событие       | Возвращаемые данные                | Комментарий                                                                            |
|---------------|------------------------------------|----------------------------------------------------------------------------------------|
| select        | ID (`String`)                      | Срабатывает, когда выбран элемент выпадающего списка, возвращает идентификатор события |
| click:outside | $event (`MouseEvent \| undefined`) | Срабатывает при клике за пределами выпадающего списка                                  |

## Слоты

| Слот    | Описание          | Scoped Slot |
|---------|-------------------|-------------|
| default | Слот для триггера | —           |
