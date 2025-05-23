import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, TouchableOpacity, ImageBackground } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import styles from '../styles/LoginStyles';
import Toast from 'react-native-toast-message';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogin = async () => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const uid = userCredential.user.uid;

      const userDoc = await firestore().collection('users').doc(uid).get();
  
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('Datos del usuario:', userData);
        navigation.navigate('Home');
      } else {
        console.error('No se encontraron datos para este usuario');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Correo o contraseña incorrectos.',
      });;
    }
  };

  useEffect(() => {
      navigation.setOptions({ title: "EasyOrder™" ,
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color:'white', fontSize:24, fontWeight: 'bold' }}>𓆰𓆪</Text>
        </View>
      )
      })
  
    })

  return (
    <ImageBackground
        source={require('../assets/fondoRes.jpg')}
        style={styles.background}>
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a EasyOrder</Text>
      <Text style={styles.subtitle}>Incia sesión para usar la app</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="white"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        secureTextEntry
        placeholderTextColor="white"
      />
      <Button title="Iniciar Sesión" onPress={handleLogin} />
      
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.text}>¿No tienes cuenta? <Text style={styles.link}>Regístrate aquí</Text></Text>
      </TouchableOpacity>
    </View>
    <Toast/>
    </ImageBackground>
  );
};

export default Login;
