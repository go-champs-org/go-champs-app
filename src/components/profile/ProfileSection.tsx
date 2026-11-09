import React, { ReactNode } from 'react';
import { ActivityIndicator, KeyboardTypeOptions, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles, useTheme } from '../../theme/theme';

type SectionProps = {
  title: string;
  description?: string;
  /** Shows the "Privado" badge next to the title. */
  isPrivate?: boolean;
  /** The section's single edit toggle; hidden while editing. */
  onEdit?: () => void;
  editLabel?: string;
  children: ReactNode;
  footnote?: string;
};

/** A titled block of the account page: heading, optional edit toggle, card. */
export const ProfileSection = ({
  title,
  description,
  isPrivate,
  onEdit,
  editLabel,
  children,
  footnote,
}: SectionProps) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {isPrivate ? (
          <View style={styles.privateBadge}>
            <Ionicons name="lock-closed-outline" size={13} color={theme.colors.onOliveSoft} />
            <Text style={styles.privateText}>Privado</Text>
          </View>
        ) : null}
        {onEdit ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={editLabel ?? `Editar ${title.toLowerCase()}`}
            onPress={onEdit}
            style={styles.textButton}
          >
            <Text style={styles.textButtonLabel}>Editar</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children}
      {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
    </View>
  );
};

export const ProfileCard = ({ children }: { children: ReactNode }) => {
  const styles = useStyles();
  return <View style={styles.card}>{children}</View>;
};

export const RowDivider = () => {
  const styles = useStyles();
  return <View style={styles.divider} />;
};

type RowProps = {
  label: string;
  value: string | null;
  /** Shown, muted, when there is no value. */
  placeholder?: string;
  leading?: ReactNode;
  action?: { label: string; onPress: () => void; accessibilityLabel?: string };
};

/** A read-only label/value row; `action` is a row-level link (e.g. reset password). */
export const ProfileRow = ({ label, value, placeholder = 'Não adicionado', leading, action }: RowProps) => {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      {leading}
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, !value && styles.rowPlaceholder]}>{value || placeholder}</Text>
      </View>
      {action ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel ?? action.label}
          onPress={action.onPress}
          style={styles.textButton}
        >
          <Text style={styles.textButtonLabel}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  editable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
};

export const ProfileField = ({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  editable = true,
  keyboardType,
  autoCapitalize = 'none',
  maxLength,
}: FieldProps) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.field}>
      <Text style={styles.rowLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.subtleText}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        maxLength={maxLength}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
};

type ActionsProps = {
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
};

/** Cancel / Save for a section in edit mode, with its saving state and error. */
export const SectionActions = ({ saving, error, onCancel, onSave, saveLabel = 'Salvar' }: ActionsProps) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.actionsBlock}>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.sectionError}>
          {error}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={saving}
          onPress={onCancel}
          style={[styles.textButton, saving && styles.disabled]}
        >
          <Text style={styles.textButtonLabel}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={saving ? 'Salvando' : saveLabel}
          accessibilityState={{ disabled: saving, busy: saving }}
          disabled={saving}
          onPress={onSave}
          style={[styles.saveButton, saving && styles.disabled]}
        >
          {saving ? <ActivityIndicator size="small" color={theme.colors.onOlive} /> : null}
          <Text style={styles.saveButtonLabel}>{saving ? 'Salvando...' : saveLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

type EmptyProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export const EmptyProfileCard = ({ title, description, actionLabel, onAction }: EmptyProps) => {
  const styles = useStyles();
  return (
    <View style={[styles.card, styles.emptyCard]}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={onAction} style={[styles.textButton, styles.emptyAction]}>
        <Text style={styles.textButtonLabel}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  section: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    gap: 12,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
  },
  description: {
    color: theme.colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.tint,
  },
  privateText: {
    color: theme.colors.onOliveSoft,
    fontSize: 12,
    fontWeight: '500',
  },
  footnote: {
    color: theme.colors.mutedText,
    fontSize: 12,
    lineHeight: 17,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 14,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.sm,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.subtleBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    minHeight: theme.layout.touchTarget,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    lineHeight: 17,
  },
  rowValue: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
  },
  rowPlaceholder: {
    color: theme.colors.subtleText,
  },
  field: {
    gap: 4,
    paddingVertical: 10,
    paddingRight: theme.spacing.sm,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    fontSize: 15,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  fieldError: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    color: theme.colors.subtleText,
    fontSize: 12,
  },
  textButton: {
    minHeight: theme.layout.touchTarget,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textButtonLabel: {
    color: theme.colors.olive,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  actionsBlock: {
    gap: theme.spacing.sm,
    paddingVertical: 12,
    paddingRight: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  saveButton: {
    minHeight: theme.layout.touchTarget,
    paddingHorizontal: 20,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.olive,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  saveButtonLabel: {
    color: theme.colors.onOlive,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionError: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  emptyCard: {
    paddingTop: 20,
    paddingBottom: theme.spacing.md,
    paddingRight: theme.spacing.md,
    gap: 10,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  emptyDescription: {
    color: theme.colors.mutedText,
    fontSize: 12,
    lineHeight: 17,
  },
  emptyAction: {
    alignSelf: 'flex-start',
  },
}));
