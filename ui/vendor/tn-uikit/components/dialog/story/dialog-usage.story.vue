<template>
  <Story title="useDialog/Playground" group="data" :layout="{ type: 'grid', width: '50%' }">
    <Variant title="Конструктор" :init-state="initConstructorState" auto-props-disabled>
      <template #controls="{ state }">
        <ControlFieldSelect v-model="state.method" title="метод" field-type="showConfirm | showAlert" :options="['showConfirm', 'showAlert']" />
        <ControlFieldText v-model="state.message" title="message" field-type="string" required desc="Сообщение диалога — строка выводится описанием в шапке" />
        <ControlFieldText v-model="state.title" title="title" field-type="string" desc="Заголовок в шапке диалога" />
        <ControlFieldText v-model="state.confirmText" title="confirmText" field-type="string" desc="Текст кнопки подтверждения. Пусто — дефолт метода" />
        <ControlFieldText v-model="state.cancelText" title="cancelText" field-type="string" desc="Текст кнопки отмены (только showConfirm). Пусто — «Отмена»" />
        <ControlFieldBoolean v-model="state.closable" title="closable" field-type="boolean" default-value="false" desc="Закрытие затемнением, Esc и свайпом" />
      </template>
      <template #default="{ state }">
        <TNButton @click="openFromControls(state)">Открыть с этими параметрами</TNButton>
      </template>
    </Variant>

    <Variant title="showAlert" auto-props-disabled>
      <template #default>
        <TNButton @click="run('showAlert', showAlert('Изменения сохранены', { title: 'Готово' }))">Открыть showAlert</TNButton>
      </template>
    </Variant>

    <Variant title="showConfirm" auto-props-disabled>
      <template #default>
        <TNButton
          @click="
            run('showConfirm', showConfirm('Удалить запись? Затемнение, Esc и свайп не закрывают диалог', { title: 'Подтверждение', confirmText: 'Удалить' }))
          "
        >
          Открыть showConfirm
        </TNButton>
      </template>
    </Variant>

    <Variant title="closable: мягкое закрытие как отмена" auto-props-disabled>
      <template #default>
        <TNButton
          @click="
            run('closable', showConfirm('Закройте крестиком, затемнением или Esc — в логе будет result: cancel', { title: 'Мягкое закрытие', closable: true }))
          "
        >
          Открыть closable
        </TNButton>
      </template>
    </Variant>

    <Variant title="onConfirm — успешный" auto-props-disabled>
      <template #default>
        <TNButton
          @click="run('onConfirm:success', showConfirm('Удалить запись?', { title: 'Подтверждение', confirmText: 'Удалить', onConfirm: resolveLater }))"
        >
          Открыть с запросом
        </TNButton>
      </template>
    </Variant>

    <Variant title="onConfirm — падающий" auto-props-disabled>
      <template #default>
        <TNButton
          @click="
            run(
              'onConfirm:error',
              showConfirm('Удалить запись?', {
                title: 'Подтверждение',
                confirmText: 'Удалить',
                onConfirm: rejectLater,
                onError: error => logEvent('onError', { message: String(error) })
              })
            )
          "
        >
          Открыть с падающим запросом
        </TNButton>
      </template>
    </Variant>

    <Variant title="Поверх TNPopup" auto-props-disabled>
      <template #default>
        <TNButton @click="isPopupOpen = true">Открыть TNPopup</TNButton>
        <TNPopup :is-visible="isPopupOpen" title="Форма" @close="isPopupOpen = false">
          Диалог должен появиться поверх этого попапа, а его затемнение — накрыть попап.
          <template #footer>
            <TNButton @click="run('over-popup', showConfirm('Удалить запись?', { title: 'Подтверждение', confirmText: 'Удалить' }))">Удалить</TNButton>
          </template>
        </TNPopup>
      </template>
    </Variant>

    <Variant title="Два диалога подряд" auto-props-disabled>
      <template #default>
        <TNButton @click="openStack">Открыть два диалога</TNButton>
      </template>
    </Variant>

    <Variant title="Сообщение-компонент" auto-props-disabled>
      <template #default>
        <TNButton @click="run('vnode', showConfirm(renderMessage, { title: 'Произвольная разметка' }))">Открыть с VNode</TNButton>
      </template>
    </Variant>

    <Variant title="Размонтирование вызвавшего компонента" auto-props-disabled>
      <template #default>
        <TNButton @click="isProbeMounted = !isProbeMounted">
          {{ isProbeMounted ? "Размонтировать компонент" : "Смонтировать компонент" }}
        </TNButton>
        <UnmountProbe v-if="isProbeMounted" />
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import { defineComponent, h, ref } from "vue";
import { logEvent } from "histoire/client";

import { isTNDialogCancel, useDialog } from "../index";
import { TNButton } from "../../button";
import { TNIllustration } from "../../illustration";
import { TNPopup } from "../../popup";
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";

const { showAlert, showConfirm } = useDialog();

interface IConstructorState {
  method: "showConfirm" | "showAlert";
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  closable: boolean;
}

const initConstructorState = (): IConstructorState => ({
  method: "showConfirm",
  message: "Удалить запись?",
  title: "Подтверждение",
  confirmText: "",
  cancelText: "",
  closable: false
});

/** Пустые строки из контролов превращает в undefined, чтобы сработали дефолты методов */
const openFromControls = (state: IConstructorState) => {
  const message = state.message || "Сообщение диалога";

  const options = {
    title: state.title || undefined,
    confirmText: state.confirmText || undefined,
    closable: state.closable
  };

  if (state.method === "showAlert") {
    run("Конструктор:showAlert", showAlert(message, options));
    return;
  }

  run("Конструктор:showConfirm", showConfirm(message, { ...options, cancelText: state.cancelText || undefined }));
};

const isPopupOpen = ref<boolean>(false);
const isProbeMounted = ref<boolean>(true);

/** Логирует, чем завершился диалог: подтверждением, отказом или ошибкой */
const run = (name: string, dialog: Promise<void>) => {
  dialog.then(
    () => logEvent(name, { result: "confirm" }),
    error => logEvent(name, isTNDialogCancel(error) ? { result: "cancel" } : { result: "error", message: String(error) })
  );
};

const resolveLater = () => new Promise(resolve => setTimeout(resolve, 1500));

const rejectLater = () => new Promise((_resolve, reject) => setTimeout(() => reject(new Error("Сервис недоступен")), 1500));

const renderMessage = () =>
  h("div", { style: "display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center" }, [
    h(TNIllustration, { name: "dialog", style: "width: 120px" }),
    "Сообщение собрано из VNode — космонавт прилагается"
  ]);

const openStack = () => {
  run("stack:first", showConfirm("Первый диалог", { title: "Первый" }));
  run("stack:second", showConfirm("Второй диалог — должен быть сверху", { title: "Второй" }));
};

/** Отдельный компонент: показывает, что при его размонтировании диалог закрывается сам */
const UnmountProbe = defineComponent({
  name: "UnmountProbe",
  setup() {
    const { showConfirm: confirmInProbe } = useDialog();

    const open = () => run("unmounted", confirmInProbe("Размонтируйте компонент кнопкой выше", { title: "Проверка onScopeDispose" }));

    return () => h(TNButton, { type: "outline", onClick: open }, () => "Открыть диалог из дочернего компонента");
  }
});
</script>
