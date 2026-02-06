import React, { createContext, useState, useContext, useEffect } from 'react';
import { getPINEnabled, isPINSet } from '../utils/pinStorage';

const PINContext = createContext();

export const PINProvider = ({ children }) => {
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

  const value = {
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
