import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles, useTheme } from '../../theme/theme';
import type { useDeleteAccountViewModel } from '../../viewmodels/DeleteAccountViewModel';

type Props = {
  model: ReturnType<typeof useDeleteAccountViewModel>;
};

export const DELETE_ACCOUNT_WARNING =
  'Excluir sua conta é permanente. Seu e-mail, username, perfil de atleta e perfil de oficial serão apagados e não poderão ser recuperados. Seus registros em torneios continuam, sem vínculo com a sua conta.';

/** Minha conta > Excluir conta: the permanent-deletion warning and the password confirmation. */
export const DeleteAccountDialog = ({ model }: Props) => {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <Modal transparent visible={model.visible} animationType="fade" onRequestClose={model.cancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Pressable accessibilityLabel="Fechar" style={styles.backdrop} onPress={model.cancel}>
          <Pressable style={styles.card} onPress={() => undefined}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <View style={styles.icon}>
                <Ionicons name="warning-outline" size={24} color={theme.colors.danger} />
              </View>
              <Text accessibilityRole="header" style={styles.title}>
                Excluir conta
              </Text>
              <Text style={styles.body}>{DELETE_ACCOUNT_WARNING}</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  accessibilityLabel="Senha"
                  autoCapitalize="none"
                  autoComplete="current-password"
                  autoCorrect={false}
                  editable={!model.deleting}
                  onChangeText={model.setPassword}
                  onSubmitEditing={() => void model.confirm()}
                  placeholder="Digite sua senha para confirmar"
                  placeholderTextColor={theme.colors.inactive}
                  secureTextEntry
                  style={styles.input}
                  textContentType="password"
                  value={model.password}
                />
              </View>

              {model.error ? (
                <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
                  <Ionicons name="alert-circle" size={18} color={theme.colors.onDangerSoft} />
                  <Text style={styles.errorText}>{model.error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ disabled: !model.canConfirm, busy: model.deleting }}
                disabled={!model.canConfirm}
                onPress={() => void model.confirm()}
                style={[styles.confirm, !model.canConfirm && styles.disabled]}
              >
                {model.deleting ? <ActivityIndicator color={theme.colors.card} /> : null}
                <Text style={styles.confirmText}>Excluir conta definitivamente</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                disabled={model.deleting}
                onPress={model.cancel}
                style={styles.cancel}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const useStyles = makeStyles((theme) => ({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: theme.colors.backdrop,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    alignSelf: 'center',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.title,
    fontWeight: '900',
  },
  body: {
    color: theme.colors.mutedText,
    fontSize: 14,
    lineHeight: 21,
  },
  field: {
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  input: {
    height: 52,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.textPrimary,
    fontSize: theme.typography.body,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.dangerSoft,
  },
  errorText: {
    flex: 1,
    color: theme.colors.onDangerSoft,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  confirm: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  confirmText: {
    color: theme.colors.card,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  cancel: {
    minHeight: theme.layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
}));
