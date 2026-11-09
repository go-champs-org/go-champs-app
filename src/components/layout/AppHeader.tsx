import React, { useState } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { makeStyles, useTheme } from '../../theme/theme';
import { SideMenu } from './SideMenu';

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
  const route = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={[styles.container, searchOpen && styles.containerJoined]}>
        <Image accessibilityLabel="Logo Go Champs" source={require('../../../assets/images/logo-white-name.png')} style={styles.logo} />
        <View style={styles.actions}>
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
