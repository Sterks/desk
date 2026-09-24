import { TNTable as TNTableType } from "../table.types";
import type { ITNDropdownMenu } from "../../dropdown/dropdown.types";
import type { TNTabsOption } from "../../tabs/tabs.types";
import TNButton from "../../button/button.vue";

export const photoDataList: TNTableType.Value[] = [
  {
    type: TNTableType.DataType.UserPicture,
    icon: "activeemp-colored",
    iconSecondaryColor: "var(--content-accent-enabled)",
    value: "KK"
  },
  {
    type: TNTableType.DataType.UserPicture,
    imageUrl: "https://buffer.com/cdn-cgi/image/w=1000,fit=contain,q=90,f=auto/library/content/images/size/w1200/2023/10/free-images.jpg",
    value: "KK"
  },
  {
    type: TNTableType.DataType.UserPicture,
    imageUrl:
      "https://images.unsplash.com/photo-1575936123452-b67c3203c357?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW1hZ2V8ZW58MHx8MHx8fDA%3D",
    value: "KK"
  },
  {
    type: TNTableType.DataType.UserPicture,
    imageUrl: "https://media.macphun.com/img/uploads/customer/how-to/608/15542038745ca344e267fb80.28757312.jpg?q=85&w=1340",
    value: "KK"
  },
  {
    type: TNTableType.DataType.UserPicture,
    iconSecondaryColor: "var(--content-accent-enabled)",
    value: "KK"
  },
  {
    type: TNTableType.DataType.UserPicture,
    iconSecondaryColor: "var(--content-accent-enabled)",
    value: "МВ"
  },
  {
    type: TNTableType.DataType.UserPicture,
    iconSecondaryColor: "var(--content-accent-enabled)",
    value: "ОА"
  }
];
export const nameDataList: TNTableType.Value[] = [
  {
    type: TNTableType.DataType.Text,
    value: "Mick",
    copyable: true
  },
  "Jack",
  "Dude",
  "John",
  {
    type: TNTableType.DataType.Text,
    value: "Иван",
    tooltip: "Иван - классное имя, и люди с именем Иван тоже классные"
  },
  ""
];
export const descriptionDataList: TNTableType.Value[] = [
  "Официальный канал для сотрудников. Получайте важные обновления, новости",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam scelerisque.",
  ""
];
export const linkDataList: TNTableType.Value[] = [
  {
    type: TNTableType.DataType.Link,
    value: "https://tnlife.ru"
  },
  {
    type: TNTableType.DataType.Link,
    value: "https://google.com"
  },
  {
    type: TNTableType.DataType.Link,
    value: "https://yandex.ru"
  },
  {
    type: TNTableType.DataType.Link,
    value: "https://vk.com"
  },
  {
    type: TNTableType.DataType.Link,
    value: "https://youtube.com"
  }
];
export const faceDataList: TNTableType.Value[] = [
  {
    type: TNTableType.DataType.Tag,
    value: "ООО Технониколь “Строительные системы”"
  },
  {
    type: TNTableType.DataType.Tag,
    value: "Telegram Messenger LLP"
  },
  ""
];
export const sbeDataList: TNTableType.Value[] = [
  {
    type: TNTableType.DataType.Tag,
    value: "Только СБЕ МИ",
    icon: "status-filled",
    iconColor: "var(--content-system-positive)"
  },
  {
    type: TNTableType.DataType.Tag,
    value: "Ничего",
    icon: "status-filled",
    iconColor: "var(--content-system-warning)"
  },
  ""
];
export const selectListOptions: TNTableType.ListOption[] = [
  {
    title: "Отправить на доработку",
    icon: "return",
    id: "reject"
  },
  {
    title: "Отложить",
    icon: "clock",
    id: "dep",
    disabled: true,
    disabledAnnotation: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam scelerisque."
  },
  {
    title: "Отклонить",
    icon: "close",
    id: "rej"
  },
  {
    title: "В архив",
    icon: "archive",
    id: "archive"
  }
];
export const statusDataList: TNTableType.Value[] = [
  {
    type: TNTableType.DataType.Tag,
    value: "1",
    label: "Активен",
    icon: "status-filled",
    iconColor: "var(--content-system-positive)"
  },
  {
    type: TNTableType.DataType.Tag,
    value: "2",
    label: "Заблокирован",
    icon: "status-filled",
    iconColor: "var(--content-system-negative)"
  },
  {
    type: TNTableType.DataType.Tag,
    value: "3",
    label: "Удалён",
    icon: "status-filled",
    iconColor: "var(--content-system-neutral)"
  },
  {
    type: TNTableType.DataType.Tag,
    value: "4",
    label: "Заморожен",
    icon: "status-filled",
    iconColor: "var(--content-system-warning)"
  },
  ""
];
export const adminsDataList: TNTableType.Value[] = ["1", "2", "3", "4", ""];
export const header: TNTableType.Header[] = [
  {
    title: "Фото",
    fieldName: "photo",
    width: 54
  },
  {
    title: "Название",
    fieldName: "name",
    width: 200,
    sort: true
  },
  {
    title: "Автор",
    fieldName: "author",
    width: 200
  },
  {
    title: "Статус",
    fieldName: "status",
    width: 200,
    sort: true
  },
  {
    title: "Описание",
    fieldName: "description",
    width: 327,
    sort: true
  },
  {
    title: "Админы и прочее",
    fieldName: "admins",
    width: 200
  },
  {
    title: "Ссылка",
    fieldName: "link",
    width: 200
  },
  {
    title: "Юр.Лицо",
    fieldName: "face",
    width: 347
  },
  {
    title: "СБЕ",
    fieldName: "sbe",
    width: 200
  }
];
export const filterHeader: TNTableType.Header[] = [
  {
    title: "Фото",
    fieldName: "photo",
    width: 54
  },
  {
    title: "Название",
    fieldName: "name",
    width: 200,
    sort: true
  },
  {
    title: "Автор",
    fieldName: "author",
    width: 200
  },
  {
    title: "Статус",
    fieldName: "status",
    width: 200,
    sort: true,
    filter: {
      type: TNTableType.FilterType.Select,
      placeholder: "Все статусы",
      selectOptions: [
        {
          id: "1",
          title: "Активен",
          isCheck: false,
          deep: 0
        },
        {
          id: "2",
          title: "Заблокирован",
          isCheck: false,
          deep: 0
        },
        {
          id: "3",
          title: "Удалён",
          isCheck: false,
          deep: 0
        },
        {
          id: "4",
          title: "Заморожен",
          isCheck: false,
          deep: 0
        }
      ]
    }
  },
  {
    title: "Описание",
    fieldName: "description",
    width: 327,
    sort: true
  },
  {
    title: "Админы и прочее",
    fieldName: "admins",
    width: 200
  },
  {
    title: "Ссылка",
    fieldName: "link",
    width: 200
  },
  {
    title: "Юр.Лицо",
    fieldName: "face",
    width: 347
  },
  {
    title: "СБЕ",
    fieldName: "sbe",
    width: 200
  }
];
export const filterMethodHeader: TNTableType.Header[] = [
  {
    title: "Фото",
    fieldName: "photo",
    width: 54
  },
  {
    title: "Название",
    fieldName: "name",
    width: 200,
    sort: true,
    filter: {
      type: TNTableType.FilterType.Text,
      placeholder: "Любое название",
      method: {
        options: [
          {
            id: "starts-with",
            title: "Начинается с ..."
          },
          {
            id: "ends-with",
            title: "Заканчивается на ..."
          },
          {
            id: "includes",
            title: "Включает в себя"
          },
          {
            id: "excludes",
            title: "Не включает в себя"
          }
        ],
        selected: "includes"
      }
    }
  },
  {
    title: "Автор",
    fieldName: "author",
    width: 200
  },
  {
    title: "Статус",
    fieldName: "status",
    width: 200,
    sort: true
  },
  {
    title: "Описание",
    fieldName: "description",
    width: 327,
    sort: true
  },
  {
    title: "Админы и прочее",
    fieldName: "admins",
    width: 200
  },
  {
    title: "Ссылка",
    fieldName: "link",
    width: 200
  },
  {
    title: "Юр.Лицо",
    fieldName: "face",
    width: 347
  },
  {
    title: "СБЕ",
    fieldName: "sbe",
    width: 200
  }
];
export const rowMenu: ITNDropdownMenu[] = [
  {
    title: "Редактировать",
    id: "edit",
    icon: "edit-1"
  },
  {
    title: "Приоритет",
    id: "priority",
    icon: "rows"
  },
  {
    title: "Удалить",
    id: "remove",
    icon: "delete",
    accent: true
  }
];
export const componentHeader: TNTableType.Header[] = [
  {
    fieldName: "componentValue",
    title: "Кнопка",
    width: 200
  },
  {
    title: "Фото",
    fieldName: "photo",
    width: 54
  },
  {
    title: "Название",
    fieldName: "name",
    width: 200,
    sort: true
  },
  {
    title: "Автор",
    fieldName: "author",
    width: 200
  },
  {
    title: "Статус",
    fieldName: "status",
    width: 200,
    sort: true
  },
  {
    title: "Описание",
    fieldName: "description",
    width: 327,
    sort: true
  },
  {
    title: "Админы и прочее",
    fieldName: "admins",
    width: 200
  },
  {
    title: "Ссылка",
    fieldName: "link",
    width: 200
  },
  {
    title: "Юр.Лицо",
    fieldName: "face",
    width: 347
  },
  {
    title: "СБЕ",
    fieldName: "sbe",
    width: 200
  }
];
export const getComponentData = (data: TNTableType.Data[]): TNTableType.Data[] =>
  data.map(d => ({
    ...d,
    data: {
      ...d.data,
      componentValue: {
        type: TNTableType.DataType.Component,
        value: "123",
        component: TNButton,
        bind: {
          size: "md",
          icon: "star",
          block: true
        },
        events: {
          click: () => {
            alert(`Нажата кнопка. Id ${d.id}`);
          }
        }
      }
    }
  }));
export const tabOptions: TNTabsOption[] = [
  {
    id: "main",
    name: "TNTable"
  },
  {
    id: "select",
    name: "Выбор строк"
  },
  {
    id: "load-state",
    name: "Состояние загрузки"
  },
  {
    id: "column",
    name: "Блокировка скрытия столбцов"
  },
  {
    id: "component",
    name: "Компоненты в ячейках таблицы"
  },
  {
    id: "filter-select",
    name: "Фильтры в ячейках шапки"
  },
  {
    id: "filter-method",
    name: "Методы фильтрации в ячейках шапки"
  }
];
