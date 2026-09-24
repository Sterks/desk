---
title: TNFloatingButtons/Doc
group: form
---

# TNFloatingButtons

## Описание

Представляет собой контейнер с кнопками, чаще всего используется внутри других компонентов

## Использование

**Использование и вид можно посмотреть в [Playground](./floating-buttons-playground.story.vue)**

Главным параметром является `buttons` - отвечающий за отрисовку кнопок (принимает массив объектов-описания кнопок)

```ts
const buttons: ITNFloatingButton[] = [
  {
    title: "Кнопка номер 1",
    click: () => {
      ...
    }
  },
  {
    title: "Кнопка номер 2",
    click: buttonTwoHandler,
    props: {
      secondary: true
    }
  }
];
```

```vue
<TNFloatingButtons :buttons="buttons" />
```

Оставшиеся параметры можно посмотреть в разделе [Параметры](#параметры-props)

```vue
<TNFloatingButtons
  :buttons="buttons"
  add-shadow
  border-radius="24"
  :disabled="isButtonsDisabled"
/>
```

## Параметры (props)

| Название       | Тип                   | Обязательность                         | Комментарий                                          |
|----------------|-----------------------|----------------------------------------|------------------------------------------------------|
| buttons        | `ITNFloatingButton[]` | &check;                                | Массив с кнопками                                    |
| addShadow      | `boolean`             | &cross;                                | Добавить тень родительскому контейнеру с кнопками    |
| maxMobileWidth | `number`              | &cross; (по-умолчанию: `768`)          | Максимальная ширина мобильного разрешения в пикселях |
| position       | `ITNFloatingPosition` | &cross; (по-умолчанию: `"horizontal"`) | Расположение кнопок - вертикально/горизонтально      |
| borderRadius   | `string \| number`    | &cross; (по-умолчанию: `16`)           | Радиус скругления углов в пикселях                   |
| disabled       | `boolean`             | &cross;                                | Отключение кнопок                                    |

## События (emits)

**Событий нет**

## Слоты

**Слотов нет**
