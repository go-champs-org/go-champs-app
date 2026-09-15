import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { RouteProp, useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useTournamentHistoryViewModel } from '../viewmodels/TournamentHistoryViewModel';
import { container } from '../di/container';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../components/feedback/EmptyState';

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
        ListHeaderComponent={<Text style={styles.pageTitle}>Escolha uma fase</Text>}
        ListEmptyComponent={<EmptyState icon="layers-outline" title="Nenhuma fase disponível" />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handlePhasePress(item)}>
            <View style={styles.card}>
              <View style={styles.phaseIcon}><Ionicons name="layers-outline" size={20} color={theme.colors.success} /></View>
              <Text style={styles.title}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
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
    backgroundColor: theme.colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    width: '100%',
    maxWidth: theme.layout.contentMaxWidth,
    alignSelf: 'center',
    padding: theme.spacing.md,
  },
  pageTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.title,
    fontWeight: '900',
  },
  card: {
    minHeight: 72,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadow.card,
  },
  phaseIcon: {
    width: 40,
    height: 40,
    marginRight: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: theme.typography.body,
    fontWeight: '800',
    color: theme.colors.textPrimary,
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
