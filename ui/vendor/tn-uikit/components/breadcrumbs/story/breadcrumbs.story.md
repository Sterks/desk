---
title: TNBreadcrumbs/Doc
group: navigation
---

# TNBreadcrumbs

## Описание

Компонент "хлебные крошки". Показывает путь навигации в виде **Home > Section > Page**

## Использование

**Использование и вид можно посмотреть в [Playground](./breadcrumbs-playground.story.vue)**

```ts
// (Пример prop'a links)

const breadCrumbsList: BreadcrumbsItem[] = [
  {
    to: { name: "HomePage" },
    text: "UIKit"
  },
  {
    text: "Элементы"
  },
  {
    text: "Хлебные крошки"
  }
];
```

```vue
<TNBreadcrumbs :links="breadCrumbsList" />
```

## Параметры (props)

| Название | Тип                 | Обязательность                  | Комментарий                            |
|----------|---------------------|---------------------------------|----------------------------------------|
| links    | `BreadcrumbsItem[]` | &cross; (по-умолчанию: `[]`)    | Список ссылок для навигации            |
| root     | `string`            | &cross; (по-умолчанию: `'/'`)   | Ссылка корневого роута (иконка "home") |
| norouter | `boolean`           | &cross; (по-умолчанию: `false`) | Делает корневой роут ссылкой           |
| home     | `boolean`           | &cross; (по-умолчанию: `true`)  | Отображение ссылки Домой               |

## События (emits)

**Событий нет**

## Слоты

**Слотов нет**
