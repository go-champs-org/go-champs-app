import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme/theme';
import { createWebAuthFlow } from './createWebAuthFlow';
import { webAuthCopy } from './WebAuthPurpose';
import { isWebAuthSuccessUrl } from './webAuthUrls';

type Props = { route: RouteProp<RootStackParamList, 'WebAuthFlowScreen'> };

const WebAuthFlowScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation();
  const purpose = route.params.purpose;
  const flow = useMemo(() => createWebAuthFlow(purpose), [purpose]);
  const copy = webAuthCopy[purpose];
  const [loading, setLoading] = useState(Platform.OS !== 'web');
  const [externalOpened, setExternalOpened] = useState(false);

  const close = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const openExternal = useCallback(async () => {
    await flow.openExternal();
    setExternalOpened(true);
  }, [flow]);

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{copy.title}</Text>
          <TouchableOpacity accessibilityLabel="Fechar" onPress={close} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View style={styles.webFallback}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.description}>{copy.description}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={copy.action}
            onPress={() => void openExternal()}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>{copy.action}</Text>
          </TouchableOpacity>
          {externalOpened ? (
            <TouchableOpacity accessibilityRole="button" onPress={close} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Já finalizei — voltar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{copy.title}</Text>
        <TouchableOpacity accessibilityLabel="Fechar" onPress={close} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : null}
      <WebView
        source={{ uri: flow.startUrl }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(navState) => {
          if (navState.url && isWebAuthSuccessUrl(navState.url, purpose)) {
            close();
          }
        }}
        startInLoadingState
        style={styles.webview}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.primary },
  header: {
    minHeight: 56,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
  },
  headerTitle: { color: '#ffffff', fontSize: theme.typography.titleSmall, fontWeight: '800' },
  closeButton: {
    width: theme.layout.touchTarget,
    height: theme.layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webview: { flex: 1, backgroundColor: theme.colors.background },
  loader: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    zIndex: 2,
    alignItems: 'center',
  },
  webFallback: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.display,
    fontWeight: '900',
  },
  description: {
    marginTop: theme.spacing.sm,
    color: theme.colors.mutedText,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  primaryButton: {
    height: 52,
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  primaryButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  secondaryButton: {
    height: 48,
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
  },
  secondaryButtonText: {
    color: theme.colors.success,
    fontSize: theme.typography.bodySmall,
    fontWeight: '900',
  },
});

export default WebAuthFlowScreen;
