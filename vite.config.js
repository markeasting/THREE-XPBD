import { defineConfig } from 'vite';
import assemblyScriptPlugin from "vite-plugin-assemblyscript-asc"

export default defineConfig({
    build: {
        minify: false,
        target: 'esnext' // es2015 -> https://github.com/Menci/vite-plugin-top-level-await
    },
    plugins: [
        assemblyScriptPlugin({ 
            projectRoot: 'src',
            srcEntryFile: 'wasm/src/index.ts',
            targetWasmFile: 'wasm/build/debug.wasm',
        })
    ]
});