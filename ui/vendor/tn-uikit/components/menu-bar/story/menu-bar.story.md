---
title: TNMenuBar/Doc
group: navigation
---

# TNMenuBar

## Описание

Компонент панели меню

## Использование

**Использование и вид можно посмотреть в [Playground](./menu-bar-playground.story.vue)**

```vue
<TNMenuBar :menu="menu" :current="currentMenu" @select="menuSelectHandler" />
```

Тип `ITNMenuItem`

```ts
interface ITNMenuItem {
  title: string;
  value: string;
  icon: IconNames;
  notification?: boolean | number;
}
```

### Индикатор уведомлений

Отображение индикатора с разными значениями полей.

```vue
<TNMenuBar
  :menu="menuOptions"
  :current="currentMenu"
  @select="menuSelectHandler"
/>
```

```js
const menuOptions: ITNMenuItem[] = [
  {
    title: "Главная",
    value: "index",
    icon: "applications-light",
    notification: false
  },
  {
    title: "Проекты",
    value: "projects",
    icon: "project",
    notification: true
  },
  {
    title: "Продукты",
    value: "products",
    icon: "product",
    notification: 10
  }
];
```

## Параметры (props)

| Название | Тип             | Обязательность | Комментарий            |
|----------|-----------------|----------------|------------------------|
| menu     | `ITNMenuItem[]` | &check;        | Элементы меню          |
| current  | `string`        | &check;        | Выбранный элемент меню |

## События (emits)

| Событие | Возвращаемые данные          | Комментарий                                 |
|---------|------------------------------|---------------------------------------------|
| select  | String (`ITNMenuItem.value`) | Событие вызывается при выборе элемента меню |

## Слоты

**Слотов нет**
