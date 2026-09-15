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
import AuthScreen from '../src/views/AuthScreen';
import { MainTabParamList, RootStackParamList } from '../src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.textSecondary,
        tabBarInactiveTintColor: '#d1d4ca',
        tabBarStyle: {
          minHeight: 70,
          paddingTop: 7,
          paddingBottom: 8,
          backgroundColor: theme.colors.primary,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
        },
        tabBarItemStyle: {
          minHeight: 56,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={TournamentsScreen}
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="MyGamesTab"
        component={MyGamesScreen}
        options={{
          title: 'Meus jogos',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-clear-outline" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
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
        headerTitleStyle: { fontWeight: '800', fontSize: 16 },
        headerBackTitle: 'Voltar',
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="TournamentHistoryScreen" component={TournamentHistoryScreen} options={{ title: 'Fases' }} />
      <Stack.Screen name="PlayoffsView" component={PlayoffsView} options={{ title: 'Playoffs' }} />
      <Stack.Screen name="ClassificationView" component={ClassificationView} options={{ title: 'Classificação' }} />
      <Stack.Screen name="GroupPhaseView" component={GroupPhaseView} options={{ title: 'Fase' }} />
      <Stack.Screen name="AuthScreen" component={AuthScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
