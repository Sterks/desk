<template>
  <i class="tn-file-icon">
    <TNIcon :size="size" :name="iconName" />
  </i>
</template>

<script lang="ts" setup>
import TNIcon from "../icons/icon.vue";
import { computed } from "vue";
import type { IconNames } from "../icons/icon-names";
import * as fileTypes from "./file-types";
import type { IExtendedExtensionList } from "./file-icon.types";

defineOptions({
  name: "TNFileIcon"
});

const props = withDefaults(
  defineProps<{
    /** Расширение файла (например, "pdf") **/
    extension: string;
    /** Объект для расширения списка расширений для типов файлов **/
    extendedExtensions?: IExtendedExtensionList;
    /** Размер иконки в пикселях **/
    size?: `${number}` | number;
  }>(),
  {
    extendedExtensions: undefined,
    size: 24
  }
);

const iconName = computed<IconNames>(() => {
  if (fileTypes.imageExtensionArray.includes(props.extension) || (props.extendedExtensions?.image || []).includes(props.extension)) {
    return "image-colored";
  } else if (fileTypes.documentExtensionArray.includes(props.extension) || (props.extendedExtensions?.document || []).includes(props.extension)) {
    return "text-colored";
  } else if (fileTypes.sheetExtensionArray.includes(props.extension) || (props.extendedExtensions?.sheet || []).includes(props.extension)) {
    return "sheets-colored";
  } else if (fileTypes.presentationExtensionArray.includes(props.extension) || (props.extendedExtensions?.presentation || []).includes(props.extension)) {
    return "presentation-colored";
  } else if (fileTypes.archiveExtensionArray.includes(props.extension) || (props.extendedExtensions?.archive || []).includes(props.extension)) {
    return "archive-colored";
  } else if (fileTypes.pdfExtensionArray.includes(props.extension) || (props.extendedExtensions?.pdf || []).includes(props.extension)) {
    return "pdf-colored";
  } else if (fileTypes.videoExtensionArray.includes(props.extension) || (props.extendedExtensions?.video || []).includes(props.extension)) {
    return "video-colored";
  } else if (fileTypes.audioExtensionArray.includes(props.extension) || (props.extendedExtensions?.audio || []).includes(props.extension)) {
    return "music-colored";
  } else if (fileTypes.codeExtensionArray.includes(props.extension) || (props.extendedExtensions?.code || []).includes(props.extension)) {
    return "code-colored";
  }
  return "empty-colored";
});
</script>

<style></style>
