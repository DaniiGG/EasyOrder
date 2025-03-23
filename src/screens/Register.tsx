import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ImageBackground } from 'react-native';
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
  const [role, setRole] = useState<'owner' | 'employee'>('owner');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantCode, setRestaurantCode] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    navigation.setOptions({ title: "Registro" });
  }, []);

  const handleRegister = async () => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const uid = userCredential.user.uid;

      if (role === 'owner') {
        // Registrar un nuevo restaurante
        const restaurantRef = await firestore().collection('restaurants').add({
          name: restaurantName,
          owner: uid
        });

        // Guardar usuario con rol de dueño
        await firestore().collection('users').doc(uid).set({
          email,
          name,
          role: 'admin',
          restaurantId: restaurantRef.id,
        });

      } else if (role === 'employee') {
        // Validar código de restaurante
        const restaurantSnapshot = await firestore().collection('restaurants').doc(restaurantCode).get();
        if (!restaurantSnapshot.exists) {
          Alert.alert('Error', 'Código de restaurante inválido.');
          return;
        }

        // Guardar usuario con rol de empleado
        await firestore().collection('users').doc(uid).set({
          email,
          name,
          role: 'camarero',
          restaurantId: restaurantCode,
        });
      }

      Alert.alert('Registro exitoso', '¡Tu cuenta ha sido creada!');
      navigation.navigate('Home');

    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la cuenta.');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/fondoRes.jpg')}
      style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Registro</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={name}
          onChangeText={setName}
          placeholderTextColor="white"
        />
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

        <View style={styles.roleContainer}>
          <Button
            title="Soy Dueño"
            onPress={() => setRole('owner')}
            color={role === 'owner' ? '#45B4E0' : 'rgba(128, 128, 128, 0.3)'} 
          />
          <Button
            title="Soy Empleado"
            onPress={() => setRole('employee')}
            color={role === 'employee' ? '#45B4E0' : 'rgba(128, 128, 128, 0.3)'} 
          />
        </View>

        {role === 'owner' && (
          <TextInput
            style={styles.input}
            placeholder="Nombre del Restaurante"
            value={restaurantName}
            onChangeText={setRestaurantName}
            placeholderTextColor="white"
          />
        )}

        {role === 'employee' && (
          <TextInput
            style={styles.input}
            placeholder="Código del Restaurante"
            value={restaurantCode}
            onChangeText={setRestaurantCode}
            placeholderTextColor="white"
          />
        )}

        <Button title="Registrarse" onPress={handleRegister} />
      </View>
    </ImageBackground>
  );
};

export default Register;
