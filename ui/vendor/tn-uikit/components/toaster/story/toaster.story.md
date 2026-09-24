---
title: TNToaster/Doc
group: data
---

# TNToaster

## Описание

Представляет собой небольшое модальное окно с произвольной информацией и таймером закрытия (в зависимости от параметров появляется справа сверху или снизу)

## Использование

**Использование и вид можно посмотреть в [Playground](./toaster-usage.story.vue)**

Функция добавления тостера

```ts
import { ITNToast } from "@life_uikit/uikit";

const toastArr: ITNToast[] = [];

const closeToast = (toast: ITNToast) => {
  const index = toasts.value.findIndex(
    t => t.creationTime === toast.creationTime
  );
  if (index > -1) {
    toasts.value.splice(index, 1);
  }
};

const openToast = () => {
  const toast: ITNToast = {
    text: "Успешно",
    duration: 3000,
    type: "success",
    creationTime: new Date().getTime()
  };
  toasts.value.push(toast);
};
```

```vue

<TNButton @click="openToast">
  Открыть успешный toast
</TNButton>

<TNToaster :toast-list="toastArr" @closeToast="closeToast" />
```

### Toaster type

Для использования доступно 4 типа отображаемых уведомлений:
`info`, `warn`, `error`, `success`

### Toast с коллбеком

Toast в качестве параметра способен принимать коллбек `timeOutCallback`,
который вызывается при окончании таймера, `canceledCallback`,
который вызывается при нажатии кнопки "Отменить" и `onClick`, который вызывается при простом клике на `toast`.

### useToaster

`useToaster` подходит для сценариев, где не хочется вручную хранить список `toast`-уведомлений и рендерить `TNToaster` в шаблоне. Composable сам создаёт контейнер и возвращает функцию показа уведомления.

Базовый пример:

```ts
import { useToaster } from "@life_uikit/uikit";

const showToast = useToaster();

showToast("Данные сохранены", {
  toast: {
    type: "success",
    duration: 3000
  }
});
```

Пример с несколькими вариантами ответа через callbacks:

```ts
const showToast = useToaster();

showToast("Сохранить изменения?", {
  toast: {
    type: "warn",
    duration: 5000,
    cancelButtonText: "Отменить",
    onClick: () => {
      console.log("Пользователь подтвердил действие");
    },
    canceledCallback: () => {
      console.log("Пользователь отменил действие");
    },
    timeOutCallback: () => {
      console.log("Пользователь не ответил вовремя");
    }
  }
});
```

Пример с передачей компонента в `text`:

```ts
import { createVNode } from "vue";
import { useToaster, TNLink } from "@life_uikit/uikit";

const showToast = useToaster();

showToast(
  h("span", null, [
    "Подробнее в ",
    h(TNButton, { href: "/docs", target: "_blank", size: "sm", link: true }, () => "документации")
  ]),
  {
    toast: {
      type: "info",
      duration: 4000
    }
  }
);
```

Если уведомление нужно показывать не в `document.body`, можно передать контейнер первым параметром:

```ts
const showToast = useToaster(element);
```
## Параметры (props)

| Название  | Тип          | Обязательность               | Комментарий                   |
|-----------|--------------|------------------------------|-------------------------------|
| toastList | `ITNToast[]` | &cross; (по-умолчанию: `[]`) | Список тостов                 |
| bottom    | `boolean`    | &cross;                      | Размещение тоста снизу экрана |

## События (emits)

| Событие    | Возвращаемые данные | Комментарий                           |
|------------|---------------------|---------------------------------------|
| closeToast | toast (`ITNToast`)  | Событие вызывается при закрытии тоста |

## Слоты

**Слотов нет**
