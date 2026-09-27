import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3DarkTheme, PaperProvider } from 'react-native-paper';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { initDB, seedIngredients } from '@/lib/db';
import * as Sentry from '@sentry/react-native';

  const customDarkTheme = {
    ...MD3DarkTheme,
    colors:{
      ...MD3DarkTheme.colors,
      primary: '#b8935f', // Himmeä kulta/kupari korostuksiin
      background: '#1c1c1c', // Syvä hiilenharmaa tausta
      surface: '#2b2d2a', // Hieman vihertävä tumma korttien tausta
      text: '#e0e0e0',
      error: '#cf6679',
  },
};

Sentry.init({
  dsn: 'https://98907ddcd5d2941948bd3e0cffac5cb3@o4512157383196672.ingest.de.sentry.io/4512157405020240',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});



// Määritellään itse App-komponentti
function App() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbready] = useState(false);

  useEffect(() => {
    const setupDb = async () => {
      try {
        await initDB();
        await seedIngredients();
      } catch (error) {
        console.error('Initializing the database failed:', error);
      } finally {
        setDbready(true);
      }
    };
    setupDb();
  }, []);

  if (!dbReady) return null;

  return (
    <PaperProvider theme={customDarkTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>  
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <AppTabs />
        </ThemeProvider>
      </GestureHandlerRootView>
    </PaperProvider>
  );
}

// Kääritään App-komponentti Sentryyn tiedoston lopussa
export default Sentry.wrap(App);