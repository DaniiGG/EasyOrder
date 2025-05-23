import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg'; // <-- Add this import

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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [restaurantId, setRestaurantId] = useState<string | null>(null); // <-- Add this state

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
        setRestaurantId(restaurantId || null); // <-- Save restaurantId to state

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

  const validateFields = () => {
    if (
      !restaurantName.trim() ||
      !location.trim() ||
      !phoneNumber.trim() ||
      !email.trim() ||
      !category.trim() ||
      !hours.trim()
    ) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return false;
    }
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor, introduce un email válido.');
      return false;
    }
    // Phone must be exactly 9 digits
    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Error', 'Por favor, introduce un teléfono válido de exactamente 9 dígitos.');
      return false;
    }
    return true;
  };
  
  const handleSaveRestaurant = async () => {
    if (!validateFields()) return;

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

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'restaurantName':
        if (!value.trim()) return 'El nombre es obligatorio.';
        break;
      case 'location':
        if (!value.trim()) return 'La ubicación es obligatoria.';
        break;
      case 'phoneNumber':
        if (!/^\d{9}$/.test(value)) return 'El teléfono debe tener exactamente 9 dígitos.';
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Introduce un email válido.';
        break;
      case 'category':
        if (!value.trim()) return 'La categoría es obligatoria.';
        break;
      case 'hours':
        if (!value.trim()) return 'El horario es obligatorio.';
        break;
      default:
        return '';
    }
    return '';
  };

  const handleBlur = (field: string, value: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, value);
    setErrors({ ...errors, [field]: error });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Configuración del Restaurante</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre del Restaurante</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre del Restaurante"
          value={restaurantName}
          onChangeText={setRestaurantName}
          onBlur={() => handleBlur('restaurantName', restaurantName)}
          placeholderTextColor="gray"
          editable={isOwner}
        />
        {touched.restaurantName && errors.restaurantName ? (
          <Text style={styles.errorText}>{errors.restaurantName}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ubicación</Text>
        <TextInput
          style={styles.input}
          placeholder="Ubicación"
          value={location}
          onChangeText={setLocation}
          onBlur={() => handleBlur('location', location)}
          placeholderTextColor="gray"
          editable={isOwner}
        />
        {touched.location && errors.location ? (
          <Text style={styles.errorText}>{errors.location}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          onBlur={() => handleBlur('phoneNumber', phoneNumber)}
          keyboardType="phone-pad"
          placeholderTextColor="gray"
          editable={isOwner}
        />
        {touched.phoneNumber && errors.phoneNumber ? (
          <Text style={styles.errorText}>{errors.phoneNumber}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          onBlur={() => handleBlur('email', email)}
          keyboardType="email-address"
          placeholderTextColor="gray"
          editable={isOwner}
        />
        {touched.email && errors.email ? (
          <Text style={styles.errorText}>{errors.email}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Categoría</Text>
        <TextInput
          style={styles.input}
          placeholder="Categoría (Ej: Mexicana, Italiana, etc.)"
          value={category}
          onChangeText={setCategory}
          onBlur={() => handleBlur('category', category)}
          placeholderTextColor="gray"
          editable={isOwner}
        />
        {touched.category && errors.category ? (
          <Text style={styles.errorText}>{errors.category}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Horario</Text>
        <TextInput
          style={styles.input}
          placeholder="Horario (Ej: Lunes-Viernes 9:00-18:00)"
          value={hours}
          onChangeText={setHours}
          onBlur={() => handleBlur('hours', hours)}
          placeholderTextColor="gray"
          editable={isOwner}
        />
        {touched.hours && errors.hours ? (
          <Text style={styles.errorText}>{errors.hours}</Text>
        ) : null}
      </View>

      {/* QR Code Section */}
      {restaurantId && (
        <View style={styles.qrContainer}>
          <Text style={styles.qrLabel}>Código QR del Restaurante</Text>
          <QRCode value={restaurantId} size={180} />
          <Text style={styles.qrIdText}>ID: {restaurantId}</Text>
        </View>
      )}

      <Button title="Guardar Restaurante" onPress={handleSaveRestaurant} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa', // Light background color
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#343a40', // Darker text color
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#495057', // Medium text color
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da', // Light border color
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff', // White background for inputs
    color: 'black',
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginTop: 2,
    marginLeft: 2,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 30,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#343a40',
  },
  qrIdText: {
    marginTop: 10,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});

export default ResInfo;
