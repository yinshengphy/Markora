/// <reference types="vite/client" />

import type { MarkoraApi } from '../electron/preload'

declare global {
  interface Window {
    markora?: MarkoraApi
  }
}
