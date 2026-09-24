<template>
  <component :is="tagName" class="tn-cell" :class="mainClassList" @click="mainClickHandler">
    <div v-if="showLeftContainer" class="tn-cell__left-container" :class="{ 'tn-cell__left-container_center': cellData.userPicture }">
      <TNCheckbox v-if="cellData.checkbox" :disabled="isCheckboxDisabled" :model-value="cellData.checked" @update:model-value="updateHandler" @click.stop />
      <TNRadio
        v-else-if="cellData.radiobutton"
        :disabled="isRadioButtonDisabled"
        :summary-value="'1'"
        :item-value="radioValue"
        @input="updateHandler"
        @click.stop
      />
      <TNUserPicture
        v-else-if="cellData.userPicture"
        class="tn-cell__user-picture"
        hide-on-error
        :size="cellData.chat ? 'm' : 's'"
        :status="cellData.userPicture.status"
        :text="cellData.userPicture.text"
        :icon="cellData.userPicture.icon"
        :image="cellData.userPicture.image"
        :square="cellData.userPicture.square"
      />
      <TNIcon
        v-else-if="cellData.leftIcon"
        :size="dropdown ? 20 : 24"
        class="tn-cell__left-icon"
        :class="{ 'tn-cell__left-icon_accent': cellData.accent }"
        :name="cellData.leftIcon"
      />
    </div>
    <div class="tn-cell__main-container">
      <p class="tn-cell__title" :class="{ 'tn-cell__title_accent': cellData.accent }">
        <span class="tn-cell__title-text">{{ cellData.title }}</span>
        <TNIcon v-if="cellData.chat?.verified" class="tn-cell__title-icon tn-cell__title-icon_verified" size="16" name="certification" />
        <TNIcon v-if="cellData.chat?.muted" class="tn-cell__title-icon tn-cell__title-icon_muted" size="22" name="notification-off-filled" />
      </p>
      <p v-if="subtitle" class="tn-cell__subtitle">
        {{ subtitle }}
      </p>
      <p v-if="body" class="tn-cell__body" :class="{ 'tn-cell__body_one-row': subtitle }">
        {{ body }}
      </p>
    </div>
    <div
      v-if="showRightContainer"
      class="tn-cell__right-container"
      :class="{
        'tn-cell__right-container_center': cellData.rightIconsAlignment === 'center',
        'tn-cell__right-container_chat': cellData.chat
      }"
    >
      <template v-if="cellData.chat">
        <p class="tn-cell__time" :class="{ 'tn-cell__time_status': cellData.chat.status }">
          <TNIcon v-if="timeIcon" class="tn-cell__time-icon" :style="{ color: timeIconColor }" :name="timeIcon" size="16" />{{ time }}
        </p>
        <p v-if="cellData.chat.notification && !isNaN(cellData.chat.notification)" class="tn-cell__notification">
          {{ cellData.chat.notification }}
        </p>
        <TNIcon v-else-if="cellData.chat.pinned" class="tn-cell__pinned" size="24" name="pin-filled" />
      </template>
      <TNTumbler v-else-if="cellData.tumbler" :disabled="isTumblerDisabled" :model-value="cellData.checked" @update:model-value="updateHandler" @click.stop />
      <template v-else-if="cellData.rightIcons?.length">
        <TNButton
          v-for="(icon, index) in cellData.rightIcons"
          :key="icon + index"
          class="tn-cell__right-button"
          :class="{ 'tn-cell__right-button_accent': cellData.accent }"
          size="md"
          type="link"
          :disabled="isButtonDisabled(icon)"
          :icon="icon"
          @click.stop="rightButtonClickHandler($event, icon, index)"
        />
      </template>
      <p v-else-if="cellData.secondaryText" class="tn-cell__secondary-text">
        {{ cellData.secondaryText }}
      </p>
    </div>
  </component>
</template>

<script lang="ts" setup generic="TId extends string | number = string">
import { computed } from "vue";
import TNIcon from "../icons/icon.vue";
import TNUserPicture from "../user-picture/user-picture.vue";
import TNCheckbox from "../checkbox/checkbox.vue";
import TNRadio from "../radiobutton/radiobutton.vue";
import TNTumbler from "../tumbler/tumbler.vue";
import TNButton from "../button/button.vue";
import { BodyClickEventPayload, ICellDataItem, IconClickEventPayload, InputEventPayload } from "./cell.types";
import { MessageCellStatus } from "./cell.types";
import type { IconNames } from "../icons/icon-names";

defineOptions({
  name: "TNCell"
});

const props = withDefaults(
  defineProps<{
    /** Название тега для корневого элемента компонента */
    // eslint-disable-next-line no-undef
    tagName?: keyof HTMLElementTagNameMap;
    /** Данные ячейки */
    cellData: ICellDataItem<TId>;
    /** Форматирование ячейки для использования в компоненте TNDropdown */
    dropdown?: boolean;
  }>(),
  {
    tagName: "div"
  }
);

