---
group: 'top'
title: '2. Подключение и использование'
icon: 'carbon:bookmark'
---
# Установка

В первую очередь необходимо наличие в `.npmrc` файле информации по данному пакету:

```text
@life_uikit:registry=https://gitlab.tn.ru/api/v4/projects/744/packages/npm/
//gitlab.tn.ru/api/v4/projects/744/packages/npm/:_authToken=AUTHTOKEN
```
где `AUTHTOKEN` - Ваш токен Gitlab.

---
Установка производится при помощи команды:

```bash
npm install @life_uikit/uikit
```
# Использование

Пакет используется как плагин, который добавляет глобальные компоненты:

```js
import TNLifeUIKit from "@life_uikit/uikit";
const app = createApp(App);
app.use(TNLifeUIKit);
```
```vue
<TNButton size="sm">Применить</TNButton>
```

# Стили
Также в пакете есть два css-файла стилей:

с css-переменными `variables.css`:

```js
import "@life_uikit/uikit/variables.css";
```
с шрифтами `fonts.css`:

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

# Расширение списка иконок

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

И при создании и обновлении этого поля выполнять скрипт:

```shell
npx @life_uikit/uikit sync-icons
```
