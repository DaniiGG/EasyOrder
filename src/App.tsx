import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Button
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import analytics from '@react-native-firebase/analytics';
import HomeScreen from './screens/HomeScreen';
import Register from './screens/Register';
import Login from './screens/Login';

type RootStackParamList = {
  Login: undefined; // Ruta Login no necesita parámetros
  Home: undefined;  // Ruta Home no necesita parámetros
};

const Stack = createNativeStackNavigator();


function App(): React.JSX.Element {

  useEffect(() => {
    // Registra un evento cuando la app se abre
    analytics().logEvent('app_opened', {
      screen: 'Login',
      purpose: 'Testing Firebase Analytics',
    });
  }, []);

  const handleButtonPress = async () => {
    // Registra un evento cuando el usuario presiona el botón
    await analytics().logEvent('button_press', {
      button: 'Test Button',
      purpose: 'Testing Firebase Event',
    });
  };


  const isDarkMode = false; 

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      {/* Agrega un botón para enviar eventos de prueba */}
      <Button title="Enviar Evento de Test" onPress={handleButtonPress} />
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
});

export default App;
