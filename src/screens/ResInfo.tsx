import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Register: undefined;
  Settings: undefined;
  ResInfo: undefined;
  Profile: { userId: string };
};



const ResInfo = () => {
  const [restaurantName, setRestaurantName] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [hours, setHours] = useState('');
  const [isOwner, setIsOwner] = useState<boolean>(false);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = auth().currentUser;

  useEffect(() => {
      navigation.setOptions({ title: "Información" });
    }, []);

  // 🔹 Cargar datos del restaurante si existen
  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!user) return;

      try {
        // Obtenemos el restaurantId del usuario actual
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        if (userData?.role === 'admin') {
            setIsOwner(true);
        }
        
        const restaurantId = userData?.restaurantId;

        if (restaurantId) {
          const restaurantDoc = await firestore().collection('restaurants').doc(restaurantId).get();
          if (restaurantDoc.exists) {
            const data = restaurantDoc.data();
            console.log('Datos obtenidos de Firebase:', data);
            setRestaurantName(data?.name || '');
            setLocation(data?.location || '');
            setPhoneNumber(data?.phoneNumber || '');
            setEmail(data?.email || '');
            setCategory(data?.category || '');
            setHours(data?.hours || '');
          }
        }
      } catch (error) {
        console.error('Error obteniendo datos del restaurante:', error);
      }
    };

    fetchRestaurantData();
  }, [user]);

  const handleSaveRestaurant = async () => {
    if (!user) {
      Alert.alert('Error', 'No se ha encontrado un usuario autenticado.');
      return;
    }

    try {
      // Obtenemos el restaurantId del usuario actual
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      const restaurantId = userData?.restaurantId;

      if (restaurantId) {
        // Actualizamos los datos del restaurante con el restaurantId
        await firestore().collection('restaurants').doc(restaurantId).set(
          {
            ownerId: user.uid,
            name: restaurantName,
            location,
            phoneNumber,
            email,
            category,
            hours,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true } // Evita sobreescribir datos previos
        );

        Alert.alert('Éxito', 'Datos del restaurante guardados correctamente.');
        navigation.navigate('Home');
      } else {
        Alert.alert('Error', 'No se pudo encontrar el restaurante asociado a este usuario.');
      }
    } catch (error) {
      console.error('Error guardando restaurante:', error);
      Alert.alert('Error', 'No se pudo guardar la información del restaurante.');
    }
  };

  return (
    
    <View style={styles.container}>
      <Text style={styles.title}>Configuración del Restaurante</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del Restaurante"
        value={restaurantName}
        onChangeText={setRestaurantName}
        placeholderTextColor="gray"
        editable={isOwner}
      />
      <TextInput
        style={styles.input}
        placeholder="Ubicación"
        value={location}
        onChangeText={setLocation}
        placeholderTextColor="gray"
        editable={isOwner}
      />
      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        placeholderTextColor="gray"
        editable={isOwner}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholderTextColor="gray"
        editable={isOwner}
      />
      <TextInput
        style={styles.input}
        placeholder="Categoría (Ej: Mexicana, Italiana, etc.)"
        value={category}
        onChangeText={setCategory}
        placeholderTextColor="gray"
        editable={isOwner}
      />
      <TextInput
        style={styles.input}
        placeholder="Horario (Ej: Lunes-Viernes 9:00-18:00)"
        value={hours}
        onChangeText={setHours}
        placeholderTextColor="gray"
        editable={isOwner}
      />
      <Button title="Guardar Restaurante" onPress={handleSaveRestaurant} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
});

export default ResInfo;
