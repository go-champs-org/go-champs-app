import React from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from './src/theme/theme';
import OrganizationScreen from './src/views/OrganizationScreen';
import TournamentsScreen from './src/views/TournamentsScreen';
import TournamentHistoryScreen from './src/views/TournamentHistoryScreen'; // Import the screen
import PlayoffsView from './src/views/PlayoffsView'; // Import the PlayoffsScreen
import { RootStackParamList } from './src/navigation/types'; // Import the types

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
        headerTitleStyle: { fontWeight: 'normal', fontSize: 16 },
      }}
    >
      <Stack.Screen
        name="TournamentsScreen"
        component={TournamentsScreen}
        options={{
          title: 'Go Champs',
          headerLeft: () => (
            <View style={styles.headerButton}>
              <Image
                source={require('../assets/images/logo-green.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity style={styles.headerButton} onPress={() => alert('Menu')}>
              <Text style={styles.headerRight}>☰</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="TournamentHistoryScreen" component={TournamentHistoryScreen} options={{
          title: 'Fases',
          
        }}/> 
      <Stack.Screen
        name="PlayoffsView"
        component={PlayoffsView}
        options={{
          title: 'Playoffs',
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 28,
    height: 28,
  },
  headerRight: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
