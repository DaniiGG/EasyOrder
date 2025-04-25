import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Register: undefined;
  Settings: undefined;
  OrderScreen: { tableId: string };
  OrderDetails:{ orderId: string };
  Profile: { userId: string };
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [tables, setTables] = useState<{ id: string; numero: string; status: string; PedidoId: string }[]>([]);
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

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const user = auth().currentUser;
        if (!user) {
          Alert.alert('Error', 'Usuario no autenticado.');
          return;
        }

        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        const restaurantId = userData?.restaurantId;

        if (!restaurantId) {
          Alert.alert('Error', 'No se encontró el ID del restaurante.');
          return;
        }

        const tablesSnapshot = await firestore()
          .collection('restaurants')
          .doc(restaurantId)
          .collection('tables')
          .get();

        const tablesData = tablesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTables(tablesData as { id: string; numero: string; status: string; PedidoId: string }[]);
      } catch (error) {
        console.error('Error fetching tables:', error);
        Alert.alert('Error', 'No se pudieron obtener las mesas.');
      }
    };

    fetchTables();
  }, []);

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

  const handleTableClick = (table: { id: string; numero: string; status: string; PedidoId: string }) => {
    if (table.status === 'occupied') {
      navigation.navigate('OrderDetails', { orderId: table.PedidoId });
    } else {
      navigation.navigate('OrderScreen', { tableId: table.id });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.container}>
      <Text style={styles.title}>Mesas del Restaurante</Text>
      <FlatList
        data={tables}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleTableClick(item)}>
            <Image
              source={item.status === 'occupied' ? require('../assets/iconoMesaRed.png') : require('../assets/iconoMesa.png')} // Use different images for occupied and free tables
              style={styles.tableImage}
            />
            <Text style={styles.tableNumber}>Mesa {item.numero}</Text>
          </TouchableOpacity>
        )}
        numColumns={3} // Adjust the number of columns as needed
      />
    </View>

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

      {/* <View style={styles.imageContainer}>
        <Image source={require('../assets/aa.png')} style={styles.image} />
        <Text style={styles.number}>42</Text>
      </View> */}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  tableImage: {
    width: 100,
    height: 100,
    margin: 10,
  },
  tableNumber: {
    textAlign: 'center',
    fontSize: 16,
  },
});

export default HomeScreen;
