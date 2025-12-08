import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { RouteProp, useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useTournamentHistoryViewModel } from '../viewmodels/TournamentHistoryViewModel';

type TournamentHistoryScreenRouteProp = RouteProp<RootStackParamList, 'TournamentHistoryScreen'>;

type Props = {
  route: TournamentHistoryScreenRouteProp;
};

const TournamentHistoryScreen: React.FC<Props> = ({ route }) => {
  const { id } = route.params;
  const { tournament, loading, error } = useTournamentHistoryViewModel(id);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.textSecondary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const handlePhasePress = (phase: any) => {
    const titleLower = (phase.title || '').toLowerCase();
    const typeLower = (phase.type || '').toLowerCase();

    // Navegação baseada no tipo e título da fase
    if (typeLower === 'draw' || titleLower.includes('playoff')) {
      // Playoffs - usar phase.id como tournamentId (compatibilidade com código existente)
      // O PlayoffViewModel busca a fase dentro do tournament
      navigation.navigate('PlayoffsView', { tournamentId: id });
    } else if (typeLower === 'elimination') {
      // Verificar se é classificação ou grupos
      if (titleLower.includes('classificação') || titleLower.includes('classificacao')) {
        // Classificação
        navigation.navigate('ClassificationView', { 
          phaseId: phase.id, 
          tournamentId: id 
        });
      } else if (
        titleLower.includes('primeira fase') || 
        titleLower.includes('segunda fase') ||
        titleLower.includes('1ª fase') ||
        titleLower.includes('2ª fase')
      ) {
        // Grupos (Primeira/Segunda Fase)
        navigation.navigate('GroupPhaseView', { 
          phaseId: phase.id, 
          tournamentId: id 
        });
      } else {
        // Fallback: se tem eliminations com múltiplos grupos, é GroupPhase
        // Se tem apenas uma elimination, pode ser Classification
        // Por padrão, vamos tentar GroupPhase se não for classificação
        if (!titleLower.includes('classificação') && !titleLower.includes('classificacao')) {
          navigation.navigate('GroupPhaseView', { 
            phaseId: phase.id, 
            tournamentId: id 
          });
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tournament?.data.phases || []}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handlePhasePress(item)}>
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    marginTop: 10,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'normal',
    color: theme.colors.textSecondary,
  },
  phaseTitle: {
    fontSize: 20,
  },
  errorText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

export default TournamentHistoryScreen;