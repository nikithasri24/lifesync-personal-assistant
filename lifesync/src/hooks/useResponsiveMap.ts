import { useState, useEffect } from 'react';

interface ResponsiveMapConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  markerSize: number;
  popupMaxWidth: number;
  zoomLevel: number;
  sidebarWidth: string;
}

export const useResponsiveMap = (): ResponsiveMapConfig => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenSize.width < 640;
  const isTablet = screenSize.width >= 640 && screenSize.width < 1024;
  const isDesktop = screenSize.width >= 1024;

  const markerSize = isMobile ? 20 : isTablet ? 28 : 32;
  const popupMaxWidth = isMobile ? 240 : isTablet ? 280 : 320;
  const zoomLevel = isMobile ? 3 : isTablet ? 3.5 : 4;
  const sidebarWidth = isMobile ? '100%' : isTablet ? '50%' : '320px';

  return {
    isMobile,
    isTablet,
    isDesktop,
    markerSize,
    popupMaxWidth,
    zoomLevel,
    sidebarWidth,
  };
};

export default useResponsiveMap;