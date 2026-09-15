import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export const Screen = ({ children, style }: Props) => <SafeAreaView edges={['left', 'right']} style={[styles.container, style]}>{children}</SafeAreaView>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
