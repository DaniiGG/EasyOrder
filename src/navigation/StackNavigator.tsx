import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import Register from '../screens/Register';
import Login from '../screens/Login';
import SettingsScreen from '../screens/SettingsScreen';
import ResInfo from '../screens/ResInfo';
import MesasInfo from '../screens/MesasInfo';
import MenuInfo from '../screens/MenuInfo';

type RootStackParamList = {
    Login: undefined; // Ruta Login no necesita parámetros
    Home: undefined;  // Ruta Home no necesita parámetros
    Register: undefined;
    Settings: undefined;
    ResInfo: undefined;
    MesasInfo: undefined;
    MenuInfo: undefined;
  Profile: { userId: string };
  };

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: 'black' }, // 🔹 Cambia el color de fondo del header
          headerTintColor: '#fff', // 🔹 Cambia el color del texto e iconos
          headerTitleStyle: { fontSize: 18, fontWeight: 'bold' }, // 🔹 Personaliza el texto
        }}
      >
      <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ResInfo" component={ResInfo} />
          <Stack.Screen name="MesasInfo" component={MesasInfo} />
          <Stack.Screen name="MenuInfo" component={MenuInfo} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Cargando..." }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigator;
