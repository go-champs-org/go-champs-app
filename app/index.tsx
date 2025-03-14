import React from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OrganizationScreen from './src/views/OrganizationScreen';
import TournamentsScreen from './src/views/TournamentsScreen';
import TournamentHistoryScreen from './src/views/TournamentHistoryScreen'; // Import the screen
import { RootStackParamList } from './src/navigation/types'; // Import the types

const Stack = createNativeStackNavigator<RootStackParamList>();

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
        name="TournamentsScreen"
        component={TournamentsScreen}
        options={{
          title: 'Go Champs!',
          headerRight: () => (
            <TouchableOpacity onPress={() => alert('Menu')}>
              <Text style={styles.headerRight}>☰</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="TournamentHistoryScreen" component={TournamentHistoryScreen} options={{
          title: 'Fases',
          
        }}/> 
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
