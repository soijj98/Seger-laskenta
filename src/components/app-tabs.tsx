// Copyright (c) 2026 Saija Joronen
// Licensed under the MIT License.

import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

import AntDesign from '@expo/vector-icons/AntDesign';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (


    <Tabs>
      <Tabs.Screen
        name="calculate"
        options={{
          title: 'calculate',
          tabBarIcon: ({ color }) => (
            <AntDesign name="calculator" size={24} color={color} />
          ),
        }}
      />


    </Tabs>


    // <NativeTabs
    //   backgroundColor={colors.background}
    //   indicatorColor={colors.backgroundElement}
    //   labelStyle={{ selected: { color: colors.text } }}>
    //   <NativeTabs.Trigger name="index">
    //     <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
    //     <NativeTabs.Trigger.Icon
    //       src={require('@/assets/images/tabIcons/home.png')}
    //       renderingMode="template"
    //     />
    //   </NativeTabs.Trigger>

    //   <NativeTabs.Trigger name="explore">
    //     <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
    //     <NativeTabs.Trigger.Icon
    //       src={require('@/assets/images/tabIcons/explore.png')}
    //       renderingMode="template"
    //     />
    //   </NativeTabs.Trigger>

    //   <NativeTabs.Trigger name="calculate">
    //     <NativeTabs.Trigger.Label>Laske</NativeTabs.Trigger.Label>
    //     <AntDesign name="calculator" size={24} color="black" />
    //   </NativeTabs.Trigger>


    //   <NativeTabs.Trigger name="lasitteet">
    //     <NativeTabs.Trigger.Label>Lasitteet</NativeTabs.Trigger.Label>
    //     <AntDesign name="experiment" size={24} color="black" />  
    //   </NativeTabs.Trigger>

    // </NativeTabs>
  );
}
