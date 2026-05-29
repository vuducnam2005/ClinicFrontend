import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

app.directive('reveal', {
  mounted(el: HTMLElement) {
    el.classList.add('reveal')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.14 },
    )
    observer.observe(el)
  },
})

app.use(createPinia())
app.use(router())
app.mount('#app')
