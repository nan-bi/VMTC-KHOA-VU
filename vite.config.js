import {defineConfig} from 'vite';
import {speechOfflinePlugin} from './scripts/speechOffline.mjs';
export default defineConfig({plugins:[speechOfflinePlugin()],build:{emptyOutDir:false,rollupOptions:{input:{main:'index.html',speech:'speech.html',speechTraining:'speech-training.html'},onwarn(warning,warn){if(warning.code==='MODULE_LEVEL_DIRECTIVE')return;warn(warning)},output:{manualChunks(id){if(id.includes('pptxgenjs')||id.includes('jszip'))return 'powerpoint';if(id.includes('node_modules/xlsx'))return 'excel';if(id.includes('node_modules'))return 'vendor';}}}}});
