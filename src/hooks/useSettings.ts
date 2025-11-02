import { useLocalStorage } from './useLocalStorage';
import type { Settings } from '../types/quran';

const defaultSettings: Settings = {
  fontSize: 'medium',
  fontFamily: 'uthmanic',
  theme: 'light',
  language: 'ar',
};

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>('quran-settings', defaultSettings);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings({ ...settings, ...newSettings });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
