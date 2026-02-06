import React from 'react';
import { StatusBar } from 'expo-status-bar';
// Temporary: Use ResetApp to clear corrupted data
import ResetApp from './ResetApp';

export default function App() {
  return (
    <>
      <ResetApp />
      <StatusBar style="light" />
    </>
  );
}
