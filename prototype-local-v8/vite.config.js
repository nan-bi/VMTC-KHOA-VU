import {defineConfig} from 'vite';
export default defineConfig({build:{rollupOptions:{onwarn(warning,warn){if(warning.code==='MODULE_LEVEL_DIRECTIVE')return;warn(warning)},output:{manualChunks(id){if(id.includes('pptxgenjs')||id.includes('jszip'))return 'powerpoint';if(id.includes('node_modules/xlsx'))return 'excel';if(id.includes('node_modules'))return 'vendor';}}}}});
