import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme/theme';
import { useAuthSession } from '../auth/AuthSessionContext';
import { useAuthViewModel } from '../viewmodels/AuthViewModel';

type Props = { route: RouteProp<RootStackParamList, 'AuthScreen'> };
type AuthMode = 'signIn' | 'signUp' | 'recovery';

const copy: Record<AuthMode, { title: string; description: string; action: string }> = {
  signIn: {
    title: 'Entrar na minha conta',
    description: 'Acompanhe os jogos e resultados como um verdadeiro campeão.',
    action: 'Entrar',
  },
  signUp: {
    title: 'Criar minha conta',
    description: 'Fique por dentro dos jogos e resultados tudo em um só lugar.',
    action: 'Criar conta',
  },
  recovery: {
    title: 'Recuperar conta',
    description: 'Sem stress. A gente te ajuda a voltar pro jogo.',
    action: 'Recuperar conta',
  },
};

const secureUrl: Record<Exclude<AuthMode, 'signIn'>, string> = {
  signUp: 'https://go-champs.com/SignUp',
  recovery: 'https://go-champs.com/AccountRecovery',
};

const validEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const AuthScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation();
  const { signIn: persistSession } = useAuthSession();
  const [mode, setMode] = useState<AuthMode>(route.params?.initialMode || 'signIn');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatedPassword, setRepeatedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { error, loading, signIn } = useAuthViewModel(persistSession);
  const content = copy[mode];

  const changeMode = (nextMode: AuthMode) => {
    setFormError(null);
    setMode(nextMode);
  };

  const submitSignIn = async () => {
    const authenticated = await signIn({ username, password });
    if (authenticated) navigation.goBack();
  };

  const continueOnWebsite = async () => {
    if (mode === 'signUp') {
      if (!username.trim() || !validEmail(email) || password.length < 6 || password !== repeatedPassword) {
        setFormError('Revise seus dados: use e-mail válido e confirme uma senha de pelo menos 6 caracteres.');
        return;
      }
    }

    if (mode === 'recovery' && !validEmail(email)) {
      setFormError('Informe um e-mail válido para recuperar sua conta.');
      return;
    }

    setFormError(null);
    await Linking.openURL(secureUrl[mode as Exclude<AuthMode, 'signIn'>]);
  };

  const currentError = error || formError;

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
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.description}>{content.description}</Text>

          {mode === 'signIn' ? (
            <>
              <AuthInput label="Usuário/E-mail" placeholder="meuemail@gmail.com" value={username} onChangeText={setUsername} autoCapitalize="none" />
              <PasswordInput value={password} onChangeText={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
            </>
          ) : null}

          {mode === 'signUp' ? (
            <>
              <AuthInput label="Nome de usuário" placeholder="Insira seu nome de usuário" value={username} onChangeText={setUsername} autoCapitalize="none" />
              <AuthInput label="Email" placeholder="meuemail@gmail.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <PasswordInput label="Senha" placeholder="Crie sua senha" value={password} onChangeText={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
              <PasswordInput label="Senha novamente" placeholder="Confirme a senha criada" value={repeatedPassword} onChangeText={setRepeatedPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
            </>
          ) : null}

          {mode === 'recovery' ? (
            <AuthInput label="Email" placeholder="meuemail@gmail.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          ) : null}

          {currentError ? <Text accessibilityRole="alert" style={styles.error}>{currentError}</Text> : null}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={content.action}
            disabled={loading}
            onPress={mode === 'signIn' ? submitSignIn : continueOnWebsite}
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          >
            {loading ? <ActivityIndicator color={theme.colors.primary} /> : <Text style={styles.primaryButtonText}>{content.action}</Text>}
          </TouchableOpacity>

          {mode === 'signIn' ? (
            <>
              <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>Ou</Text><View style={styles.line} /></View>
              <Text style={styles.linkRow}>Precisa criar uma conta? <Text onPress={() => changeMode('signUp')} style={styles.link}>Criar conta</Text></Text>
              <Text style={styles.linkRow}>Esqueceu sua senha? <Text onPress={() => changeMode('recovery')} style={styles.link}>Recuperar senha</Text></Text>
            </>
          ) : (
            <TouchableOpacity accessibilityRole="button" onPress={() => changeMode('signIn')} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Voltar para entrar</Text>
            </TouchableOpacity>
          )}
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

type PasswordProps = Omit<InputProps, 'label' | 'placeholder' | 'keyboardType'> & { label?: string; placeholder?: string; visible: boolean; onToggle: () => void };

const PasswordInput = ({ label = 'Senha', placeholder = 'Insira sua senha', value, onChangeText, visible, onToggle }: PasswordProps) => (
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
  header: { minHeight: 72, paddingHorizontal: theme.spacing.md, alignItems: 'center', backgroundColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'space-between' },
  logo: { width: 66, height: 48, resizeMode: 'contain' },
  closeButton: { width: theme.layout.touchTarget, height: theme.layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  title: { color: theme.colors.textPrimary, fontSize: theme.typography.display, fontWeight: '900' },
  description: { marginTop: theme.spacing.sm, color: theme.colors.mutedText, fontSize: theme.typography.body, lineHeight: 22 },
  field: { marginTop: theme.spacing.lg },
  label: { marginBottom: theme.spacing.xs, color: theme.colors.mutedText, fontSize: theme.typography.caption, fontWeight: '800' },
  input: { height: 56, paddingHorizontal: theme.spacing.md, color: theme.colors.textPrimary, backgroundColor: theme.colors.surfaceMuted, borderBottomWidth: 1, borderBottomColor: theme.colors.textPrimary, fontSize: theme.typography.body },
  passwordField: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  eyeButton: { position: 'absolute', right: 0, top: 0, width: 52, height: 56, alignItems: 'center', justifyContent: 'center' },
  error: { marginTop: theme.spacing.md, color: theme.colors.danger, fontSize: theme.typography.bodySmall, fontWeight: '700' },
  primaryButton: { height: 52, marginTop: theme.spacing.lg, borderRadius: theme.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: theme.colors.primary, fontSize: theme.typography.body, fontWeight: '900' },
  divider: { marginVertical: theme.spacing.lg, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.mutedText, fontSize: theme.typography.bodySmall },
  linkRow: { marginTop: theme.spacing.sm, color: theme.colors.mutedText, textAlign: 'center', fontSize: theme.typography.bodySmall },
  link: { color: theme.colors.textSecondary, fontWeight: '900' },
  secondaryButton: { height: 48, marginTop: theme.spacing.sm, borderRadius: theme.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accentSoft },
  secondaryButtonText: { color: theme.colors.success, fontSize: theme.typography.bodySmall, fontWeight: '900' },
});

export default AuthScreen;
