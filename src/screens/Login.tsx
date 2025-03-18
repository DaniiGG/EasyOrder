import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, TouchableOpacity, ImageBackground } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import styles from '../styles/LoginStyles';

type RootStackParamList = {
  Login: undefined;
  Register: undefined; // Agregar la pantalla de registro al stack
  Home: undefined;
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Modificar handleLogin para no recibir parámetros
  const handleLogin = async () => {
    try {
      // Iniciar sesión con el correo y la contraseña del estado
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const uid = userCredential.user.uid;
  
      // Obtener los datos del usuario desde Firestore
      const userDoc = await firestore().collection('users').doc(uid).get();
  
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('Datos del usuario:', userData);
        navigation.navigate('Home');
        // Aquí puedes guardar los datos en el estado global o redirigir al usuario
      } else {
        console.error('No se encontraron datos para este usuario');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      Alert.alert('Error', 'Correo o contraseña incorrectos.');
    }
  };

  return (
    <ImageBackground
        source={require('../assets/fondoRes.jpg')}
        style={styles.background}>
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {/* No es necesario pasar parámetros a handleLogin */}
      <Button title="Iniciar Sesión" onPress={handleLogin} />
      
      {/* Navegar a la pantalla de registro */}
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.text}>¿No tienes cuenta? <Text style={styles.link}>Regístrate aquí</Text></Text>
      </TouchableOpacity>
    </View>
    </ImageBackground>
  );
};

export default Login;
