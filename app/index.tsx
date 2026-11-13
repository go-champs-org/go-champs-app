import React, { useEffect, useMemo } from 'react';
import { AppState, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationIndependentTree } from '@react-navigation/core';
import { DarkTheme, DefaultTheme, NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
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
import GoChampsLinkScreen from '../src/views/GoChampsLinkScreen';
import RegistrationInviteScreen from '../src/views/RegistrationInviteScreen';
import { GO_CHAMPS_LINK_PREFIXES, stateForGoChampsPath } from '../src/navigation/goChampsLinkRoutes';
import { MainTabParamList, RootStackParamList } from '../src/navigation/types';
import { analyticsScreens } from '../src/core/analytics/analytics';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const config: LinkingOptions<RootStackParamList>['config'] = {
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
    RegistrationInviteScreen: 'invite/:inviteId',
  },
};

// On the web the app's own paths above map the browser URL. On iOS and Android
// the app opens go-champs.com links instead (universal links / App Links):
// their paths are the site's, resolved by GoChampsLinkScreen. Expo Router
// stays on this route for them (see ./+native-intent).
const linking: LinkingOptions<RootStackParamList> =
  Platform.OS === 'web'
    ? { prefixes: [], config }
    : {
        // Linking.createURL('/') adds Expo Go's exp://<host>/--/ during
        // development; in the store build it is the app's own scheme.
        prefixes: [...GO_CHAMPS_LINK_PREFIXES, Linking.createURL('/')],
        config,
        getStateFromPath: (path) => stateForGoChampsPath(path),
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
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const trackScreen = () => analyticsScreens.navigate(navigationRef.getCurrentRoute());

  useEffect(() => {
    const update = (state: string | null | undefined) => analyticsScreens.setActive(state == null || state === 'active');
    update(AppState.currentState);
    const subscription = AppState.addEventListener('change', update);
    return () => { subscription.remove(); analyticsScreens.dispose(); };
  }, []);
  return (
    <NavigationIndependentTree>
      <NavigationContainer ref={navigationRef} linking={linking} theme={navigationTheme} onReady={trackScreen} onStateChange={trackScreen}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.onPrimary,
            headerTitleAlign: 'center',
            headerTitleStyle: { fontWeight: '800', fontSize: 16 },
            headerBackTitle: 'Voltar',
            headerBackButtonDisplayMode: 'minimal',
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
          <Stack.Screen name="GoChampsLinkScreen" component={GoChampsLinkScreen} options={{ title: 'Go Champs' }} />
          <Stack.Screen name="RegistrationInviteScreen" component={RegistrationInviteScreen} options={{ title: 'Inscrição' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}
