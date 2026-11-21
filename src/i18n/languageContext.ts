import { createContext, useContext } from 'react';
import { selectLanguage, type Language } from './config';
export const LanguageContext = createContext<{
  choose: (language: Language) => void;
  saving: boolean;
  failed: boolean;
}>({
  choose: (language) => {
    void selectLanguage(language);
  },
  saving: false,
  failed: false,
});
export const useLanguagePreference = () => useContext(LanguageContext);
