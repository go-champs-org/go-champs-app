import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useOrganizationViewModel } from '../viewmodels/OrganizationViewModel';
import { AppHeader } from '../components/layout/AppHeader';
import { SearchBar } from '../components/search/SearchBar';
import { EmptyState } from '../components/feedback/EmptyState';

const OrganizationScreen = () => {
  const { organizations, loading } = useOrganizationViewModel();
  const [searchQuery, setSearchQuery] = useState('');
  const filtered = organizations.filter((organization) => organization.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={styles.screen}>
      <AppHeader />
      <View style={styles.searchWrap}><SearchBar value={searchQuery} onChangeText={setSearchQuery} /></View>
      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={theme.colors.accent} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={styles.pageTitle}>Organizações</Text>}
          ListEmptyComponent={<EmptyState icon="people-outline" title="Nenhuma organização encontrada" />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.icon}><Ionicons name="people-outline" size={20} color={theme.colors.success} /></View>
              <View style={styles.cardContent}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.subtitle}>{item.slug}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  searchWrap: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.sm, backgroundColor: theme.colors.primary },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { width: '100%', maxWidth: theme.layout.contentMaxWidth, alignSelf: 'center', padding: theme.spacing.md },
  pageTitle: { marginBottom: theme.spacing.md, color: theme.colors.textPrimary, fontSize: theme.typography.title, fontWeight: '900' },
  card: { minHeight: 76, marginBottom: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card, flexDirection: 'row', alignItems: 'center', ...theme.shadow.card },
  icon: { width: 40, height: 40, borderRadius: theme.radius.md, backgroundColor: theme.colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, minWidth: 0, marginHorizontal: theme.spacing.md },
  title: { color: theme.colors.textPrimary, fontSize: theme.typography.body, fontWeight: '800' },
  subtitle: { marginTop: 2, color: theme.colors.mutedText, fontSize: theme.typography.bodySmall },
});

export default OrganizationScreen;
