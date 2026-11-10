import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationIndependentTree } from '@react-navigation/core';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Theme, useTheme } from '../src/theme/theme';
import TournamentsScreen from '../src/views/TournamentsScreen';
import TournamentScreen from '../src/views/TournamentScreen';
import MyGamesScreen from '../src/views/MyGamesScreen';
import ProfileScreen from '../src/views/ProfileScreen';
import AuthScreen from '../src/views/AuthScreen';
import TournamentStatsScreen from '../src/views/TournamentStatsScreen';
import GameDetailScreen from '../src/views/GameDetailScreen';
import TeamScreen from '../src/views/TeamScreen';
import AthleteScreen from '../src/views/AthleteScreen';
import OrganizationScreen from '../src/views/OrganizationScreen';
import OrganizationsScreen from '../src/views/OrganizationsScreen';
import AccountScreen from '../src/views/AccountScreen';
import AthleteProfileEditScreen from '../src/views/AthleteProfileEditScreen';
import WebAuthFlowScreen from '../src/webauth/WebAuthFlowScreen';
import { MainTabParamList, RootStackParamList } from '../src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [],
  config: {
    screens: {
      MainTabs: { path: '', screens: { HomeTab: '', MyGamesTab: 'my-games', ProfileTab: 'profile' } },
      TournamentScreen: 'tournament/:tournamentId',
      TournamentStatsScreen: 'tournament/:tournamentId/stats',
      GameDetailScreen: 'game/:gameId',
      TeamScreen: 'tournament/:tournamentId/team/:teamId',
      AthleteScreen: 'tournament/:tournamentId/athlete/:playerId',
      OrganizationScreen: 'organization/:organizationSlug',
      OrganizationsScreen: 'organizations',
      AccountScreen: 'my-account',
      AthleteProfileEditScreen: 'profile/edit',
      AuthScreen: 'auth',
      WebAuthFlowScreen: 'account/:purpose',
    },
  },
};

// React Navigation's own theme (screen backgrounds, transitions) from ours.
const navigationThemeFor = (theme: Theme) => {
  const base = theme.dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.textSecondary,
      background: theme.colors.background,
      card: theme.colors.primary,
      text: theme.colors.textPrimary,
      border: theme.colors.chromeBorder,
      notification: theme.colors.danger,
    },
  };
};

function MainTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.textSecondary,
        tabBarInactiveTintColor: theme.colors.onPrimaryMuted,
        tabBarStyle: {
          minHeight: 70,
          paddingTop: 7,
          paddingBottom: 8,
          backgroundColor: theme.colors.primary,
          borderTopWidth: theme.dark ? 1 : 0,
          borderTopColor: theme.colors.chromeBorder,
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
  const theme = useTheme();
  const navigationTheme = useMemo(() => navigationThemeFor(theme), [theme]);
  return (
    <NavigationIndependentTree>
      <NavigationContainer linking={linking} theme={navigationTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.onPrimary,
            headerTitleAlign: 'center',
            headerTitleStyle: { fontWeight: '800', fontSize: 16 },
            headerBackTitle: 'Voltar',
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="TournamentScreen" component={TournamentScreen} options={{ title: 'Campeonato' }} />
          <Stack.Screen name="TournamentStatsScreen" component={TournamentStatsScreen} options={{ title: 'Estatísticas' }} />
          <Stack.Screen name="GameDetailScreen" component={GameDetailScreen} options={{ title: 'Jogo' }} />
          <Stack.Screen name="TeamScreen" component={TeamScreen} options={{ title: 'Time' }} />
          <Stack.Screen name="AthleteScreen" component={AthleteScreen} options={{ title: 'Atleta' }} />
          <Stack.Screen name="OrganizationScreen" component={OrganizationScreen} options={{ title: 'Organização' }} />
          <Stack.Screen name="OrganizationsScreen" component={OrganizationsScreen} options={{ title: 'Organizações' }} />
          <Stack.Screen name="AccountScreen" component={AccountScreen} options={{ title: 'Minha conta' }} />
          <Stack.Screen name="AthleteProfileEditScreen" component={AthleteProfileEditScreen} options={{ title: 'Editar perfil' }} />
          <Stack.Screen name="AuthScreen" component={AuthScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WebAuthFlowScreen" component={WebAuthFlowScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}