const emit = defineEmits<{
  /** Событие вызывается при клике по Чекбоксу, Радио-кнопке и Тумблеру */
  (e: "input", payload: InputEventPayload<TId>): void;
  /** Событие вызывается при клике по основной части компонента, но не по прочим кликабельным элементам */
  (e: "bodyClick", payload: BodyClickEventPayload<TId>): void;
  /** Событие вызывается при клике по кнопке из массива иконок cellData.rightIcons */
  (e: "iconClick", payload: IconClickEventPayload<TId>): void;
}>();

const mainClassList = computed<{ [key: string]: boolean }>(() => ({
  "tn-cell_disabled": typeof props.cellData.disabled === "boolean" && props.cellData.disabled,
  "tn-cell_enabled": !!props.cellData.enabled,
  "tn-cell_chat": !!props.cellData.chat,
  "tn-cell_dropdown": !!props.dropdown
}));

const radioValue = computed<string>(() => (props.cellData.checked ? "1" : "0"));

const showLeftContainer = computed<boolean>(
  () => !!(props.cellData.checkbox || props.cellData.radiobutton || props.cellData.leftIcon || props.cellData.userPicture)
);

const showRightContainer = computed<boolean>(
  () => !!(props.cellData.rightIcons?.length || props.cellData.tumbler || props.cellData.chat || props.cellData.secondaryText)
);

const subtitle = computed<string>(() => {
  if (props.cellData.subtitle && props.cellData.chat?.body) {
    return props.cellData.subtitle;
  } else if (props.cellData.subtitle) {
    return props.cellData.subtitle;
  }

  return "";
});

const body = computed<string>(() => props.cellData.chat?.body ?? "");

const time = computed<string>(() => {
  const today: Date = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const date = props.cellData.chat?.time;

  if (date) {
    const leadingZero = (number: number): string => {
      return number > 9 ? number.toString() : "0" + number;
    };
    const weekDays = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
    const sixWeeks = 518400000;

    if (todayMidnight.getTime() < date.getTime()) {
      return `${leadingZero(date.getHours())}:${leadingZero(date.getMinutes())}`;
    } else if (todayMidnight.getTime() - date.getTime() < sixWeeks) {
      return weekDays[date.getDay()];
    } else if (todayMidnight.getFullYear() === date.getFullYear()) {
      return `${leadingZero(date.getDate())}.${leadingZero(date.getMonth())}`;
    }
    return `${leadingZero(date.getMonth())}.${date.getFullYear()}`;
  }

  return "";
});

const timeIcon = computed<IconNames | "">(() => {
  if (props.cellData.chat?.status === MessageCellStatus.Waiting) {
    return "clock";
  } else if (props.cellData.chat?.status === MessageCellStatus.Sent) {
    return "check";
  } else if (props.cellData.chat?.status === MessageCellStatus.Read) {
    return "read";
  } else if (props.cellData.chat?.status === MessageCellStatus.Warning) {
    return "warning-small-filled";
  }
  return "";
});

const timeIconColor = computed<string>(
  () => ["", "", "var(--content-system-positive)", "var(--content-system-positive)", "var(--content-system-negative)"][props.cellData.chat?.status || 0]
);

const isCheckboxDisabled = computed<boolean>(() =>
  typeof props.cellData.disabled === "boolean" || props.cellData.disabled === undefined
    ? !!props.cellData.disabled
    : props.cellData.disabled.includes("checkbox")
);

const isRadioButtonDisabled = computed<boolean>(() =>
  typeof props.cellData.disabled === "boolean" || props.cellData.disabled === undefined
    ? !!props.cellData.disabled
    : props.cellData.disabled.includes("radiobutton")
);

const isTumblerDisabled = computed<boolean>(() =>
  typeof props.cellData.disabled === "boolean" || props.cellData.disabled === undefined
    ? !!props.cellData.disabled
    : props.cellData.disabled.includes("tumbler")
);

const mainClickHandler = (event: MouseEvent) => {
  emit("bodyClick", { event, id: props.cellData.id });
};

const rightButtonClickHandler = (event: MouseEvent, icon: IconNames, index: number) => {
  emit("iconClick", { event, icon, id: props.cellData.id, index });
};

const updateHandler = () => {
  emit("input", { value: !props.cellData.checked, id: props.cellData.id });
};

const isButtonDisabled = (name: string): boolean =>
  typeof props.cellData.disabled === "boolean" || props.cellData.disabled === undefined ? !!props.cellData.disabled : props.cellData.disabled.includes(name);
</script>

