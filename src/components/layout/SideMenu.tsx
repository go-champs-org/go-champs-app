import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { SITE_LINKS, SOCIAL_LINKS } from '../../core/config/siteLinks';
import { makeStyles, useTheme } from '../../theme/theme';

export type SideMenuItem = 'home' | 'organizations';

type Props = {
  visible: boolean;
  activeItem?: SideMenuItem;
  onClose: () => void;
  onOpenHome: () => void;
  onOpenOrganizations: () => void;
};

const PANEL_MAX_WIDTH = 320;
const ANIMATION_MS = 220;

type IconProps = { color: string };

const MenuRow = ({
  label,
  icon,
  active = false,
  onPress,
}: {
  label: string;
  icon: (props: IconProps) => React.ReactNode;
  active?: boolean;
  onPress: () => void;
}) => {
  const theme = useTheme();
  const styles = useStyles();
  const color = active ? theme.colors.lime : theme.colors.ink;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.row, active && styles.rowActive]}
    >
      {icon({ color })}
      <Text style={[styles.rowText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const SocialButton = ({ label, icon, url }: { label: string; icon: keyof typeof Ionicons.glyphMap; url: string }) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => void Linking.openURL(url)}
      style={styles.socialButton}
    >
      <Ionicons name={icon} size={20} color={theme.colors.ink} />
    </TouchableOpacity>
  );
};

// The app menu, sliding in from the right over the current tab.
export const SideMenu = ({ visible, activeItem, onClose, onOpenHome, onOpenOrganizations }: Props) => {
  const theme = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width * 0.82, PANEL_MAX_WIDTH);
  const [progress] = useState(() => new Animated.Value(0));
  // The modal stays mounted until the closing slide ends.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  // An action that must wait until the menu is gone, like opening the in-app
  // browser: iOS cannot present it while the menu's modal is still on screen.
  const afterClose = useRef<(() => void) | null>(null);

  const runAfterClose = () => {
    const action = afterClose.current;
    afterClose.current = null;
    action?.();
  };

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || visible) return;
      setMounted(false);
      // iOS reports the end of the modal's dismissal through onDismiss.
      if (Platform.OS !== 'ios') runAfterClose();
    });
  }, [visible, progress]);

  const run = (action: () => void) => {
    onClose();
    action();
  };

  const openSitePage = (url: string) => {
    afterClose.current = () => void WebBrowser.openBrowserAsync(url);
    onClose();
  };
  const version = Constants.expoConfig?.version;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
      onDismiss={runAfterClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
          <Pressable accessibilityLabel="Fechar menu" style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.panel,
            { width: panelWidth },
            { transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [panelWidth, 0] }) }] },
          ]}
        >
          <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
            <View style={styles.topBar}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fechar menu"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={26} color={theme.colors.ink} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.content} bounces={false}>
              <View style={styles.section}>
                <MenuRow
                  label="Início"
                  active={activeItem === 'home'}
                  icon={({ color }) => <Ionicons name="home-outline" size={24} color={color} />}
                  onPress={() => run(onOpenHome)}
                />
                <MenuRow
                  label="Organizações"
                  active={activeItem === 'organizations'}
                  icon={({ color }) => <MaterialCommunityIcons name="handshake-outline" size={24} color={color} />}
                  onPress={() => run(onOpenOrganizations)}
                />
              </View>
              <View style={styles.section}>
                <MenuRow
                  label="Perguntas frequentes"
                  icon={({ color }) => <Ionicons name="help" size={24} color={color} />}
                  onPress={() => openSitePage(SITE_LINKS.faq)}
                />
                <MenuRow
                  label="Sobre nós"
                  icon={({ color }) => <Ionicons name="briefcase-outline" size={24} color={color} />}
                  onPress={() => openSitePage(SITE_LINKS.about)}
                />
                <MenuRow
                  label="Fale com a gente"
                  icon={({ color }) => <MaterialCommunityIcons name="forum-outline" size={24} color={color} />}
                  onPress={() => openSitePage(SITE_LINKS.contact)}
                />
              </View>
            </ScrollView>
            <View style={styles.footer}>
              <View style={styles.socials}>
                <SocialButton label="Instagram da Go Champs" icon="logo-instagram" url={SOCIAL_LINKS.instagram} />
                <SocialButton label="LinkedIn da Go Champs" icon="logo-linkedin" url={SOCIAL_LINKS.linkedin} />
                <SocialButton label="YouTube da Go Champs" icon="logo-youtube" url={SOCIAL_LINKS.youtube} />
              </View>
              {version ? <Text style={styles.version}>Go Champs - Versão {version}</Text> : null}
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: theme.colors.overlay,
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    borderLeftWidth: theme.dark ? 1 : 0,
    borderLeftColor: theme.colors.chromeBorder,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    minHeight: 56,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.subtleBorder,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: theme.spacing.sm,
  },
  section: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.subtleBorder,
  },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  rowActive: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  rowText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.subtleBorder,
  },
  socials: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  version: {
    color: theme.colors.subtleText,
    fontSize: theme.typography.caption,
  },
}));
