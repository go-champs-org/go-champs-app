import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { RouteProp, useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useTournamentHistoryViewModel } from '../viewmodels/TournamentHistoryViewModel';
import { container } from '../di/container';

type TournamentHistoryScreenRouteProp = RouteProp<RootStackParamList, 'TournamentHistoryScreen'>;

type Props = {
  route: TournamentHistoryScreenRouteProp;
};

const TournamentHistoryScreen: React.FC<Props> = ({ route }) => {
  const { id, apiBaseUrl } = route.params;
  const { tournament, loading, error } = useTournamentHistoryViewModel(id, apiBaseUrl);
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
    const destination = container.resolvePhaseDestination.execute(phase);

    if (!destination) return;

    if (destination.route === 'PlayoffsView') {
      navigation.navigate('PlayoffsView', { tournamentId: id, phaseId: phase.id, apiBaseUrl });
      return;
    }

    if (destination.route === 'ClassificationView') {
      navigation.navigate('ClassificationView', {
        phaseId: phase.id,
        tournamentId: id,
        apiBaseUrl,
      });
      return;
    }

    navigation.navigate('GroupPhaseView', {
      phaseId: phase.id,
      tournamentId: id,
      apiBaseUrl,
    });
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
