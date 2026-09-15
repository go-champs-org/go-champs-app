import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../../theme/theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const ContentShell = ({ children, style }: Props) => (
  <View style={[styles.shell, style]}>{children}</View>
);

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: theme.layout.contentMaxWidth,
    alignSelf: 'center',
  },
});
