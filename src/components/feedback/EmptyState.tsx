import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
};

export const EmptyState = ({ icon = 'basketball-outline', title, description }: Props) => (
  <View style={styles.container}>
    <View style={styles.icon}>
      <Ionicons name={icon} size={24} color={theme.colors.textSecondary} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    margin: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.titleSmall,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    marginTop: theme.spacing.xs,
    color: theme.colors.mutedText,
    fontSize: theme.typography.bodySmall,
    lineHeight: 19,
    textAlign: 'center',
  },
});
