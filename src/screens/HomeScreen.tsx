import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet, Image, TouchableOpacity  } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';


type RootStackParamList = {
  Login: undefined; // Ruta Login no necesita parámetros
  Home: undefined;  // Ruta Home no necesita parámetros
  Register: undefined;
  Settings: undefined;
Profile: { userId: string };
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const user = auth().currentUser;

  const toggleMenu = () => {
    setMenuVisible((prevState) => !prevState);  // Cambiar el estado para mostrar u ocultar el menú
  };

  const handleOptionPress = (option: string) => {
    console.log(`Seleccionaste: ${option}`);
    setMenuVisible(false);  // Cerrar el menú después de seleccionar una opción

    // Aquí puedes añadir la lógica para cada opción
    switch (option) {
      case 'Profile':
        navigation.navigate('Login');  // Navegar a la pantalla de perfil
        break;
      case 'Settings':
        navigation.navigate('Settings');  // Navegar a la pantalla de ajustes
        break;
      case 'Logout':
        // Lógica para cerrar sesión
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) return;

      try {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const name = userDoc.data()?.name || 'Usuario';
          setUserName(name);
        }
      } catch (error) {
        console.error('Error obteniendo el nombre:', error);
      }
    };

    fetchUserName();
  }, [user]);

  useLayoutEffect(() => {
    if (userName) {
      navigation.setOptions({ title: `Bienvenido, ${userName}`,
        headerRight: () => (
          <TouchableOpacity onPress={toggleMenu}>
          <Image
              source={require('../assets/iconoCamarero.png')} // Ruta de imagen predeterminada si no hay foto
              style={{ width: 40, height: 40, borderRadius: 5, marginRight: 15 }}
            />
          </TouchableOpacity>
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

  const handleSettings = async () => {
    navigation.navigate("Settings")
  };


  return (
    <View style={styles.container}>
      <Text>Bienvenido, {userName}</Text>
      <Button title="Configurar restaurante" onPress={handleSettings} />
      {menuVisible && (
        <View style={styles.menu}>
          <TouchableOpacity onPress={() => handleOptionPress('Profile')}>
            <Text style={styles.optionText}>Ver Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOptionPress('Settings')}>
            <Text style={styles.optionText}>Ajustes</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOptionPress('Logout')}>
            <Text style={styles.optionText} onPress={handleLogout}>Cerrar Sesión</Text>
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
    top: 0,  // Ajusta la distancia desde la parte superior de la pantalla
    right: 0,  // Ajusta la distancia desde la parte derecha de la pantalla
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 0,
    elevation: 2,  // Sombra para dar la apariencia de un menú emergente
  },
  optionText: {
    fontSize: 18,
    paddingVertical: 10,
  },
});

export default HomeScreen;
