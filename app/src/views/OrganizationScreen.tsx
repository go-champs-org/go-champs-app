// src/views/TorneiosScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import { useOrganizationViewModel } from '../viewmodels/OrganizationViewModel';

const TorneiosScreen = () => {
  const { organizations, loading } = useOrganizationViewModel();
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar organizações com base no searchQuery
  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Barra de Pesquisa */}
      <TextInput
        style={styles.searchBar}
        placeholder="Pesquisar organizações..."
        value={searchQuery}
        onChangeText={setSearchQuery} // Atualiza o estado ao digitar
      />

      {/* Loader enquanto os dados carregam */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.textSecondary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredOrganizations} // Mostra apenas os resultados filtrados
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.subtitle}>{item.slug}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  customHeader: {
    height: 60,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: theme.colors.background,
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchBar: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    margin: 16,
  },
  loader: {
    marginTop: 20,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.mutedText,
  },
});

export default TorneiosScreen;
