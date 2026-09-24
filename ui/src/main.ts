import '@life_uikit/uikit/variables.css';
import '@life_uikit/uikit/variables-dark.css';
import '@life_uikit/uikit/fonts.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/board.css';
import './styles/panel.css';
import { createApp } from 'vue';
import TNLifeUIKit from '@life_uikit/uikit';
import App from './App.vue';

const container = document.getElementById('root');
if (!container) throw new Error('#root не найден в index.html');
const app = createApp(App);
app.use(TNLifeUIKit);
app.mount(container);
