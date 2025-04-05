import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Dimensions } from 'react-native'; // Add Dimensions import
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { fetchPlayoffData, fetchGamesByPhaseId } from '../services/PlayoffService'; // Adicionado fetchGamesByPhaseId
import { Draw } from '../models/PlayoffModel'; // Adicionado Game
import { Game, GameResponse } from '../models/GameModel'; // Adicionado Game

type PlayoffsViewRouteProp = RouteProp<RootStackParamList, 'PlayoffsView'>;

type Props = {
  route: PlayoffsViewRouteProp;
};

const PlayoffsView: React.FC<Props> = ({ route }) => {
  const { tournamentId } = route.params;
  const [draws, setDraws] = useState<Draw[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayoffData = async () => {
      try {
        const [responseData, gamesData] = await Promise.all([
          fetchPlayoffData(tournamentId),
          fetchGamesByPhaseId(tournamentId),
        ]);

        const sortedDraws = responseData.data.draws.sort((a, b) => a.order - b.order);
        setDraws(sortedDraws);
        setGames(gamesData); // Corrigido para usar gamesData diretamente

        console.log('Fetched draws data:', sortedDraws);
        console.log('Fetched games data:', gamesData); // Confirmar que gamesData é um array
      } catch (error) {
        console.error('Failed to fetch playoff data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayoffData();
  }, [tournamentId]);

  if (loading) {
    console.log('Loading playoff data...'); // Log para verificar estado de carregamento
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!draws || draws.length === 0) {
    console.log('No playoff data available to display.'); // Log para verificar ausência de dados
    return (
      <View style={styles.loaderContainer}>
        <Text>No playoff data available.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={draws}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
          {item.matches.map((match) => {
            const firstTeam =
              games?.find((game) => game.away_team?.id === match.first_team_id)?.away_team?.name ||
              games?.find((game) => game.home_team?.id === match.first_team_id)?.home_team?.name;

            const secondTeam =
              games?.find((game) => game.away_team?.id === match.second_team_id)?.away_team?.name ||
              games?.find((game) => game.home_team?.id === match.second_team_id)?.home_team?.name;

            return (
              <View key={match.id} style={styles.card}>
                <Text style={styles.matchName}>{match.name}</Text>
                <View style={styles.matchContent}>
                  <Text style={styles.teamName}>{firstTeam || ''}</Text>
                  <Text style={styles.score}>{match.first_team_score || ''}</Text>
                  <Text style={styles.score}>x</Text>
                  <Text style={styles.score}>{match.second_team_score || ''}</Text>
                  <Text style={styles.teamName}>{secondTeam || ''}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    />
  );
};

const screenWidth = Dimensions.get('window').width; // Get screen width

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center', // Center section content
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center', // Center section title
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 20, // Updated padding to 20 on all sides
    marginBottom: 8,
    width: screenWidth - 20, // Set card width relative to screen size
    alignSelf: 'center', // Center the card horizontally
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center', // Center card content
  },
  matchName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Ensure equal spacing between elements
    width: '100%', // Match content width to parent
  },
  teamName: {
    fontSize: 16,
    color: '#c22',
    marginHorizontal: 4,
    textAlign: 'center', // Center-align team names
    flex: 1, // Allow team names to take up equal space
    flexWrap: 'wrap', // Enable wrapping for long names
  },
  score: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    marginHorizontal: 2, // Reduced margin for closer alignment
    textAlign: 'center', // Center-align scores
    width: 30, // Reduced width for scores
  },
});

export default PlayoffsView;
