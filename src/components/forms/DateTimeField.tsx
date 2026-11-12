import React, { useState } from 'react';
import { Modal, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { makeStyles, useTheme } from '../../theme/theme';

type Props = {
  label: string;
  mode: 'date' | 'datetime';
  /** The picked moment, or null while nothing is picked. */
  value: Date | null;
  /** How the picked moment reads in the field. */
  text: string;
  placeholder: string;
  onChange: (value: Date | null) => void;
  hint?: string;
  error?: string;
  disabled?: boolean;
};

// A form date (or date and time) field: it shows the picked moment, and
// tapping it opens the system picker. Android asks for the date, then the
// time; iOS shows the picker in a sheet over the screen.
export const DateTimeField = ({ label, mode, value, text, placeholder, onChange, hint, error, disabled }: Props) => {
  const theme = useTheme();
  const styles = useStyles();
  const [draft, setDraft] = useState<Date | null>(null);

  const openAndroid = (start: Date) =>
    DateTimePickerAndroid.open({
      value: start,
      mode: 'date',
      onValueChange: (_, date) => {
        if (mode === 'date') return onChange(date);
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          is24Hour: true,
          onValueChange: (__, time) => onChange(time),
        });
      },
    });

  const open = () => {
    const start = value ?? new Date();
    if (Platform.OS === 'android') openAndroid(start);
    else setDraft(start);
  };

  const close = () => setDraft(null);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${text || placeholder}`}
        accessibilityState={{ disabled, expanded: draft !== null }}
        disabled={disabled}
        onPress={open}
        style={[styles.trigger, error ? styles.triggerError : null]}
      >
        <Text numberOfLines={1} style={[styles.value, !text && styles.placeholder]}>
          {text || placeholder}
        </Text>
        <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={18} color={theme.colors.mutedText} />
      </TouchableOpacity>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
      {draft ? (
        <Modal transparent visible animationType="fade" onRequestClose={close}>
          <Pressable accessibilityLabel="Fechar" style={styles.backdrop} onPress={close}>
            <Pressable style={styles.sheet} onPress={() => undefined}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <DateTimePicker
                value={draft}
                mode={mode}
                // A wheel reaches a birth date decades back faster than paging months.
                display={mode === 'date' ? 'spinner' : 'inline'}
                locale="pt-BR"
                themeVariant={theme.dark ? 'dark' : 'light'}
                accentColor={theme.colors.olive}
                onValueChange={(_, date) => setDraft(date)}
              />
              <View style={styles.actions}>
                {value ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => {
                      close();
                      onChange(null);
                    }}
                    style={styles.action}
                  >
                    <Text style={styles.clearText}>Limpar</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => {
                    close();
                    onChange(draft);
                  }}
                  style={[styles.action, styles.confirm]}
                >
                  <Text style={styles.confirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  field: { gap: 4, paddingVertical: 10, paddingRight: theme.spacing.sm },
  label: { color: theme.colors.mutedText, fontSize: 12, lineHeight: 17 },
  trigger: {
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  triggerError: { borderColor: theme.colors.danger },
  value: { flex: 1, color: theme.colors.textPrimary, fontSize: 15 },
  placeholder: { color: theme.colors.subtleText },
  error: { color: theme.colors.danger, fontSize: 12, fontWeight: '600' },
  hint: { color: theme.colors.subtleText, fontSize: 12 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.backdrop },
  sheet: {
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  sheetTitle: { color: theme.colors.ink, fontSize: 16, fontWeight: '900' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: theme.spacing.sm },
  action: { minHeight: 44, paddingHorizontal: theme.spacing.md, justifyContent: 'center', borderRadius: theme.radius.md },
  confirm: { backgroundColor: theme.colors.olive },
  clearText: { color: theme.colors.danger, fontSize: 15, fontWeight: '700' },
  confirmText: { color: theme.colors.onDark, fontSize: 15, fontWeight: '800' },
}));
