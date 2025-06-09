import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, Button, StyleSheet, Switch, ImageBackground, Image, TouchableOpacity, FlatList, Animated } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message'; 
import { Dimensions } from 'react-native';
const deviceWidth = Dimensions.get('window').width;

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Register: undefined;
  Settings: undefined;
  OrderScreen: { tableId: string };
  OrderDetails:{ orderId: string };
  UserInfo: { userId: string };
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [tables, setTables] = useState<{ id: string; numero: string; status: string; PedidoId: string; position: { x: number, y: number } }[]>([]);
  const [useCoordinates, setUseCoordinates] = useState<boolean>(true); // State to toggle layout mode
  const user = auth().currentUser;

  const toggleMenu = () => {
    setMenuVisible((prevState) => !prevState);
  };

  const handleOptionPress = (option: string) => {
    console.log(`Seleccionaste: ${option}`);
    setMenuVisible(false);

    switch (option) {
      case 'UserInfo':
        navigation.navigate('UserInfo', { userId: user?.uid || '' });
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
  
          if (data?.role === 'admin') {
            setIsOwner(true);
  
            if (data?.restaurantId) {
              const restaurantDoc = await firestore().collection('restaurants').doc(data.restaurantId).get();
              if (restaurantDoc.exists) {
                const restaurantData = restaurantDoc.data();
  
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
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Error obteniendo datos del usuario.',
        });
      }
    };
  
    fetchUserData();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchTables = async () => {
        try {
          const user = auth().currentUser;
          if (!user) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Usuario no autenticado.',
            });
            return;
          }

          const userDoc = await firestore().collection('users').doc(user.uid).get();
          const userData = userDoc.data();
          const restaurantId = userData?.restaurantId;

          if (!restaurantId) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'No se encontró el ID del restaurante.',
            });
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

          setTables(tablesData as { id: string; numero: string; status: string; PedidoId: string; position: { x: number, y: number } }[]);
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'No se pudieron obtener las mesas.',
          });
        }
      };

      fetchTables();
    }, [])
  );

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
    Toast.show({
      type: 'success',
      text1: 'Sesión cerrada',
      text2: 'Has cerrado sesión exitosamente.',
    });
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleTableClick = (table: { id: string; numero: string; status: string; PedidoId: string }) => {
    if (table.status === 'pending' || table.status === 'served') {
      navigation.navigate('OrderDetails', { orderId: table.PedidoId });
    } else {
      navigation.navigate('OrderScreen', { tableId: table.id });
    }
  };

  const toggleLayoutMode = () => {
    setUseCoordinates(prevState => !prevState);
  };

  return (
    <ImageBackground
        source={require('../assets/fondoSuelo.png')}
        style={styles.background}>
    <View style={styles.container}>
    <Toast />
      <View style={styles.switchContainer}>
        <Text style={styles.tableNumber}>Organizacion personalizada</Text>
        <Switch
          value={useCoordinates}
          onValueChange={toggleLayoutMode}
          trackColor={{ false: 'rgba(255, 255, 255, 0.68)', true: 'rgba(255, 255, 255, 0.68)' }} // gray when off, green when on
          thumbColor={useCoordinates ? 'rgb(66, 173, 245)' : 'rgb(255, 255, 255)'} // dark green when on, light when off
          ios_backgroundColor="#d1d1d1"
        />
      </View>
      {isOwner && !isConfigured && (
        <Button title="Configurar restaurante" onPress={handleSettings} />
      )}
      <FlatList
        data={tables}
        keyExtractor={item => item.id}
        style={{width: deviceWidth,backgroundColor: 'rgba(255, 255, 255, 0.68)'}}
        key={useCoordinates ? 'coordinate-layout' : 'column-layout'} // Change key based on layout mode
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleTableClick(item)} style={[useCoordinates? {width: 30}: {}]}>
            <Animated.View
              style={[
                styles.table,
                useCoordinates
                  ? { transform: [{ translateX: item.position.x }, { translateY: item.position.y }],  }
                  : { width: '30%'}
              ]}
            >
              
              <View style={styles.imageContainer}>
              <Image
                source={
                  item.status === 'pending'
                    ? require('../assets/iconoMesaRed.png')
                    : item.status === 'served'
                    ? require('../assets/iconoMesaGreen.png')
                    : require('../assets/iconoMesa.png')
                }
                style={styles.tableImage}
              />
              <Text style={styles.tableNumber}>Mesa {item.numero}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        )}
        numColumns={useCoordinates ? 1 : 3} // Use 1 column for coordinate layout, 3 for column layout
        
      />

      

      {menuVisible && (
        <View style={styles.menu}>
          <TouchableOpacity onPress={() => handleOptionPress('UserInfo')}>
            <Text style={styles.optionText}>Ver Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOptionPress('Logout')}>
            <Text style={styles.optionText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}
      </View>
      <Toast />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    marginVertical: 10, 
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
    color: 'black',
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
    color: 'black',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: 'black',
  },
  tableImage: {
    width: 70,
    height: 70,
  },
  table: {
    margin: 10,
  },
  tableNumber: {
    textAlign: 'center',
    fontSize: 16,
    color: 'black',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10, // Add some margin to ensure the switch is visible
  },
  background: {
    flex: 1,
    resizeMode: 'cover', // Ajusta la imagen para cubrir toda la pantalla
  },
});

export default HomeScreen;
