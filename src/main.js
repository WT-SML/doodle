import { createApp } from 'vue'
import './style.scss'
import App from './App.vue'
import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import naive from 'naive-ui'

const app = createApp(App)
app.use(naive)

const meta = document.createElement('meta')
meta.name = 'naive-ui-style'
document.head.appendChild(meta)

app.mount('#app')
