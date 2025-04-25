import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Register: undefined;
  Settings: undefined;
  AddMenu:undefined;
  ResInfo: undefined;
  EditMenu: {  menuId: string; };
  Profile: { userId: string };
};

enum DishType {
  Starter = 'Entrante',
  MainCourse = 'Primer Plato',
  SecondoCourse = 'Segundo Plato',
  Dessert = 'Postre',
  Beverage = 'Bebida',
  Tapa = 'Tapa',
}

type MenuItem = {
  id: string;
  name: string;
  image: string;
  dishType: DishType;
  price: number;
  allergens: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
};

const MenuInfo = () => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = auth().currentUser;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Menus`,
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('AddMenu')} style={styles.addButton}>
          <Image
              source={require('../assets/iconoAdd.png')}
              style={{ width: 30, height: 30, borderRadius: 5 }}
            />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const fetchMenus = async () => {
      if (!user) return;

      try {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        const restaurantId = userData?.restaurantId;

        if (restaurantId) {
          const menusSnapshot = await firestore().collection('restaurants').doc(restaurantId).collection('menus').get();
          const menusData: MenuItem[] = menusSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id, // Use the document ID as the menuId
              name: data.name || 'Unknown', // Provide default values if necessary
              image: data.image || '',
              dishType: data.dishType || DishType.Starter,
              price: data.price || 0,
              allergens: data.allergens || '',
              createdAt: data.createdAt || firestore.Timestamp.now(),
            } as MenuItem;
          });
          setMenus(menusData);
        }
      } catch (error) {
        console.error('Error fetching menus:', error);
      }
    };

    fetchMenus();

    const unsubscribe = navigation.addListener
    ('focus', () => {
      fetchMenus(); // Refresh menus when the screen is focused
    });
    return unsubscribe;
  },  [navigation, user]);

  const navigateToEditMenu = (menuId: string) => {
    navigation.navigate('EditMenu', { menuId }); // Pass only menuId
  };

  return (
    <View style={styles.container}> 
      <ScrollView>
        <Text style={styles.title}>Menús del Restaurante</Text>
        {menus.map((menu, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItemContainer}
            onPress={() => navigateToEditMenu(menu.id)} // Pass only menuId
          >
            <Image
              source={{ uri: menu.image }}
              style={styles.menuImage}
            />
            <View style={styles.menuInfo}>
              <Text style={styles.menuItemText}>Nombre: {menu.name}</Text>
              <Text style={styles.menuItemText}>Tipo: {menu.dishType}</Text>
              <Text style={styles.menuItemText}>Precio: {menu.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  menuItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    paddingBottom: 10,
  },
  menuImage: {
    width: 100,
    height: 100,
    marginRight: 10,
  },
  menuInfo: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    marginBottom: 5,
  },
  addButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default MenuInfo;
