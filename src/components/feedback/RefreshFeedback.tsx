import React from 'react';
import { RefreshControl, StyleProp, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles, Theme, useTheme } from '../../theme/theme';

// The pull-to-refresh spinner in the brand accent, readable on both themes.
// A plain element, not a component: ScrollView clones it on Android.
export const themedRefreshControl = (theme: Theme, refreshing: boolean, onRefresh: () => void) => (
  <RefreshControl
    refreshing={refreshing}
    onRefresh={onRefresh}
    tintColor={theme.colors.accent}
    colors={[theme.colors.accent]}
    progressBackgroundColor={theme.colors.surface}
  />
);

// Shown above content a refresh failed to update, which stays on screen.
export const RefreshNotice = ({ message, style }: { message: string | null; style?: StyleProp<ViewStyle> }) => {
  const theme = useTheme();
  const styles = useStyles();
  if (!message) return null;
  return (
    <View accessibilityRole="alert" style={[styles.container, style] as never} testID="refresh-notice">
      <Ionicons name="cloud-offline-outline" size={16} color={theme.colors.mutedText} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  text: {
    flex: 1,
    color: theme.colors.mutedText,
    fontSize: theme.typography.bodySmall,
  },
}));
