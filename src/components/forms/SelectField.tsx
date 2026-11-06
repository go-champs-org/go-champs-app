import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles, useTheme } from '../../theme/theme';

export type SelectOption = { id: string | null; label: string };

type Props = {
  label: string;
  options: SelectOption[];
  value: string | null;
  onChange: (id: string | null) => void;
};

// A form select: the field shows the current choice, and tapping it lists
// every option in a sheet over the screen.
export const SelectField = ({ label, options, value, onChange }: Props) => {
  const theme = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.id === value) ?? options[0];

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? ''}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={styles.trigger}
      >
        <Text numberOfLines={1} style={styles.value}>{current?.label}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.colors.onOliveSoft} />
      </TouchableOpacity>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityLabel="Fechar" style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={styles.list}>
              {options.map((option) => {
                const selected = option.id === current?.id;
                return (
                  <TouchableOpacity
                    key={option.id ?? 'all'}
                    accessibilityRole="radio"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setOpen(false);
                      onChange(option.id);
                    }}
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <Text numberOfLines={2} style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
                    {selected ? <Ionicons name="checkmark" size={18} color={theme.colors.olive} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  field: { gap: 6 },
  label: { color: theme.colors.subtleText, fontSize: 12, fontWeight: '700' },
  trigger: {
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
  },
  value: { flex: 1, color: theme.colors.ink, fontSize: 14, fontWeight: '700' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.backdrop },
  sheet: {
    maxHeight: '70%',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  sheetTitle: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  list: { flexGrow: 0 },
  option: {
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.subtleBorder,
  },
  optionSelected: { backgroundColor: theme.colors.tint },
  optionText: { flex: 1, color: theme.colors.ink, fontSize: 14, fontWeight: '600' },
  optionTextSelected: { color: theme.colors.olive, fontWeight: '800' },
}));
