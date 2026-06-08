import React, { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export const Screen = ({ children, style }: Props) => (
  <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

