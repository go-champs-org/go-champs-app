import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { makeStyles, useTheme } from '../../theme/theme';
import { SideMenu } from './SideMenu';

import { useAuthSession } from '../../auth/AuthSessionContext';

type Props = {
  // Only the home has a search; without these the header shows no search icon.
  searchOpen?: boolean;
  onSearchPress?: () => void;
};

// The top bar of the tabs: the logo, the home search toggle and the menu.
export const AppHeader = ({ searchOpen = false, onSearchPress }: Props) => {
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<any>();
  const { user, bootstrapping } = useAuthSession();
  const signIn = () => navigation.navigate('AuthScreen', { initialMode: 'signIn' });
  const route = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={[styles.container, searchOpen && styles.containerJoined]}>
        <Image accessibilityLabel="Logo Go Champs" source={require('../../../assets/images/logo-white-name.png')} style={styles.logo} />
        <View style={styles.actions}>
          {!bootstrapping && !user && onSearchPress && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Entrar na conta"
            onPress={signIn} style={styles.login}><Text style={styles.loginText}>Entrar</Text></TouchableOpacity>}
          {onSearchPress ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={searchOpen ? 'Fechar busca' : 'Abrir busca'}
              accessibilityState={{ expanded: searchOpen }}
              onPress={onSearchPress}
              style={styles.iconButton}
            >
              <Ionicons name={searchOpen ? 'close' : 'search'} size={24} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            onPress={() => setMenuOpen(true)}
            style={styles.iconButton}
          >
            <Ionicons name="menu" size={28} color={theme.colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      <SideMenu
        visible={menuOpen}
        activeItem={route.name === 'HomeTab' ? 'home' : undefined}
        onClose={() => setMenuOpen(false)}
        onOpenHome={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
        onOpenProfile={() => navigation.navigate('MainTabs', { screen: 'ProfileTab' })}
        onSignIn={!bootstrapping && !user ? signIn : undefined}
        onOpenOrganizations={() => navigation.navigate('OrganizationsScreen')}
        onOpenAccount={() => navigation.navigate('AccountScreen')}
      />
    </SafeAreaView>
  );
};

const useStyles = makeStyles((theme) => ({
  safeArea: {
    backgroundColor: theme.colors.primary,
  },
  container: {
    minHeight: 68,
    backgroundColor: theme.colors.primary,
    // A hairline under the chrome where it shares the page color (dark).
    borderBottomWidth: theme.dark ? 1 : 0,
    borderBottomColor: theme.colors.chromeBorder,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // The open home search continues the chrome and draws the line itself.
  containerJoined: {
    borderBottomColor: 'transparent',
  },
  logo: {
    height: 52,
    width: 72,
    resizeMode: 'contain',
  },
  login: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  loginText: { color: theme.colors.onPrimary, fontSize: 14, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
