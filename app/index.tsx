import * as React from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

// Dados mockados
const mockData = [
  { id: '1', title: 'Liga de Basquete Amador (2022)', subtitle: 'Liga de Basquete Amador de Porto Alegre', views: 7828 },
  { id: '2', title: 'LBA Regular 2023', subtitle: 'Liga de Basquete Amador de Porto Alegre', views: 7310 },
  { id: '3', title: '1º Torneio 3x3 Feminino - ESTRELA DA MANHÃ', subtitle: 'Estrela da Manhã - SP/ZL', views: 1189 },
  { id: '4', title: 'Municipal (Masculino) - 2022', subtitle: 'Prefeitura Municipal de Porto Alegre - RS', views: 1068 },
];

// Tela principal: Torneios
const TorneiosScreen = () => {
  return (
    <View style={styles.container}>
      <TextInput style={styles.searchBar} placeholder="Pesquisar" />
      <FlatList
        data={mockData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <View style={styles.footer}>
              <Text style={styles.views}>👁️ {item.views}</Text>
              <TouchableOpacity style={styles.fixButton}>
                <Text style={styles.fixButtonText}>Fixar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

// Função principal do app
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
          name="Torneios"
          component={TorneiosScreen}
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  searchBar: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  views: {
    fontSize: 14,
    color: '#777',
  },
  fixButton: {
    backgroundColor: '#c22',
    padding: 8,
    borderRadius: 4,
  },
  fixButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  headerRight: {
    color: '#fff',
    marginRight: 16,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
