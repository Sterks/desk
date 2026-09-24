<template>
  <Story :layout="{ type: 'grid', width: '80%' }" group="data" responsive-disabled title="Icons/TNIcons">
    <Variant auto-props-disabled responsive-disabled title="Список иконок">
      <p class="icons__icon-text">Клик <b>по иконке</b> копирует код иконки для вставки.</p>
      <p class="icons__icon-text">Клик <b>по названию</b>, копирует только название.</p>
      <TNSearch v-model.trim="searchText" />
      <div class="icons__container">
        <div v-for="(icons, type) in filteredIconList" :key="type" class="icons__group-wrapper">
          <p class="icons__group-name">{{ getTypeText(type) }}</p>
          <div class="icons__group-icons">
            <div v-for="icon in icons" :key="icon" class="icons__wrapper">
              <div class="icons__icon" @click="copyElement(icon)">
                <TNIcon :name="icon" class="icons__icon-element" />
              </div>
              <span class="icons__name" @click="copyName(icon)">
                {{ icon }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import type { IconNames } from "../icon-names";
import TNIcon from "../icon.vue";
import TNSearch from "../../search/search.vue";

enum IconType {
  Default = "default",
  Light = "light",
  Filled = "filled",
  Colored = "colored"
}

type IconsList = Record<IconType, IconNames[]>;

const searchText = ref<string>("");

function copyElement(icon: IconNames) {
  navigator.clipboard.writeText(`<TNIcon name="${icon}" />`);
}

function copyName(icon: IconNames) {
  navigator.clipboard.writeText(icon);
}

const filteredIconList = computed<IconsList>(() =>
  searchText.value
    ? Object.keys(iconsList.value).reduce<IconsList>(
        (acc, curr) => {
          acc[curr as IconType] = [...iconsList.value[curr as IconType]].filter(icon => icon.toLowerCase().includes(searchText.value));

          return acc;
        },
        {
          [IconType.Default]: [],
          [IconType.Light]: [],
          [IconType.Filled]: [],
          [IconType.Colored]: []
        }
      )
    : iconsList.value
);

const iconsList = ref<IconsList>({
  [IconType.Default]: [],
  [IconType.Light]: [],
  [IconType.Filled]: [],
  [IconType.Colored]: []
});

onMounted(() => {
  const iconList: IconsList = {
    [IconType.Default]: [],
    [IconType.Light]: [],
    [IconType.Filled]: [],
    [IconType.Colored]: []
  };
  Array.from(document.querySelectorAll("#svg--iconpack symbol"))
    .sort((a, b) => (a.id > b.id ? 1 : -1))
    .forEach(item => {
      const iconName = item.id.replace("icon--", "") as IconNames;

      if (iconName.endsWith("-light")) {
        iconList[IconType.Light].push(iconName);
      } else if (iconName.endsWith("-filled")) {
        iconList[IconType.Filled].push(iconName);
      } else if (iconName.endsWith("-colored")) {
        iconList[IconType.Colored].push(iconName);
      } else {
        iconList[IconType.Default].push(iconName);
      }
    });

  iconsList.value = iconList;
});

const getTypeText = (type: IconType): string => {
  return {
    [IconType.Default]: "Стандартная",
    [IconType.Light]: "Тонкая",
    [IconType.Filled]: "Закрашенная",
    [IconType.Colored]: "Цветная"
  }[type];
};
</script>

<style scoped>
.icons__icon-text {
  font-size: 14px;
  line-height: 18px;
  margin: 0 0 10px 0;
}

.icons__container {
  height: 70dvh;
  overflow: auto;
}

.icons__group-name {
  color: var(--content-secondary-enabled);
  font-size: 16px;
  line-height: 22px;
  padding: 16px 0;
  text-align: center;
  position: sticky;
  top: 0;
}

.icons__group-icons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 150px;
}

.icons__wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 12px;
}

.icons__name {
  font-size: 12px;
  margin: 10px;
  cursor: pointer;
  transition: color 0.1s linear;
}

.icons__name:active {
  color: var(--content-accent-enabled);
}

.icons__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  transition: all 0.25s 0s ease;
  font-size: 32px;
}

.icons__icon:before {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--background-accent-enabled);
  border-radius: 50%;
  transition: all 0.3s ease;
  transform: scale(0.5);
  opacity: 0;
}

.icons__icon:hover:before {
  opacity: 1;
  transform: scale(1);
}

.icons__icon-element {
  transition: color linear 0.3s;
  --secondary-color: var(--content-accent-enabled);
}

.icons__icon:hover .icons__icon-element {
  color: var(--content-primary-b-enabled);
}

.icons__icon:active:before {
  background-color: var(--background-accent-pressed);
}
</style>

<docs lang="md">
[Полная документация](./icons.story.md)
</docs>
