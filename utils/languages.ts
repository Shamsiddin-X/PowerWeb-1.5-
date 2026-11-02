import { Language } from '../types';
export const LANGUAGES:{code:Language;name:string;short:string;locale:string;direction:'ltr'|'rtl'}[]=[
  {code:'ar',name:'العربية',short:'AR',locale:'ar',direction:'rtl'},
  {code:'zh',name:'中文',short:'ZH',locale:'zh-CN',direction:'ltr'},
  {code:'en',name:'English',short:'EN',locale:'en-US',direction:'ltr'},
  {code:'fr',name:'Français',short:'FR',locale:'fr-FR',direction:'ltr'},
  {code:'ru',name:'Русский',short:'RU',locale:'ru-RU',direction:'ltr'},
  {code:'es',name:'Español',short:'ES',locale:'es-ES',direction:'ltr'},
  {code:'tj',name:'Тоҷикӣ',short:'TJ',locale:'tg-TJ',direction:'ltr'},
];
export const isLanguage=(value:unknown):value is Language=>LANGUAGES.some(language=>language.code===value);
export const languageInfo=(code:Language)=>LANGUAGES.find(language=>language.code===code)||LANGUAGES[2];
