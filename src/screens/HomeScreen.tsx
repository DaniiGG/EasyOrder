import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet, Image, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Register: undefined;
  Settings: undefined;
  Profile: { userId: string };
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const user = auth().currentUser;

  const toggleMenu = () => {
    setMenuVisible((prevState) => !prevState);
  };

  const handleOptionPress = (option: string) => {
    console.log(`Seleccionaste: ${option}`);
    setMenuVisible(false);

    switch (option) {
      case 'Profile':
        navigation.navigate('Profile', { userId: user?.uid || '' });
        break;
      case 'Settings':
        navigation.navigate('Settings');
        break;
      case 'Logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
  
      try {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          setUserName(data?.name || 'Usuario');
  
          // 🔹 Verificar si el usuario es dueño
          if (data?.role === 'admin') {
            setIsOwner(true);
  
            // 🔹 Verificar si el restaurante está configurado
            if (data?.restaurantId) {
              const restaurantDoc = await firestore().collection('restaurants').doc(data.restaurantId).get();
              if (restaurantDoc.exists) {
                const restaurantData = restaurantDoc.data();
  
                // ✅ Verificación más segura de los campos obligatorios
                const hasRequiredFields =
                  restaurantData?.name && restaurantData.name.trim() !== '' &&
                  restaurantData?.location && restaurantData.location.trim() !== '' &&
                  restaurantData?.email && restaurantData.email.trim() !== '' &&
                  restaurantData?.phoneNumber && restaurantData.phoneNumber.trim() !== '' 
  
                setIsConfigured(hasRequiredFields);
              } else {
                setIsConfigured(false);
              }
            } else {
              setIsConfigured(false);
            }
          }
        }
      } catch (error) {
        console.error('Error obteniendo datos del usuario:', error);
      }
    };
  
    fetchUserData();
  }, [user]);

  useLayoutEffect(() => {
    if (userName) {
      navigation.setOptions({
        title: `Bienvenido, ${userName}`,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ marginRight: 15 }}>
            <Image
              source={require('../assets/iconoAjustes.png')}
              style={{ width: 30, height: 30, borderRadius: 5 }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMenu} style={{ marginRight: 15 }}>
            <Image
              source={require('../assets/iconoUsuario.png')}
              style={{ width: 30, height:30, borderRadius: 5 }}
            />
          </TouchableOpacity>

          {/* 🔹 Botón 2 - Configuración */}
          
        </View>
        ),
      });
    }
  }, [navigation, userName]);

  const handleLogout = async () => {
    await auth().signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
    Alert.alert('Sesión cerrada', 'Has cerrado sesión exitosamente.');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.container}>
      <Text>Bienvenido, {userName}</Text>

      {/* 🔹 Mostrar botón solo si el usuario es dueño y el restaurante no está configurado */}
      {isOwner && !isConfigured && (
        <Button title="Configurar restaurante" onPress={handleSettings} />
      )}

      {menuVisible && (
        <View style={styles.menu}>
          <TouchableOpacity onPress={() => handleOptionPress('Profile')}>
            <Text style={styles.optionText}>Ver Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOptionPress('Logout')}>
            <Text style={styles.optionText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.imageContainer}>
        <Image source={require('../assets/aa.png')} style={styles.image} />
        <Text style={styles.number}>42</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  number: {
    position: 'absolute',
    top: '50%',
    left: '53%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    fontSize: 30,
    fontWeight: 'bold',
    padding: 10,
    borderRadius: 10,
  },
  menu: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 0,
    elevation: 2,
  },
  optionText: {
    fontSize: 18,
    paddingVertical: 10,
  },
});

export default HomeScreen;
