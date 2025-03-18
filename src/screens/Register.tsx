import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import styles from '../styles/LoginStyles';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // No se requiere pasar parámetros aquí
  const handleRegister = async () => {
    try {
        
      // Crear usuario en Firebase Authentication
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const uid = userCredential.user.uid;

      // Guardar "other data" en 
      console.log('aaa:');
      await firestore().collection('users').doc(uid).set({
        email,
        name,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Registro exitoso', '¡Tu cuenta ha sido creada!');
      
      navigation.navigate('Home'); // Redirige a la pantalla principal
    } catch (error: any) {
      console.error('Error al registrarse:', error);
      Alert.alert('Error', error.message || 'No se pudo crear la cuenta.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
      />
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
      {/* Llama a la función sin argumentos */}
      <Button title="Registrarse" onPress={handleRegister} />
    </View>
  );
};

export default Register;
