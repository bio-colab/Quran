import { useEffect, useState } from 'react';
import { isNativePlatform, getPlatform } from '../capacitor';

/**
 * Custom hook to detect Capacitor platform and provide platform-specific functionality
 */
export const useCapacitor = () => {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if we're in a Capacitor environment
    const checkPlatform = () => {
      const native = isNativePlatform;
      setIsNative(native);
      
      const currentPlatform = getPlatform() as 'web' | 'ios' | 'android';
      setPlatform(currentPlatform);
      
      setIsAndroid(currentPlatform === 'android');
      setIsIOS(currentPlatform === 'ios');
    };

    checkPlatform();
  }, []);

  return {
    isNative,
    platform,
    isAndroid,
    isIOS,
    isWeb: !isNative
  };
};

export default useCapacitor;