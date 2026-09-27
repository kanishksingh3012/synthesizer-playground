import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

// Link previews need absolute URLs. Vercel sets VERCEL_PROJECT_PRODUCTION_URL at build time,
// so renaming the project or adding a domain updates the previews without a code change.
const SITE_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || 'synthesizer-playground.vercel.app'}`

const siteUrl = (): Plugin => ({
  name: 'site-url',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), siteUrl()],
})
