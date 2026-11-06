import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { SideMenu } from './SideMenu';

type Props = {
  // Only the home has a search; without these the header shows no search icon.
  searchOpen?: boolean;
  onSearchPress?: () => void;
};

// The top bar of the tabs: the logo, the home search toggle and the menu.
export const AppHeader = ({ searchOpen = false, onSearchPress }: Props) => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
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
              <Ionicons name={searchOpen ? 'close' : 'search'} size={24} color="#ffffff" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            onPress={() => setMenuOpen(true)}
            style={styles.iconButton}
          >
            <Ionicons name="menu" size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
      <SideMenu
        visible={menuOpen}
        activeItem={route.name === 'HomeTab' ? 'home' : undefined}
        onClose={() => setMenuOpen(false)}
        onOpenHome={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
        onOpenOrganizations={() => navigation.navigate('OrganizationsScreen')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.primary,
  },
  container: {
    minHeight: 68,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});
