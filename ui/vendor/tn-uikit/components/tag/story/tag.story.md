---
title: TNTag/Doc
group: data
---

# TNTag

## Использование

**Использование и вид можно посмотреть в [Playground](./tag-playground.story.vue)**

Чтобы написать текст необходимо воспользоваться параметром `text` или написать текст внутри тегов.

**[Посмотреть в Playground](./tag-playground.story.vue?variantId=main)**

```vue
<TNTag text="Тег" />
<TNTag>Тег</TNTag>
```

### Иконки

Элемент поддерживает набор иконок Назначение иконки из набора происходит через
параметр `icon` для иконки слева или `rightIcon` для иконки справа:

**[Посмотреть в Playground](./tag-playground.story.vue?variantId=icon)**

```vue
<TNTag icon="star">Внесено</TNTag>
<TNTag right-icon="check">Отмечено</TNTag>
```

Цвет иконки можно задать с помощью параметра `iconColor` и `rightIconColor`:

**[Посмотреть в Playground](./tag-playground.story.vue?variantId=color)**

```vue
<TNTag icon="star" iconColor="red">
  Внесено
</TNTag>
```

### Disabled

Параметр `disabled` отвечает за отключение тега.

### Кликабельность

Параметр `interactive` отвечает за реакцию на наведение курсора и клик:

**[Посмотреть в Playground](./tag-playground.story.vue?variantId=interactive)**

```vue
<TNTag icon="star" interactive>
  Внесено
</TNTag>
```

## Параметры (props)

| Название       | Тип         | Обязательность                                               | Комментарий                                    |
|----------------|-------------|--------------------------------------------------------------|------------------------------------------------|
| text           | `string`    | &cross; (по-умолчанию: `""`)                                 | Текст внутри тега                              |
| icon           | `IconNames` | &cross;                                                      | Иконка тега слева                              |
| iconColor      | `string`    | &cross; (по-умолчанию: `"var(--content-secondary-enabled)"`) | Цвет иконки слева                              |
| rightIcon      | `IconNames` | &cross;                                                      | Иконка тега справа                             |
| rightIconColor | `string`    | &cross; (по-умолчанию: `"var(--content-secondary-enabled)"`) | Цвет иконки справа                             |
| inline         | `boolean`   | &cross; (по-умолчанию: `false`)                              | Добавляет стиль `display: inline-block`        |
| interactive    | `boolean`   | &cross; (по-умолчанию: `false`)                              | Добавляет стили для отображение кликабельности |
| disabled       | `boolean`   | &cross; (по-умолчанию: `false`)                              | Отключение тега                                |

## События (emits)

**Событий нет**

## Слоты

| Слот    | Описание          | Scoped Slot |
|---------|-------------------|-------------|
| default | Слот для контента | —           |
