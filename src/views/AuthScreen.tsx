import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme/theme';
import { useAuthSession } from '../auth/AuthSessionContext';
import { useAuthViewModel } from '../viewmodels/AuthViewModel';
import { WebAuthPurpose, webAuthCopy } from '../webauth/WebAuthPurpose';

type Props = { route: RouteProp<RootStackParamList, 'AuthScreen'> };
type AuthMode = 'signIn' | 'signUp' | 'recovery';

const modeToPurpose: Record<Exclude<AuthMode, 'signIn'>, WebAuthPurpose> = {
  signUp: 'signUp',
  recovery: 'accountRecovery',
};

const AuthScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn: persistSession } = useAuthSession();
  const [mode, setMode] = useState<AuthMode>(route.params?.initialMode || 'signIn');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { error, loading, signIn } = useAuthViewModel(persistSession);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
  };

  const submitSignIn = async () => {
    const authenticated = await signIn({ username, password });
    if (authenticated) navigation.goBack();
  };

  const openWebAuth = (purpose: WebAuthPurpose) => {
    navigation.navigate('WebAuthFlowScreen', { purpose });
  };

  if (mode !== 'signIn') {
    const purpose = modeToPurpose[mode];
    const copy = webAuthCopy[purpose];
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.header}>
          <Image accessibilityLabel="Go Champs" source={require('../../assets/images/logo-white-name.png')} style={styles.logo} />
          <TouchableOpacity accessibilityLabel="Voltar" onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={25} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{mode === 'signUp' ? 'Criar minha conta' : 'Recuperar conta'}</Text>
          <Text style={styles.description}>
            {mode === 'signUp'
              ? 'Continue no site seguro da Go Champs para concluir o cadastro com captcha.'
              : 'Continue no site seguro da Go Champs para recuperar o acesso.'}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={copy.action}
            onPress={() => openWebAuth(purpose)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>{copy.action}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => changeMode('signIn')} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Voltar para entrar</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
        <View style={styles.header}>
          <Image accessibilityLabel="Go Champs" source={require('../../assets/images/logo-white-name.png')} style={styles.logo} />
          <TouchableOpacity accessibilityLabel="Voltar" onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={25} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Entrar na minha conta</Text>
          <Text style={styles.description}>Acompanhe os jogos e resultados como um verdadeiro campeão.</Text>

          <AuthInput label="Usuário/E-mail" placeholder="meuemail@gmail.com" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <PasswordInput value={password} onChangeText={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Entrar"
            disabled={loading}
            onPress={submitSignIn}
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          >
            {loading ? <ActivityIndicator color={theme.colors.primary} /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
          </TouchableOpacity>

          <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>Ou</Text><View style={styles.line} /></View>
          <Text style={styles.linkRow}>
            Precisa criar uma conta?{' '}
            <Text onPress={() => changeMode('signUp')} style={styles.link}>Criar conta</Text>
          </Text>
          <Text style={styles.linkRow}>
            Esqueceu sua senha?{' '}
            <Text onPress={() => changeMode('recovery')} style={styles.link}>Recuperar senha</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

type InputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
};

const AuthInput = ({ label, placeholder, value, onChangeText, autoCapitalize = 'sentences', keyboardType = 'default' }: InputProps) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      accessibilityLabel={label}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      keyboardType={keyboardType}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.inactive}
      style={styles.input}
      value={value}
    />
  </View>
);

type PasswordProps = Omit<InputProps, 'label' | 'placeholder' | 'keyboardType'> & {
  label?: string;
  placeholder?: string;
  visible: boolean;
  onToggle: () => void;
};

const PasswordInput = ({
  label = 'Senha',
  placeholder = 'Insira sua senha',
  value,
  onChangeText,
  visible,
  onToggle,
}: PasswordProps) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.passwordField}>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.inactive}
        secureTextEntry={!visible}
        style={[styles.input, styles.passwordInput]}
        value={value}
      />
      <TouchableOpacity accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'} onPress={onToggle} style={styles.eyeButton}>
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={21} color={theme.colors.textPrimary} />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.primary },
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    minHeight: 72,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logo: { width: 66, height: 48, resizeMode: 'contain' },
  closeButton: {
    width: theme.layout.touchTarget,
    height: theme.layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    backgroundColor: theme.colors.background,
    flexGrow: 1,
  },
  title: { color: theme.colors.textPrimary, fontSize: theme.typography.display, fontWeight: '900' },
  description: {
    marginTop: theme.spacing.sm,
    color: theme.colors.mutedText,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  field: { marginTop: theme.spacing.lg },
  label: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.mutedText,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  input: {
    height: 56,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.textPrimary,
    fontSize: theme.typography.body,
  },
  passwordField: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 52,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: theme.spacing.md,
    color: theme.colors.danger,
    fontSize: theme.typography.bodySmall,
    fontWeight: '700',
  },
  primaryButton: {
    height: 52,
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: theme.colors.primary, fontSize: theme.typography.body, fontWeight: '900' },
  divider: {
    marginVertical: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.mutedText, fontSize: theme.typography.bodySmall },
  linkRow: {
    marginTop: theme.spacing.sm,
    color: theme.colors.mutedText,
    textAlign: 'center',
    fontSize: theme.typography.bodySmall,
  },
  link: { color: theme.colors.textSecondary, fontWeight: '900' },
  secondaryButton: {
    height: 48,
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
  },
  secondaryButtonText: { color: theme.colors.success, fontSize: theme.typography.bodySmall, fontWeight: '900' },
});

export default AuthScreen;
