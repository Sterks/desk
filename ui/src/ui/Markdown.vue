<script setup lang="ts">
import { computed } from 'vue';
import { renderMarkdown } from '../lib/markdown';

const props = defineProps<{ source: string }>();
const html = computed(() => renderMarkdown(props.source));
</script>

<template>
  <!-- renderMarkdown экранирует HTML (html: false) и пропускает только http(s)-ссылки — см. markdown.test.ts. -->
  <div class="markdown" v-html="html" />
</template>
