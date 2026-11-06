import React, { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles } from '../../theme/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export const Screen = ({ children, style }: Props) => {
  const styles = useStyles();
  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.container, style] as never}>
      {children}
    </SafeAreaView>
  );
};

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));
