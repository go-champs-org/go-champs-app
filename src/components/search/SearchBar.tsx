import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
};

export const SearchBar = ({ value, onChangeText }: Props) => (
  <View style={styles.container}>
    <Ionicons name="search" size={20} color={theme.colors.inactive} />
    <TextInput
      style={styles.input}
      placeholder="Pesquisar campeonatos, times..."
      placeholderTextColor={theme.colors.inactive}
      value={value}
      onChangeText={onChangeText}
      returnKeyType="search"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2b2b2b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
  },
});

