import { Capacitor } from '@capacitor/core';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'

// Initialize Capacitor if available
const initializeCapacitor = async () => {
  try {
    // Check if we're in a Capacitor environment
    if (Capacitor.isNativePlatform()) {
      console.log('Running in Capacitor native environment');
    } else {
      // Load PWA elements for web platform only
      console.log('Running on web, loading PWA elements');
      const { defineCustomElements } = await import('@ionic/pwa-elements/loader');
      defineCustomElements(window);
    }
  } catch (error) {
    console.log('Capacitor not available or initialization failed:', error);
  }
};

// Initialize Capacitor before rendering the app
initializeCapacitor().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
});