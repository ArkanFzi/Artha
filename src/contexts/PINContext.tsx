import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getPINEnabled, isPINSet } from '../utils/pinStorage';
import { PINContextType } from '../types';

const PINContext = createContext<PINContextType | undefined>(undefined);

interface PINProviderProps {
  children: ReactNode;
}

export const PINProvider: React.FC<PINProviderProps> = ({ children }) => {
  const [isPINEnabled, setIsPINEnabled] = useState(false);
  const [isPINVerified, setIsPINVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPINStatus();
  }, []);

  const checkPINStatus = async () => {
    try {
      const enabled = await getPINEnabled();
      const pinSet = await isPINSet();
      setIsPINEnabled(enabled && pinSet);
    } catch (error) {
      console.error('Error checking PIN status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePINStatus = async () => {
    await checkPINStatus();
  };

  const verifySuccess = () => {
    setIsPINVerified(true);
  };

  const requirePIN = () => {
    setIsPINVerified(false);
  };

  const value: PINContextType = {
    isPINEnabled,
    isPINVerified,
    isLoading,
    updatePINStatus,
    verifySuccess,
    requirePIN,
  };

  return <PINContext.Provider value={value}>{children}</PINContext.Provider>;
};

export const usePIN = () => {
  const context = useContext(PINContext);
  if (!context) {
    throw new Error('usePIN must be used within PINProvider');
  }
  return context;
};

export default PINContext;
