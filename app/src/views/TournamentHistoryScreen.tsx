import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useTournamentHistoryViewModel } from '../viewmodels/TournamentHistoryViewModel';

type TournamentHistoryScreenRouteProp = RouteProp<RootStackParamList, 'TournamentHistoryScreen'>;

type Props = {
  route: TournamentHistoryScreenRouteProp;
};

const TournamentHistoryScreen: React.FC<Props> = ({ route }) => {
  const { id } = route.params;
  const { tournament, loading } = useTournamentHistoryViewModel(id);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tournament?.data.phases || []}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
          </View>
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  phaseTitle: {
    fontSize: 20,
  },
});

export default TournamentHistoryScreen;