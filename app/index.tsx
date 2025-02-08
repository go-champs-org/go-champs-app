import React from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OrganizationScreen from './src/views/OrganizationScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#c22' },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
      headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
    }}
  >
    <Stack.Screen
      name="Organization"
      component={OrganizationScreen}
      options={{
        title: 'Go Champs!',
        headerRight: () => (
          <TouchableOpacity onPress={() => alert('Menu')}>
            <Text style={styles.headerRight}>☰</Text>
          </TouchableOpacity>
        ),
      }}
    />
  </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    color: '#fff',
    marginRight: 16,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
