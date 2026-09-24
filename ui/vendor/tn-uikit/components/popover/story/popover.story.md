---
title: TNPopover/Doc
group: other
---

# TNPopover

## Описание

Представляет собой всплывающее окно, которое позиционируется вокруг какого-либо trigger-компонента.

## Использование

**Использование и вид можно посмотреть в [Playground](./popover-playground.story.vue)**

Для правильной работы требуется использовать слот `trigger` (какой-либо элемент, на который будет ориентироваться Popover) и `content` (для контента), а также параметр `visible`
Типом отображения можно управлять через параметр `trigger`. При `default` требуется значение для параметра `visible`, при `hover` нет

**[Посмотреть в Playground](./popover-playground.story.vue?variantId=default)**

```vue
<TNPopover :visible="visible" trigger="default">
  <template #trigger>
    <TNIcon 
      name="help" 
      @click="visible = !visible"
    />
  </template>
  <template #content>"Контент"</template>
</TNPopover>
```

### Отображение стрелки

Для всплывающего окна можно добавить стрелку и менять ее положение через (параметры `arrow`, `arrowPosition`).

**[Посмотреть в Playground](./popover-playground.story.vue?variantId=arrow-position)**

```vue
<TNPopover trigger="hover" arrow arrow-position="top-left">
  <template #trigger>
    <TNIcon 
      name="help"
    />
  </template>
  <template #content>"Контент"</template>
</TNPopover>
```

### Настройки отображения в пространстве

Компонентом предусмотрено управление отображением в пространстве.  
Например `position` указывает то, с какой стороны относительно trigger-элемента откроется всплывающее окно.  
Для управления отступом от trigger-элемента есть параметр `offset`, который принимает в себя число или объект `{ crossAxis?: number; mainAxis?: number }`.  
Если задать число, то управляется отступ по главной оси (X или Y в зависимости от того какая ось главная в вашем случае), если объект, то поле `mainAxis` отвечает за отступ по главной оси, а `crossAxis` за отступ по вспомогательной.

Описание объекта `UseFloatingOptions` для `popperOptions`

- `open` - не используется
- `placement` - аналог параметра `position`
- `strategy` - тип CSS свойства position для плавающего окна: `absolute` или `fixed` (по-умолчанию: 'absolute')
- `middleware` - массив [middleware объектов](https://floating-ui.com/docs/usefloating#middleware)
- `transform` - использовать ли свойство CSS `transform` для определения позиции окна вместо использования `top` и `left` (по-умолчанию: true)
- `whileElementsMounted` - коллбек функция, которая вызывается когда элемент открывается/закрывается (происходит mount Popover элемента)

**[Посмотреть в Playground](./popover-playground.story.vue?variantId=options)**

```vue
<TNPopover
  trigger="hover"
  position="top-right"
  :offset="{ mainAxis: 44, crossAxis: 20 }"
  :popper-options="{ strategy: 'fixed' }"
>
  <template #trigger>
    ...
  </template>
  <template #content>
    ...
  </template>
</TNPopover>
```

### Внешний вид

С помощью параметров можно корректировать и внешний вид, такие параметры как текст, ширина элемента, стиль темной темы, а также задать свой класс для анимации `<Transition>`

**[Посмотреть в Playground](./popover-playground.story.vue?variantId=appearance)**

```vue
<TNPopover
  text="Произвольный текст внутри элемента"
  width="300px"
  transition="my-custom-transition"
  dark-theme
  disabled-width
>
  <template #trigger>
    ...
  </template>
  <template #content>
    ...
  </template>
</TNPopover>
```

## Параметры (props)

| Название           | Тип                                                   | Обязательность                                          | Комментарий                                                                                                                                                                 |
|--------------------|-------------------------------------------------------|---------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| text               | `string`                                              | &cross;                                                 | Текст внутри компонента (если не задано наполнение для slot'a content)                                                                                                      |
| width              | `string`                                              | &cross; (по-умолчанию: `"200px"`)                       | Ширина контейнера компонента (обязательно указывать единицу измерения)                                                                                                      |
| position           | `ITNPopoverPosition`                                  | &cross; (по-умолчанию: `"bottom-left"`)                 | Позиционирование всплывающего окна (popper-элемента) относительно «триггер»-элемента                                                                                        |
| arrow              | `boolean`                                             | &cross;                                                 | Включить/отключить стрелку рядом с компонентом **(не работает без arrow-position)**                                                                                         |
| arrowPosition      | `ITNPopoverArrowPosition`                             | &cross;                                                 | Позиционирование стрелки **(не работает без arrow)**                                                                                                                        |
| offset             | `number \| { crossAxis?: number; mainAxis?: number }` | &cross; (по-умолчанию: `{ crossAxis: 0, mainAxis: 8 }`) | Настроить отступ всплывающего окна относительно триггер-элемента                                                                                                            |
| popperOptions      | `IPopoverOptions`                                     | &cross;                                                 | Опции для всплывающего окна (popper-элемента)                                                                                                                               |
| trigger            | `"default" \| "hover"`                                | &cross; (по-умолчанию: `"default"`)                     | Режим отображения компонента. **default - зависит от состояния параметра visible; hover - при наведении на trigger-элемент, не зависит от visible**                         |
| transition         | `string`                                              | &cross; (по-умолчанию: `"tn-fade"`)                     | Название используемой анимации                                                                                                                                              |
| darkTheme          | `boolean`                                             | &cross;                                                 | Включить/отключить стили темной темы для компонента                                                                                                                         |
| flip               | `boolean`                                             | &cross; (по-умолчанию: `true`)                          | Отображать всплывающее окно с другой стороны, если с нужной не хватает места. Например, если окно отображается сверху, то если сверху мало места, то будет отображено снизу |
| visible            | `boolean`                                             | &cross;                                                 | Управление видимостью компонента                                                                                                                                            |
| inline             | `boolean`                                             | &cross; (по-умолчанию: `true`)                          | Добавить/убрать `display: inline-block` для элемента-обертки trigger-элемента                                                                                               |
| shift              | `boolean`                                             | &cross;                                                 | Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана                                                                                                          |
| windowStyled       | `boolean`                                             | &cross; (по-умолчанию: `true`)                          | Добавить класс `tn-popover__wrapper-inner` контейнеру контента                                                                                                              |
| floating           | `boolean`                                             | &cross; (по-умолчанию: `true`)                          | Добавление функционала плавающего компонента (реагирует на оставшееся место под контент, если места мало, то отрисовывает с другой стороны)                                 |
| disabledWidth      | `boolean`                                             | &cross;                                                 | Отключение расчета ширины в inline-стиле (требуется для ручной настройки ширины через CSS)                                                                                  |
| wrapperCustomClass | `string`                                              | &cross;                                                 | Кастомный класс для wrapper-элемента                                                                                                                                        |

## События (emits)

**Событий нет**  
Можно отследить `mount` элемента через добавление коллбек-функции в объект `UseFloatingOptions`

**[Посмотреть в Playground](./popover-playground.story.vue?variantId=emits)**

```ts
const callbackFn = () => {
  console.log("Событие отработало");
};
```

```vue
<TNPopover
  :popper-options="{
    whileElementsMounted: callbackFn
  }"
>
  <template #trigger>
    ...
  </template>
  <template #content>
    ...
  </template>
</TNPopover>
```

## Слоты

| Слот    | Описание                                                                  | Scoped Slot |
|---------|---------------------------------------------------------------------------|-------------|
| trigger | Слот для trigger-элемента, вокруг которого будет отрисовываться компонент | –           |
| content | Слот для контента                                                         | –           |
