import React from 'react';
import { EditorSelect } from './EditorSelect';
import { LANGUAGES } from '../../utils/languages';
import { Language } from '../../types';
import { t } from '../../utils/localization';
export function LanguagePicker({value,onChange}:{value:Language;onChange:(value:Language)=>void}){
  return <div className="language-picker" dir="ltr"><EditorSelect value={value} onChange={next=>onChange(next as Language)} label={t('Language',value)} options={LANGUAGES.map(language=>({value:language.code,label:language.name+' · '+language.short}))}/></div>;
}
