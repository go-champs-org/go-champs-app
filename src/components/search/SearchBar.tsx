import React, { forwardRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  // dark sits on the black header; light on the page background.
  variant?: 'dark' | 'light';
};

export const SearchBar = forwardRef<React.ComponentRef<typeof TextInput>, Props>(({ value, onChangeText, placeholder, variant = 'dark' }, ref) => {
  const light = variant === 'light';

  return (
    <View style={[styles.container, light && styles.containerLight]}>
      <Ionicons name="search" size={20} color={light ? theme.colors.subtleText : theme.colors.inactive} />
      <TextInput
        ref={ref}
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={[styles.input, light && styles.inputLight]}
        placeholder={placeholder}
        placeholderTextColor={light ? theme.colors.subtleText : theme.colors.inactive}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
      />
    </View>
  );
});

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  container: {
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: '#262a21',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  containerLight: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: theme.typography.body,
  },
  inputLight: {
    color: theme.colors.ink,
  },
});
