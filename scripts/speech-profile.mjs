import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync(new URL('./speech-models.json',import.meta.url),'utf8'));
const name=process.env.VU_SPEECH_MODEL||config.default;
if(!Object.hasOwn(config.models,name))throw Error('VU_SPEECH_MODEL must be base or small');
export const speechProfile={...config.models[name],name};
export const speechReady=new URL('../speech-models/'+speechProfile.directory+'/READY',import.meta.url);
