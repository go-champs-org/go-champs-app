import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tournament } from '../../models/Tournament';
import { SelectablePhase } from '../../viewmodels/TournamentEntryViewModel';
import { theme } from '../../theme/theme';

type Props = {
  phases: SelectablePhase[];
  tournament: Tournament | null;
  visible: boolean;
  onClose: () => void;
  onSelectPhase: (phase: SelectablePhase) => void;
};

const iconByRoute: Record<SelectablePhase['route'], keyof typeof Ionicons.glyphMap> = {
  ClassificationView: 'stats-chart-outline',
  GroupPhaseView: 'grid-outline',
  PlayoffsView: 'git-branch-outline',
};

export const PhasePickerModal = ({ phases, tournament, visible, onClose, onSelectPhase }: Props) => (
  <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <TouchableOpacity style={styles.backdropTapArea} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>{tournament?.organization.name}</Text>
            <Text style={styles.title} numberOfLines={2}>
              Escolha uma fase
            </Text>
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.tournamentName} numberOfLines={2}>
          {tournament?.name}
        </Text>

        <View style={styles.phaseList}>
          {phases.map((phase) => (
            <TouchableOpacity key={phase.phase.id} style={styles.phaseCard} onPress={() => onSelectPhase(phase)}>
              <View style={styles.phaseIcon}>
                <Ionicons name={iconByRoute[phase.route]} size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.phaseContent}>
                <Text style={styles.phaseTitle}>{phase.phase.title || 'Fase'}</Text>
                <Text style={styles.phaseDescription}>{phase.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    justifyContent: 'flex-end',
  },
  backdropTapArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  kicker: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '900',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tournamentName: {
    color: theme.colors.mutedText,
    fontSize: 14,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  phaseList: {
    gap: theme.spacing.sm,
  },
  phaseCard: {
    minHeight: 72,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    marginRight: theme.spacing.md,
  },
  phaseContent: {
    flex: 1,
    minWidth: 0,
  },
  phaseTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  phaseDescription: {
    color: theme.colors.mutedText,
    fontSize: 13,
    marginTop: 2,
  },
});

