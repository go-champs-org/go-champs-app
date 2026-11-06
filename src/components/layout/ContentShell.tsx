import React, { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { makeStyles } from '../../theme/theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const ContentShell = ({ children, style }: Props) => {
  const styles = useStyles();
  return (
    <View style={[styles.shell, style] as never}>{children}</View>
  );
};

const useStyles = makeStyles((theme) => ({
  shell: {
    width: '100%',
    maxWidth: theme.layout.contentMaxWidth,
    alignSelf: 'center',
  },
}));
