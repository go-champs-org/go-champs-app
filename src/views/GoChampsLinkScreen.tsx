import React, { useEffect } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, StackActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import { RootStackParamList } from '../navigation/types';
import { routeForResolvedLink } from '../navigation/goChampsLinkRoutes';
import { useGoChampsLinkViewModel } from '../viewmodels/GoChampsLinkViewModel';
import { EmptyState } from '../components/feedback/EmptyState';
import { makeStyles, useTheme } from '../theme/theme';

type Props = { route: RouteProp<RootStackParamList, 'GoChampsLinkScreen'> };

// Where a go-champs.com link the app was opened with lands: it looks up the
// tournament the link names by its slugs, then replaces itself with the
// screen of that page. Pages the app has no screen for open on the site, in
// the in-app browser, which never sends the link back to the app.
const GoChampsLinkScreen: React.FC<Props> = ({ route }) => {
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { resolved, loading, error, retry } = useGoChampsLinkViewModel(route.params.path);

  useEffect(() => {
    if (!resolved) return;

    if (resolved.kind === 'external') {
      void WebBrowser.openBrowserAsync(resolved.url);
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.dispatch(StackActions.replace('MainTabs'));
      return;
    }

    const target = routeForResolvedLink(resolved);
    if (target) navigation.dispatch(StackActions.replace(target.name, target.params));
  }, [resolved, navigation]);

  if (resolved?.kind === 'notFound') {
    return (
      <View style={styles.screen} testID="go-champs-link-not-found">
        <EmptyState
          icon="trophy-outline"
          title="Campeonato não encontrado"
          description="O link pode estar desatualizado. Você pode abri-lo no site da Go Champs."
        />
        <View style={styles.actions}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => void WebBrowser.openBrowserAsync(resolved.url)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Abrir no site</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigation.popToTop()} style={styles.button}>
            <Text style={styles.buttonText}>Ir para o início</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (error && !loading) {
    return (
      <View style={styles.centered}>
        <View style={styles.actions}>
          <Text style={styles.message}>{error}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={retry} style={styles.button}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.centered} testID="go-champs-link-loading">
      <ActivityIndicator size="large" color={theme.colors.accent} />
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.background, paddingTop: theme.spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  actions: { padding: theme.spacing.lg, alignItems: 'center', gap: theme.spacing.md },
  message: { color: theme.colors.textPrimary, fontSize: theme.typography.body, textAlign: 'center' },
  button: {
    minHeight: theme.layout.touchTarget,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.oliveSoft,
  },
  buttonText: { color: theme.colors.onOliveSoft, fontSize: 14, fontWeight: '800' },
}));

export default GoChampsLinkScreen;
