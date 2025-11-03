import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { useTournamentsViewModel } from '../viewmodels/TournamentsViewModel';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types'; // Adjust the path as necessary

const TournamentsScreen = () => {
  const { tournaments, loading } = useTournamentsViewModel();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState(''); // Add state for searchQuery

  // Filtrar torneios com base no searchQuery
  const filteredTournaments = tournaments.filter((tournament) =>
    tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Barra de Pesquisa */}
      <TextInput
        style={styles.searchBar}
        placeholder="Pesquisar torneios..."
        value={searchQuery}
        onChangeText={setSearchQuery} // Atualiza o estado ao digitar
      />

      {/* Loader enquanto os dados carregam */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.textSecondary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredTournaments} // Mostra apenas os resultados filtrados
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('TournamentHistoryScreen', { id: item.id })}
            >
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.subtitle}>{item.organization.name}</Text>
            </TouchableOpacity>
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
    color: theme.colors.textSecondary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.mutedText,
  },
});

export default TournamentsScreen;