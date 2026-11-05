import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LabelledCoach } from '../../domain/usecases/shared/teamPresentation';
import { theme } from '../../theme/theme';

// The public profile pages put a green bar before every section title.
export const SectionTitle = ({ title }: { title: string }) => (
  <View style={styles.titleRow}>
    <View style={styles.titleBar} />
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
  </View>
);

// The staff answers "who is this team" with the roster, under it.
export const CoachingStaffCard = ({ coaches }: { coaches: LabelledCoach[] }) => (
  <View style={styles.card} testID="team-coaches">
    <SectionTitle title="Comissão técnica" />
    <View style={styles.list}>
      {coaches.map((coach) => (
        <View key={coach.id} style={styles.coach}>
          <Text style={styles.name}>{coach.name}</Text>
          {coach.label ? <Text style={styles.label}>{coach.label}</Text> : null}
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  titleBar: { width: 4, height: 18, borderRadius: 2, backgroundColor: theme.colors.accent },
  title: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '600' },
  list: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
  coach: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: theme.spacing.sm },
  name: { color: theme.colors.textPrimary, fontSize: theme.typography.body, fontWeight: '500' },
  label: { color: theme.colors.mutedText, fontSize: theme.typography.bodySmall },
});
