import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import Register from '../screens/Register';
import Login from '../screens/Login';
//import SettingsScreen from '../screens/SettingsScreen';

type RootStackParamList = {
    Login: undefined; // Ruta Login no necesita parámetros
    Home: undefined;  // Ruta Home no necesita parámetros
    Register: undefined;
    Settings: undefined;
  Profile: { userId: string };
  };

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
      <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Cargando..." }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigator;
