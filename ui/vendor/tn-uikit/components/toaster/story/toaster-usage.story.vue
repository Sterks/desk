<template>
  <Story title="TNToaster/Playground" group="data" :layout="{ type: 'grid', width: '40%' }">
    <template #controls="{ state }">
      <ControlFieldBoolean v-model="state.bottom" title="bottom" field-type="boolean" desc="Размещение тоста снизу экрана" />
      <ControlFieldJson v-model="state.toastList" title="toastList" field-type="ITNToast[]" default-value="[]" desc="Список тостов" />
    </template>
    <Variant title="TNToaster" :init-state="() => toastDefaultState" auto-props-disabled>
      <template #default="{ state }">
        <TNButton @click="openToast(state)"> Открыть toast-уведомление </TNButton>
        <TNToaster v-bind="filterState(state)" @close-toast="(closeToast($event, state), logEvent('closeToast', { $event }))" />
      </template>
    </Variant>
    <Variant title="Успех" :init-state="() => toastDefaultState" auto-props-disabled>
      <template #default="{ state }">
        <TNButton @click="openToast(state, 'success')"> Открыть toast-успех </TNButton>
        <TNToaster v-bind="filterState(state)" @close-toast="(closeToast($event, state), logEvent('closeToast', { $event }))" />
      </template>
    </Variant>
    <Variant title="Предупреждение" :init-state="() => toastDefaultState" auto-props-disabled>
      <template #default="{ state }">
        <TNButton @click="openToast(state, 'warn')"> Открыть toast-предупреждение </TNButton>
        <TNToaster v-bind="filterState(state)" @close-toast="(closeToast($event, state), logEvent('closeToast', { $event }))" />
      </template>
    </Variant>
    <Variant title="Ошибка" :init-state="() => toastDefaultState" auto-props-disabled>
      <template #default="{ state }">
        <TNButton @click="openToast(state, 'error')"> Открыть toast-ошибка </TNButton>
        <TNToaster v-bind="filterState(state)" @close-toast="(closeToast($event, state), logEvent('closeToast', { $event }))" />
      </template>
    </Variant>
    <Variant title="useToaster">
      <template #default>
        <div class="toaster-usage-story__controls">
          <TNButton @click="openComposableToast('success')"> Успешный toast </TNButton>
          <TNButton @click="openComposableToast('warn')"> Toast с отменой </TNButton>
          <TNButton @click="openComposableToast('error')"> Ошибочный toast </TNButton>
          <TNButton @click="openComposableVNodeToast"> Toast с компонентом </TNButton>
        </div>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import { h } from "vue";
import { logEvent } from "histoire/client";
import type { ITNToast } from "../toaster.types";
import { useToaster } from "../composable";
import { filterState } from "../../../consts/consts";
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import { TNButton } from "../../button";
import { TNIcon } from "../../icons/index";
import TNToaster from "../toaster.vue";

const toastDefaultState = {
  toastList: []
};

const createToastItem = (toastData: Partial<ITNToast>): ITNToast => {
  return {
    text: "",
    type: "info",
    duration: 15_000,
    creationTime: new Date().getTime(),
    onClick: () => {
      alert("Привет, это сообщение вызвано по клику по toast");
      logEvent("TNToast:onClick", null);
    },
    timeOutCallback: () => {
      alert("Привет, это сообщение вызвано по истечению времени отображения");
      logEvent("TNToast:onClick", null);
    },
    canceledCallback: () => {
      alert("Привет, это сообщение вызвано при нажатии кнопки отменить");
      logEvent("TNToast:onClick", null);
    },
    ...toastData
  };
};

function openToast(state: { toastList: ITNToast[] }, type: ITNToast["type"] = "info") {
  const toast: ITNToast = createToastItem({
    text: "Вы создали тост",
    type
  });
  state.toastList.push(toast);
}

function closeToast(toast: ITNToast, state: { toastList: ITNToast[] }) {
  const index = state.toastList.findIndex(t => t.creationTime === toast.creationTime);
  if (index > -1) {
    state.toastList.splice(index, 1);
  }
}

const showToast = useToaster();

function openComposableToast(type: "success" | "warn" | "error") {
  if (type === "success") {
    showToast("Изменения сохранены", {
      toast: createToastItem({
        type: "success"
      })
    });
    return;
  }

  if (type === "warn") {
    showToast("Сохранить как черновик?", {
      toast: createToastItem({
        type: "warn",
        cancelButtonText: "Отменить"
      })
    });

    return;
  }

  showToast("Ошибка", {
    toast: createToastItem({
      type: "error"
    })
  });
}

function openComposableVNodeToast() {
  showToast(
    h("span", null, [
      h(TNIcon, {
        name: "warning",
        size: 16
      }),
      "Подробнее в ",
      h(
        TNButton,
        {
          href: "/",
          target: "_blank",
          link: true,
          size: "sm"
        },
        () => "документации"
      )
    ]),
    {
      toast: createToastItem({
        type: "info"
      })
    }
  );
}
</script>

<docs lang="md">
### Toaster type

Для использования доступно 4 типа отображаемых уведомлений:
`info`, `warn`, `error`, `success`

### Toast с коллбеком

Toast в качестве параметра способен принимать коллбек `timeOutCallback`,
который вызывается при окончании таймера, `canceledCallback`,
который вызывается при нажатии кнопки "Отменить" и `onClick`, который вызывается при простом клике на `toast`.
</docs>

<style scoped>
.toaster-usage-story__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
