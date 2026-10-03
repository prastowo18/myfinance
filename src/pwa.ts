import { registerSW } from 'virtual:pwa-register'

registerSW({
  immediate: true,

  onRegisterError(error) {
    console.error('PWA registration error:', error)
  },
})
