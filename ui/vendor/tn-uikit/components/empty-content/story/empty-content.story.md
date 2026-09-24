---
title: TNEmptyContent/Doc
group: data
---

# TNEmptyContent

## Описание

Представляет собой компонент-заглушку. Используется при ошибках/пустых данных.

## Использование

**Использование и вид можно посмотреть в [Playground](./empty-content-playground.story.vue)**

### Заголовок и описание

Заголовок и описание задаются параметрами `title` и `text` соответственно.

**[Посмотреть в Playground](./empty-content-playground.story.vue?variantId=main)**

```vue
<TNEmptyContent title="Большая ошибка" text="Описание большой ошибки" />
```

### Стилизация

Компонент имеет функционал перекрашивания своего главного контейнера, для этого используется параметр `type`.  
Принимаемые значения: `light` - белый цвет (`--content-primary-b-enabled`), `neutral` - светло-серый (`--background-secondary-a-enabled`), `transparent` - прозрачный

**[Посмотреть в Playground](./empty-content-playground.story.vue?variantId=style)**

```vue
<TNEmptyContent type="neutral" title="Ошибка с серым фоном" />
```

### Выбор иконки

В компоненте предусмотрено использование иконки, можно поставить как встроенные, так и модифицированные.  
Встроенные:
- `empty-list` - иконка для отображения пустого списка;
- `empty-alert` - иконка для отображения ошибки;
- `empty-chat"` - иконка для отображения пустого чата;
- `no-connection"` - иконка для отображения отсутствия соединения;
- `not-found"` - иконка для отображения пустого поиска;
- `no-access"` - иконка для отображения отсутствия доступа;

**[Посмотреть в Playground](./empty-content-playground.story.vue?variantId=icon)**

```vue
<TNEmptyContent icon="empty-alert" />
```

Для модифицированной иконки используется слот.

**[Посмотреть в Playground](./empty-content-playground.story.vue?variantId=icon-slot)**

```vue
<TNEmptyContent>
  <template #icon>
    <TNIcon name="warning-filled" />
  </template>
</TNEmptyContent>
```

### Кнопки

Также можно добавить кнопки использовав параметр `buttons`.

**[Посмотреть в Playground](empty-content-playground.story.vue?variantId=button)**

```ts
const buttons: ITNFloatingButton[] = [
  {
    title: "Красная кнопка",
    click: () => {
      alert("Красная кнопка");
    }
  },
  {
    title: "Серая кнопка",
    click: () => {
      alert("Серая кнопка");
    },
    props: {
      secondary: true
    }
  }
];
```

```vue
<TNEmptyContent :buttons="buttons" />
```

Или использовать слот и передать произвольный компонент вместо встроенных кнопок

**[Посмотреть в Playground](empty-content-playground.story.vue?variantId=slot)**

```vue
<TNEmptyContent>
  <template #buttons>
    <div class="custom-buttons">
      <TNButton>Первая кнопка</TNButton>
      <div class="something-else">...</div>
      <TNButton>Вторая кнопка</TNButton>
    </div>
  </template>
</TNEmptyContent>
```

## Параметры (props)

| Название | Тип                                                                                              | Обязательность                          | Комментарий                                                           |
|----------|--------------------------------------------------------------------------------------------------|-----------------------------------------|-----------------------------------------------------------------------|
| type     | `"light" \| "neutral" \| "transparent"`                                                          | &cross; (по-умолчанию: `"transparent"`) | Тип оформления компонента (перекрашивается **background** контейнера) |
| icon     | `"empty-list" \| "empty-alert" \| "empty-chat" \| "no-connection" \| "not-found" \| "no-access"` | &cross; (по-умолчанию: `"empty-alert"`) | Используемая иконка                                                   |
| title    | `string`                                                                                         | &cross;                                 | Заглавный текст                                                       |
| text     | `string`                                                                                         | &cross;                                 | Уточняющий текст                                                      |
| buttons  | `ITNFloatingButton[]`                                                                            | &cross; (по-умолчанию: `[]`)            | Массив кнопок                                                         |

## События (emits)

**Событий нет**

## Слоты

| Слот    | Описание               | Scoped Slot |
|---------|------------------------|-------------|
| icon    | Слот для кастом иконки | —           |
| buttons | Слот для кастом кнопок | —           |
