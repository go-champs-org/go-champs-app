import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import TournamentsScreen from '../src/views/TournamentsScreen';
import TournamentHistoryScreen from '../src/views/TournamentHistoryScreen';
import PlayoffsView from '../src/views/PlayoffsView';
import ClassificationView from '../src/views/ClassificationView';
import GroupPhaseView from '../src/views/GroupPhaseView';
import MyGamesScreen from '../src/views/MyGamesScreen';
import ProfileScreen from '../src/views/ProfileScreen';
import { MainTabParamList, RootStackParamList } from '../src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.textSecondary,
        tabBarInactiveTintColor: theme.colors.inactive,
        tabBarStyle: {
          height: 76,
          paddingTop: 8,
          paddingBottom: 12,
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={TournamentsScreen}
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="MyGamesTab"
        component={MyGamesScreen}
        options={{
          title: 'Meus jogos',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
        headerTitleStyle: { fontWeight: 'normal', fontSize: 16 },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="TournamentHistoryScreen" component={TournamentHistoryScreen} options={{ title: 'Fases' }} />
      <Stack.Screen name="PlayoffsView" component={PlayoffsView} options={{ title: 'Playoffs' }} />
      <Stack.Screen name="ClassificationView" component={ClassificationView} options={{ title: 'Classificação' }} />
      <Stack.Screen name="GroupPhaseView" component={GroupPhaseView} options={{ title: 'Fase' }} />
    </Stack.Navigator>
  );
}
