import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        copyPublicDir: false,
        lib: {
            entry: resolve(__dirname, 'src/App.jsx'),
            formats: ['es']
        },
        rollupOptions: {
            //  dependencies we dont want to bundle
            external: ['react', 'react-dom', '@visuallyjs/browser-ui', '@visuallyjs/browser-ui-react']
        }
    }
})
