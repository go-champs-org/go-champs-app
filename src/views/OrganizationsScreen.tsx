import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useOrganizationsViewModel } from '../viewmodels/OrganizationsViewModel';
import { theme } from '../theme/theme';
import { ContentShell } from '../components/layout/ContentShell';
import { EmptyState } from '../components/feedback/EmptyState';
import { SearchBar } from '../components/search/SearchBar';
import { OrganizationRow } from '../components/organization/OrganizationRow';

// The organizations list opened from the menu, with a search over all of them.
const OrganizationsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { organizations, query, setQuery, isSearching, loading } = useOrganizationsViewModel();

  return (
    <View style={styles.screen}>
      <ContentShell style={styles.content}>
        <View style={styles.search}>
          <SearchBar variant="light" value={query} onChangeText={setQuery} placeholder="Buscar organização" />
        </View>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        ) : (
          <FlatList
            testID="organizations-screen"
            data={organizations}
            keyExtractor={(organization) => organization.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <EmptyState
                icon="business-outline"
                title={isSearching ? 'Nenhuma organização encontrada' : 'Nenhuma organização vista ainda'}
              />
            }
            renderItem={({ item }) => (
              <OrganizationRow
                organization={item}
                onPress={() => navigation.navigate('OrganizationScreen', { organizationSlug: item.slug })}
              />
            )}
          />
        )}
      </ContentShell>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  search: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl, gap: theme.spacing.sm },
});

export default OrganizationsScreen;
