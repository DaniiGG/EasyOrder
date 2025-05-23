import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import styles from '../styles/LoginStyles';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import { Modal, TouchableOpacity } from 'react-native';

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
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
        navigation.setOptions({ title: "EasyOrder™" ,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color:'white', fontSize:24, fontWeight: 'bold' }}>𓆰𓆪</Text>
          </View>
        )
        })
    
      })

  const handleRegister = async () => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const uid = userCredential.user.uid;
  
      if (role === 'owner') {
        // Registrar un nuevo restaurante
        const restaurantRef = await firestore().collection('restaurants').add({
          name: restaurantName,
          ownerId: uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
  
        // Guardar usuario con rol de dueño
        await firestore().collection('users').doc(uid).set({
          email,
          name,
          role: 'admin',
          restaurantId: restaurantRef.id, // Usamos el ID del restaurante, no el UID
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
          role: 'employee',
          restaurantId: restaurantCode,
        });
      }
  
      Alert.alert('Registro exitoso', '¡Tu cuenta ha sido creada!');
      navigation.navigate('Home');
  
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la cuenta.');
    }
  };

  const handleQRRead = (e: { data: string }) => {
    setRestaurantCode(e.data);
    setQrModalVisible(false);
    Alert.alert('Código escaneado', `Código: ${e.data}`);
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
          <View style={{ width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Código del Restaurante"
                value={restaurantCode}
                onChangeText={setRestaurantCode}
                placeholderTextColor="white"
              />
              <TouchableOpacity
                style={{
                  marginLeft: 8,
                  backgroundColor: '#45B4E0',
                  padding: 10,
                  borderRadius: 8,
                }}
                onPress={() => setQrModalVisible(true)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>QR</Text>
              </TouchableOpacity>
            </View>
            <Modal
              visible={qrModalVisible}
              animationType="slide"
              transparent={false}
              onRequestClose={() => setQrModalVisible(false)}
            >
              <QRCodeScanner
                onRead={handleQRRead}
                flashMode={RNCamera.Constants.FlashMode.auto}
                topContent={
                  <Text style={{ fontSize: 18, margin: 20, textAlign: 'center' }}>
                    Escanea el código QR del restaurante
                  </Text>
                }
                bottomContent={
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#45B4E0',
                      padding: 12,
                      borderRadius: 8,
                      alignSelf: 'center',
                      marginTop: 20,
                    }}
                    onPress={() => setQrModalVisible(false)}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancelar</Text>
                  </TouchableOpacity>
                }
              />
            </Modal>
          </View>
        )}

        <Button title="Registrarse" onPress={handleRegister} />
      </View>
    </ImageBackground>
  );
};

export default Register;
