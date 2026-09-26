import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3DarkTheme, PaperProvider } from 'react-native-paper';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { initDB, seedIngredients } from '@/lib/db';
 

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
