# TN Life UI Kit

TN Life UI Kit - это инструмент для создания систем дизайна пользовательского интерфейса с помощью Vue.js. Он предоставляет вам набор организованных инструментов, шаблонов и практик, которые служат основой для разработки вашего приложения.

## Установка

В первую очередь необходимо наличие в `.npmrc` файле информации по данному пакету:

`.npmrc`:
```
@life_uikit:registry=https://gitlab.tn.ru/api/v4/projects/744/packages/npm/
//gitlab.tn.ru/api/v4/projects/744/packages/npm/:_authToken=AUTHTOKEN
```

Где `AUTHTOKEN` - Ваш токен Gitlab.

Установка производится при помощи команды:

```shell
npm install @life_uikit/uikit
```

## Использование

Пакет используется как плагин, который добавляет глобальные компоненты:

```ts
import TNLifeUIKit from "@life_uikit/uikit";

const app = createApp(App);

app.use(TNLifeUIKit);
```

```html
<TNButton size="sm">Применить</TNButton>
```

Также в пакете есть два css-файла стилей:
- с css-переменными `variables.css"`:

```js
import "@life_uikit/uikit/variables.css";
```

- с шрифтами `fonts.css`:

```js
import "@life_uikit/uikit/fonts.css";
```

В `fonts.css` подключён `Inter` — вариативный, любой вес от 100 до 900.

Шрифт задаётся токенами `--font-family-heading` (заголовки) и `--font-family-body` (остальной текст), сменить его можно переопределив эти css-переменные:

```css
:root {
  --font-family-heading: "Segoe UI", Roboto, sans-serif;
  --font-family-body: "Segoe UI", Roboto, sans-serif;
}
```

Компоненты библиотеки сами проставляют себе нужный `font-family`, но на `body` вашего проекта его стоит задать явно через переменную — иначе весь текст вне компонентов uikit (и системный fallback браузера) не будет использовать `Inter`.

Размеры и line-height в токенах заданы в `rem` из расчёта `1rem = 15px`, а не привычных `16px`. `rem` считается от корневого элемента (`html`/`:root`), а не от `body`, поэтому базовый размер нужно задать именно там:

```css
html {
  font-size: 15px;
}

body {
  font-family: var(--font-family-body);
}
```

Полную инструкцию по переносу типографики проекта на токены можно посмотреть в [`migration-Inter-font.md`](./migration-Inter-font.md).

### Расширение списка иконок

При использовании локального расширения списка иконок для расширения и типа `IconNames` в файл `package.json` вашего проекта следует добавить объект:

```json
{
  "tn-ui-kit": {
    "external-icon-names": [
      "new-icon-name"
    ]
  }
}
```

После внесения изменений в этот список, чтобы обновился IconNames локально, следует запустить ещё раз `npm ci` или запустить скрипт напрямую через `npx @life_uikit/uikit sync-icons`.

### ESLint-плагин

В пакет входит ESLint-плагин, который помогает работать с китом в вашем проекте.
Он знает о компонентах uikit и подсказывает прямо в редакторе, когда вы
используете их неправильно или устаревшим способом.

Например, он помогает с миграцией параметров после рефакторинга компонентов:
помечает старые параметры как устаревшие и чинит их автофиксом (`eslint --fix`),
`<TNButton action>` → `<TNButton type="action">`.

Нужен `vue-eslint-parser`. Работает и на flat config (ESLint 9), и на legacy
`.eslintrc` (ESLint 8).

#### Установка для ESLint 9 (flat config)

`eslint.config.js`:

```js
import uikit from "@life_uikit/uikit/eslint-plugin/index.js";
import vueParser from "vue-eslint-parser";

export default [
  { files: ["**/*.vue"], languageOptions: { parser: vueParser } },
  uikit.configs["flat/recommended"],
];
```

#### Установка для ESLint 8 (legacy)

`.eslintrc.js`:

```js
module.exports = {
  parser: "vue-eslint-parser",
  extends: ["plugin:@life_uikit/recommended"],
};
```

Подробнее (список правил, как добавлять миграции) —
в [`eslint-plugin/README.md`](./eslint-plugin/README.md).

## Обновление с 6.x

Седьмая версия меняет пути импорта, часть параметров компонентов и типы.
Пошаговая инструкция с примерами — в [`migration-v7.md`](./migration-v7.md),
полный список изменений — в [`Changelog.md`](./Changelog.md).

## Разработка

### Git hooks

В репозитории используется `simple-git-hooks` (конфиг в `package.json`).

После клонирования достаточно выполнить:

```shell
npm install
```

Скрипт `prepare` автоматически устанавливает `pre-commit` hook.

Текущий порядок в `pre-commit`:
1. `npm run type-check` - проверка типов TypeScript/Vue (`vue-tsc --noEmit`).
2. `sh collect-icon-names.sh` - пересборка файла с именами иконок.
3. `git add components/icons/icon-names.ts` - добавление сгенерированного файла в текущий коммит.

### Платформа для разработки

Для локальной разработки и проверки компонентов используется `histoire`.

Документация: https://histoire.dev/  
Проект: https://github.com/histoire-dev/histoire

Запуск в dev-режиме:

```shell
npm run story:dev
```

Сборка статической версии:

```shell
npm run story:build
```
