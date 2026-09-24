---
title: Transitions/Doc
group: other
---

# TransitionCollapse

## Описание

Представляет собой компонент **<Transition>**, позволяющий добавить плавную анимацию "сплющивания" при скрытии компонента через v-if.

**Использование и вид можно посмотреть в [Playground](./transitions-playground.story.vue)**

## Импорт

Компонент не устанавливается глобально при инициализации плагина. Его необходимо импортировать отдельно:

```ts
import { TransitionCollapse } from "@life_uikit/uikit";
```

## Тег

```vue
<TransitionCollapse></TransitionCollapse>
```

## Использование

```vue
<TransitionCollapse>
  <div v-if="!isCollapsed">
    ...
  </div>
</TransitionCollapse>
```

## Параметры (props)

**параметров нет**

## События (emits)

**Событий нет**

## Слоты

| Слот    | Описание          | Scoped Slot |
|---------|-------------------|-------------|
| default | Слот для контента | —           |
