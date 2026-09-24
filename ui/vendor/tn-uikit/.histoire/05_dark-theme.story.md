---
group: 'top'
title: '5. Тёмная тема'
icon: 'carbon:bookmark'
---
# Тёмная тема

Все компоненты и цвета рассчитаны на применение тёмной цветовой схемы. Для этого используется переключение класса `tn-dark-theme`.

Для применения тёмной цветовой схемы необходимо импортировать css-файл с тёмной цветовой палитрой:

```js
import "@life_uikit/uikit/variables-dark.css";
```

Для переключения можно использовать функцию `setDarkTheme`:

```js
import { setDarkTheme } from "@life_uikit/uikit";

// Задать тёмную цветовую схему
setDarkTheme("dark");

// Задать светлую цветовую схему
setDarkTheme("light");
```

## Интеграция с цветовой схемой TN Life

Для интеграции тёмной темы, что применена в TN Life, необходимо:

### 1. Обновить UI Kit

Необходимо установить версию [TN Life UI Kit](https://gitlab.tn.ru/superapp/superapp/tn-uikit/uikit) версии 6.3.0 и выше

### 2. Обновить Bridge

Необходимо установить версию [TN Life Bridge](https://gitlab.tn.ru/superapp/miniapp-template/tn-bridge) версии 2.1.0 и выше

### 3. Применять цветовую схему при инициализации

При вызове метода `LifeMiniAppInit` Bridge в ответе применять значение `data.colorScheme` для применения цветовой схемы, отправляя это значение в функцию UI Kit `setDarkTheme`:

```js
import { setDarkTheme } from "@life_uikit/uikit";
import LifeBridge from "@tnlife/tn-bridge";

const initResponse = await LifeBridge.send("LifeMiniAppInit");
setDarkTheme(initResponse.data.colorScheme);
```

### 4. Добавить обработчик события смены цветовой схемы в TN Life

При самом запуске приложения также следует добавить обработчик события Bridge `colorSchemeUpdated` смены цветовой схемы во время отображения мини-приложения.

Для этого достаточно вызвать метод Bridge `addEventListener`, первым аргументом передать в него название события `"colorSchemeUpdated"`, а вторым - функцию `setDarkTheme` из UI Kit.

```js
import { setDarkTheme } from "@life_uikit/uikit";
import LifeBridge from "@tnlife/tn-bridge";

LifeBridge.addEventListener("colorSchemeUpdated", setDarkTheme);
```
