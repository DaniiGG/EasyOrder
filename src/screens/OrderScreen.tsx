import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Import Picker from dedicated package
import firestore from '@react-native-firebase/firestore';
import { useRoute, useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

type MenuItem = {
  id: string;
  image: string;
  name: string;
  price: number;
  quantity: number;
  dishType: string; 
};

const OrderScreen = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const route = useRoute();
  const navigation = useNavigation();
  const { tableId, orderedItems, pedidoId } = route.params as { tableId: string, orderedItems: { [key: string]: number }, pedidoId?: string };

  useEffect(() => {
    navigation.setOptions({ title: "Hacer Pedido" });
  }, []);

  useEffect(() => {
    const fetchMenuItemsAndCategories = async () => {
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

        const menuSnapshot = await firestore()
          .collection('restaurants')
          .doc(restaurantId)
          .collection('menus')
          .get();

        const menuData = menuSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          quantity: 0,
        }));

        setMenuItems(menuData as MenuItem[]);

        // Extract unique categories and add "All" option
        const uniqueCategories = Array.from(new Set(menuData.map(item => (item as MenuItem).dishType)));
        setCategories(['Todos', ...uniqueCategories]); 
        setSelectedCategory('Todos');
      } catch (error) {
        console.error('Error fetching menu items or categories:', error);
        Alert.alert('Error', 'No se pudieron obtener los elementos del menú o las categorías.');
      }
    };

    fetchMenuItemsAndCategories();
  }, [pedidoId]);

  const handleSelectItem = (itemId: string, quantity: number) => {
    setSelectedItems(prevState => ({
      ...prevState,
      [itemId]: quantity,
    }));
  };

  const handleCreateOrder = async () => {
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

      // Filter out items with zero quantity
      const filteredItems = Object.entries(selectedItems).reduce((acc, [itemId, quantity]) => {
        if (quantity > 0) {
          acc[itemId] = quantity;
        }
        return acc;
      }, {} as { [key: string]: number });

      if (pedidoId) {
        // Update existing order using pedidoId
        const orderDoc = await firestore()
          .collection('restaurants')
          .doc(restaurantId)
          .collection('orders')
          .doc(pedidoId)
          .get();

        if (orderDoc.exists) {
          const currentOrderData = orderDoc.data() as { items: { [key: string]: number } };
          const updatedItems = { ...currentOrderData.items };

          // Sum the new quantities with the existing ones
          for (const itemId in filteredItems) {
            if (filteredItems.hasOwnProperty(itemId)) {
              updatedItems[itemId] = (currentOrderData.items[itemId] || 0) + filteredItems[itemId];
            }
          }

          await firestore()
            .collection('restaurants')
            .doc(restaurantId)
            .collection('orders')
            .doc(pedidoId)
            .update({
              items: updatedItems,
            });

          Alert.alert('Éxito', 'Pedido actualizado correctamente.');
        } else {
          Alert.alert('Error', 'No se encontró el pedido existente.');
        }
      } else {
        // Create new order
        const orderRef = firestore()
          .collection('restaurants')
          .doc(restaurantId)
          .collection('orders')
          .doc();

        await orderRef.set({
          tableId,
          items: filteredItems,
          status: 'pending',
          createdAt: firestore.Timestamp.now(),
        });

        // Ensure the table is updated with the new order ID
        await firestore()
          .collection('restaurants')
          .doc(restaurantId)
          .collection('tables')
          .doc(tableId)
          .update({ status: 'pending', PedidoId: orderRef.id });

        Alert.alert('Éxito', 'Pedido creado correctamente.');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error creating or updating order:', error);
      Alert.alert('Error', 'No se pudo crear o actualizar el pedido.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seleccionar Elementos del Menú</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCategory}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedCategory(itemValue)}
        >
          {categories.map(category => (
            <Picker.Item key={category} label={category} value={category} />
          ))}
        </Picker>
      </View>
      <FlatList
        data={menuItems.filter(item => selectedCategory === 'Todos' || item.dishType === selectedCategory)}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.menuItem}>
            <Image
              source={{ uri: item.image }}
              style={styles.menuItemImage}
            />
            <View style={styles.menuItemDetails}>
              <View>
                <Text style={{ fontWeight: 'bold', color: 'black'}}>{item.name}</Text>
                <Text style={{ color: 'black'}}>Precio: {item.price} €</Text>
              </View>
              <View style={styles.quantityRow}>
                <TouchableOpacity onPress={() => handleSelectItem(item.id, Math.max((selectedItems[item.id] || 0) - 1, 0))}>
                  <Text style={styles.controlButton}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{selectedItems[item.id] || 0}</Text>
                <TouchableOpacity onPress={() => handleSelectItem(item.id, (selectedItems[item.id] || 0) + 1)}>
                  <Text style={styles.controlButton}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
      <Button title="Crear Pedido" onPress={handleCreateOrder} />
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 10, // Adjust border radius for rounded corners
    marginBottom: 20,// Light background color for contrast
    shadowColor: '#000', // Set shadow color
    shadowOffset: { width: 0, height: 6 }, // Further increase shadow offset height
    shadowOpacity: 0.5, // Further increase shadow opacity
    shadowRadius: 8, // Further increase shadow radius
    elevation: 8, // Further increase elevation for Android shadow
    backgroundColor: 'rgb(59, 175, 252)',
    
  },
  picker: {
    height: 'auto',
    width: '100%',
    color: '#fff', // Set text color to black
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
    color: 'black',
  },
  menuItemImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  menuItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    color: 'black',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    fontSize: 20,
    marginHorizontal: 10,
    color: '#007BFF',
  },
  quantityText: {
    fontSize: 18,
    marginHorizontal: 10,
    color: 'black',
  },
});

export default OrderScreen;