<style>
.tn-cell {
  padding: 12px 16px;
  display: flex;
  font-family: var(--font-family-body);
  cursor: pointer;
  background-color: var(--background-primary-a-enabled);
  transition: background-color 0.1s linear;
  gap: 10px;
  user-select: none;
}

.tn-cell:hover {
  background-color: var(--background-primary-a-hover);
}

.tn-cell:active {
  background-color: var(--background-primary-a-pressed);
}

.tn-cell_disabled {
  pointer-events: none;
}

.tn-cell_enabled {
  background-color: var(--background-secondary-a-enabled);
}

.tn-cell_enabled:hover {
  background-color: var(--background-secondary-a-hover);
}

.tn-cell_enabled:active {
  background-color: var(--background-secondary-a-pressed);
}

.tn-cell_chat,
.tn-cell_dropdown {
  padding: 8px 16px;
}

.tn-cell_dropdown {
  .tn-cell__title {
    font-weight: var(--font-weight-text);
    font-size: var(--font-size-body-small);
    line-height: var(--font-lineHeight-body-small);
  }

  .tn-cell__left-icon {
    color: var(--content-secondary-enabled);
  }
}

.tn-cell__main-container {
  flex: 1 0;
  overflow: hidden;
  display: flex;
  flex-flow: column;
  justify-content: center;
}

.tn-cell__title {
  font-weight: var(--font-weight-accent);
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: start;
  color: var(--content-primary-a-enabled);
}

.tn-cell__title_accent {
  color: var(--content-accent-enabled);
}

.tn-cell__title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tn-cell__title-icon {
  flex: 0 0 22px;
  height: 22px;
  color: var(--content-tertiary-enabled);
  margin-left: 4px;
}

.tn-cell__title-icon_verified {
  flex: 0 0 16px;
  height: 16px;
}

.tn-cell_chat .tn-cell__title {
  display: flex;
  align-items: center;
}

.tn-cell__left-icon_accent,
.tn-cell_dropdown .tn-cell__left-icon_accent {
  color: var(--content-accent-enabled);
}

.tn-cell_disabled .tn-cell__title,
.tn-cell_disabled .tn-cell__subtitle,
.tn-cell_disabled .tn-cell__left-icon,
.tn-cell_disabled .tn-cell__body,
.tn-cell_disabled .tn-cell__time,
.tn-cell_disabled .tn-cell__pinned,
.tn-cell_disabled .tn-button.tn-cell__right-button,
.tn-button.tn-cell__right-button:disabled {
  color: var(--content-primary-a-disabled);
}

.tn-cell__subtitle {
  color: var(--content-secondary-enabled);
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tn-cell_chat .tn-cell__subtitle {
  font-weight: var(--font-weight-accent);
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
}

.tn-cell__body {
  color: var(--content-secondary-enabled);
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 44px;
}

.tn-cell__body_one-row {
  max-height: 22px;
}

.tn-cell__time {
  color: var(--content-secondary-enabled);
  font-weight: var(--font-weight-text);
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
}

.tn-cell__time_status {
  display: flex;
  align-items: center;
}

.tn-cell__time-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
}

.tn-cell__notification {
  background-color: var(--background-accent-enabled);
  color: var(--content-primary-b-enabled);
  font-weight: var(--font-weight-text);
  font-size: var(--font-size-label-small);
  line-height: 14px;
  border-radius: 14px;
  min-width: 14px;
  text-align: center;
  margin-top: 16px;
  padding: 0 4px;
}

.tn-cell__left-icon {
  display: block;
}

.tn-cell__user-picture {
  width: 32px;
  height: 32px;
}

.tn-cell_disabled .tn-cell__user-picture {
  opacity: 0.2;
}

.tn-cell_chat .tn-cell__user-picture {
  width: 46px;
  height: 46px;
}

.tn-cell__right-container_chat {
  display: flex;
  flex-flow: column;
  align-items: flex-end;
}

.tn-cell__right-container_center,
.tn-cell__left-container_center {
  align-self: center;
}

.tn-button.tn-cell__right-button {
  color: var(--content-primary-a-enabled);
  border: none;
  padding: 0;
  width: 24px;
  height: 24px;
  border-radius: 0;
}

.tn-cell__right-button:not(:last-child) {
  margin-right: 16px;
}

.tn-button.tn-cell__right-button_accent {
  color: var(--content-accent-enabled);
}

.tn-button.tn-cell__right-button .tn-button__icon {
  font-size: 24px;
}

.tn-cell__secondary-text {
  color: var(--content-tertiary-enabled);
  font-size: var(--font-size-label-medium);
  font-weight: var(--font-weight-accent);
  line-height: var(--font-lineHeight-label-medium);
  overflow: hidden;
  white-space: nowrap;
}

.tn-cell__pinned {
  margin-top: 12px;
  color: var(--content-tertiary-enabled);
}
</style>
