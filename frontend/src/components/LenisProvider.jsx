import React, { createContext, useContext, useState } from 'react';
import { useLenis } from '../hooks/useLenis';

const LenisContext = createContext(null);

export const LenisProvider = ({ children, options = {} }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const lenisData = useLenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: !isModalOpen, // Disable smooth wheel when modal is open
    smoothTouch: false,
    wheelMultiplier: 1,
    touchMultiplier: 2,
    normalizeWheel: true,
    ...options
  }, isModalOpen);

  const enableModalMode = () => setIsModalOpen(true);
  const disableModalMode = () => setIsModalOpen(false);

  return (
    <LenisContext.Provider value={{
      ...lenisData,
      enableModalMode,
      disableModalMode,
      isModalOpen
    }}>
      {children}
    </LenisContext.Provider>
  );
};

export const useLenisContext = () => {
  const context = useContext(LenisContext);
  if (!context) {
    throw new Error('useLenisContext must be used within a LenisProvider');
  }
  return context;
};

export default LenisProvider;
