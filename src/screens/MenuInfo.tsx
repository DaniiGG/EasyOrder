import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, Image, StyleSheet, TextInput,FlatList, ScrollView, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
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
  const [filteredMenus, setFilteredMenus] = useState<MenuItem[]>([]);
  const [filter, setFilter] = useState<string>('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = auth().currentUser;

  const [searchText, setSearchText] = useState('');
  const [menuItems, setMenuItems] = useState([]); // Your menu items from Firestore or state
  const [filteredItems, setFilteredItems] = useState([]);
  const [userRole, setUserRole] = useState<string | null>(null);

 useLayoutEffect(() => {
  navigation.setOptions({
    title: 'Menus',
    headerRight: () =>
      userRole === 'admin' ? (
        <TouchableOpacity onPress={() => navigation.navigate('AddMenu')} style={styles.addButton}>
          <Image
              source={require('../assets/iconoAdd.png')}
              style={{ width: 30, height: 30, borderRadius: 5 }}
            />
        </TouchableOpacity>
      ) : null,
  });
}, [navigation, userRole]);


  useEffect(() => {
     const fetchUserRole = async () => {
    const user = auth().currentUser;
    if (!user) return;

    const userDoc = await firestore().collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    if (userData?.role) {
      setUserRole(userData.role);
    }
  };

  fetchUserRole();
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
              id: doc.id,
              name: data.name || 'Unknown',
              image: data.image || '',
              dishType: data.dishType || DishType.Starter,
              price: data.price || 0,
              allergens: data.allergens || '',
              createdAt: data.createdAt || firestore.Timestamp.now(),
            } as MenuItem;
          });
          setMenus(menusData);
          setFilteredMenus(menusData); 
        }
      } catch (error) {
        console.error('Error fetching menus:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No se pudieron obtener los menús.',
        });
      }
    };

    fetchMenus();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchMenus();
    });
    return unsubscribe;
  }, [navigation, user]);

  const navigateToEditMenu = (menuId: string) => {
     if (userRole !== 'admin') {
    Toast.show({
      type: 'error',
      text1: 'Acceso denegado',
      text2: 'Solo los administradores pueden añadir menú.',
    });
    return;
  }
    navigation.navigate('EditMenu', { menuId });
  };

  const handleFilterChange = (selectedFilter: string) => {
    setFilter(selectedFilter);
    if (selectedFilter === "") {
      setFilteredMenus(menus);
    } else {
      const filtered = menus.filter(menu => menu.dishType === selectedFilter);
      setFilteredMenus(filtered);
    }
  };

  // Filter when searchText changes
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredItems(menuItems);
    } else {
      setFilteredItems(
        menuItems.filter(item =>
          (item as MenuItem).name.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
  }, [searchText, menuItems]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menús del Restaurante</Text>
      {/* Search and filter row */}
      <View style={styles.searchFilterRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar plato..."
          value={searchText}
          onChangeText={text => {
            setSearchText(text);
            // Filter menus by name as you type
            if (text.trim() === '') {
              // If no search, apply only filter
              if (filter === "") {
                setFilteredMenus(menus);
              } else {
                setFilteredMenus(menus.filter(menu => menu.dishType === filter));
              }
            } else {
              // If searching, filter by name and type
              setFilteredMenus(
                menus.filter(menu =>
                  menu.name.toLowerCase().includes(text.toLowerCase()) &&
                  (filter === "" || menu.dishType === filter)
                )
              );
            }
          }}
          placeholderTextColor="#888"
        />
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={filter}
            onValueChange={selectedFilter => {
              setFilter(selectedFilter);
              // Filter menus by type and search text
              if (selectedFilter === "") {
                if (searchText.trim() === '') {
                  setFilteredMenus(menus);
                } else {
                  setFilteredMenus(
                    menus.filter(menu =>
                      menu.name.toLowerCase().includes(searchText.toLowerCase())
                    )
                  );
                }
              } else {
                setFilteredMenus(
                  menus.filter(menu =>
                    menu.dishType === selectedFilter &&
                    (searchText.trim() === '' ||
                      menu.name.toLowerCase().includes(searchText.toLowerCase()))
                  )
                );
              }
            }}
            style={styles.picker}
          >
            <Picker.Item label="Todos" value="" />
            <Picker.Item label="Entrante" value={DishType.Starter} />
            <Picker.Item label="Primer Plato" value={DishType.MainCourse} />
            <Picker.Item label="Segundo Plato" value={DishType.SecondoCourse} />
            <Picker.Item label="Postre" value={DishType.Dessert} />
            <Picker.Item label="Bebida" value={DishType.Beverage} />
            <Picker.Item label="Tapa" value={DishType.Tapa} />
          </Picker>
        </View>
      </View>
      <ScrollView>
        {filteredMenus.map((menu, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigateToEditMenu(menu.id)}
          >
            <Image
              source={{ uri: menu.image }}
              style={styles.menuImage}
            />
            <View style={styles.menuInfo}>
              <Text style={styles.menuItemText}>Nombre: {menu.name}</Text>
              <Text style={styles.menuItemText}>Tipo: {menu.dishType}</Text>
              <Text style={styles.menuItemText}>Precio: {menu.price} €</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Toast />
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
    color: 'black',
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
    color: 'black',
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
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8, // If using RN >= 0.71, otherwise use marginRight on searchInput
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
    color: 'black',
  },
  pickerWrapper: {
    flex: 1,
    minWidth: 120,
    maxWidth: 180,
    backgroundColor: 'rgb(59, 175, 252)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    color: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    padding: 15,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, 
    marginLeft: 5,
    marginRight: 5,
  },
});

export default MenuInfo;
