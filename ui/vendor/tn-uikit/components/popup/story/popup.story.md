---
title: TNPopup/Doc
group: data
---

# TNPopup

## Описание

Представляет собой модальное окно с оверлеем.

## Использование

**Использование и вид можно посмотреть в [Playground](./popup-playground.story.vue)**

Важным параметром является `isVisible`, отвечащий за отображение попапа.  
Наполнение задается между открывающим и закрывающим тегами.

**[Посмотреть в Playground](./popup-playground.story.vue?variantId=main)**

```vue
<TNPopup
  :is-visible="isVisible"
  title="Название строки"
  subtitle="Строка"
  :max-mobile-width="884"
  :buttons="buttons"
  :buttons-position="buttonPosition"
  back
  @back="goBack"
  @close="close"
>
  ...
</TNPopup>
```

```ts
const buttons: ITNFloatingButton[] = [
  {
    title: "Применить"
  },
  {
    title: "Отменить",
    props: {
      loading: true
    }
  }
];

const buttonsPosition: ITNFloatingPosition = {
  mobile: "vertical"
};
```

### Размеры

Есть два размера попапа, которые регулируются пропом `size`:

- `sm` - ширина 520px
- `md` - 900px, по умолчанию

### Слоты

Для релизации кастомных шапки и футера имеются именованные
слоты `header` и `footer`

**[Посмотреть в Playground](./popup-playground.story.vue?variantId=slot)**

```vue
<TNPopup>
  <template #header>...</template>
  ...
  <template #footer>...</template>
</TNPopup>
```

### Без хедера и футера

Футер и хедер - необязательны. Хедер скрывается в декстопе - при отсутствии
заголовков `title`, `subtitle` и соответствующего слота.

Отображение кнопок перехода назад и закрытия не относятся к хедеру и
регулируются пропами `back` и `closable` соответственно.

## Параметры (props)

| Название              | Тип                   | Обязательность                  | Комментарий                                     |
|-----------------------|-----------------------|---------------------------------|-------------------------------------------------|
| title                 | `string`              | &cross;                         | Заголовок для попапа                            |
| subtitle              | `string`              | &cross;                         | Подзаголовок для попапа                         |
| size                  | `"sm" \| "md"`        | &cross; (по-умолчанию: `"md"`)  | Размер попапа                                   |
| buttons               | `ITNFloatingButton[]` | &cross;                         | Массив кнопок для попапа                        |
| buttonsPosition       | `ITNFloatingPosition` | &cross;                         | Позиция кнопок                                  |
| back                  | `boolean`             | &cross;                         | Отображение кнопки "назад"                      |
| closable              | `boolean`             | &cross; (по-умолчанию: `true`)  | Отображение кнопки "закрыть"                    |
| maxMobileWidth        | `string \| number`    | &cross; (по-умолчанию: `768`)   | Максимальная ширина в мобильном разрешении в px |
| isVisible             | `boolean`             | &check;                         | Видимость попапа                                |
| zIndex                | `string \| number`    | &cross; (по-умолчанию: `10003`) | Величина z-index                                |
| customClass           | `string`              | &cross; (по-умолчанию: `""`)    | Кастомный класс для контейнера попапа           |
| disabled              | `ITNPopupDisabled`    | &cross; (по-умолчанию: `{}`)    | Отключение слотов попапа                        |
| transparentBackground | `boolean`             | &cross; (по-умолчанию: `false`) | Убирает затемнение вокруг компонентa            |

## События (emits)

| Событие     | Возвращаемые данные                 | Комментарий                                                              |
|-------------|-------------------------------------|--------------------------------------------------------------------------|
| close       | event (`TouchEvent  \| MouseEvent`) | Срабатывает при клике на кнопку закрытия                                 |
| back        | -                                   | Срабатывает при клике на кнопку назад                                    |
| after-leave | -                                   | Срабатывает после завершения leave-анимации, когда попап полностью скрыт |
| scroll      | event (`Event`)                     | Событие вызывается при скролле                                           |

## Слоты

| Слот    | Описание                   | Scoped Slot |
|---------|----------------------------|-------------|
| header  | Слот для кастомного хедера | –           |
| default | Слот для контента          | –           |
| footer  | Слот для кастомного футера | –           |
