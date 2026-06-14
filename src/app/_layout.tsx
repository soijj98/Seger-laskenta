import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView  } from 'react-native-gesture-handler';
import {useEffect, useState} from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { initDB, seedIngredients } from '@/lib/db';
 

export default function TabLayout() {

  

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
    <GestureHandlerRootView style={{ flex: 1 }}>  
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  </GestureHandlerRootView>

  );
}
