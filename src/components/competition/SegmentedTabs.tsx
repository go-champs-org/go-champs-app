import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme/theme';

type Props<T extends string> = {
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

export const SegmentedTabs = <T extends string>({ items, value, onChange }: Props<T>) => (
  <View style={styles.container}>
    {items.map((item) => {
      const selected = item === value;
      return (
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          key={item}
          onPress={() => onChange(item)}
          style={[styles.item, selected && styles.itemSelected]}
        >
          <Text style={[styles.label, selected && styles.labelSelected]}>{item}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: 4,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
    flexDirection: 'row',
  },
  item: {
    flex: 1,
    minHeight: 40,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  itemSelected: {
    backgroundColor: theme.colors.primary,
  },
  label: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.bodySmall,
    fontWeight: '700',
  },
  labelSelected: {
    color: theme.colors.surface,
  },
});
