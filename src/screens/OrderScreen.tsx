import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useRoute, useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

type MenuItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

const OrderScreen = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  const route = useRoute();
  const navigation = useNavigation();
  const { tableId, orderedItems } = route.params as { tableId: string, orderedItems: { [key: string]: number } };

  useEffect(() => {
    const fetchMenuItems = async () => {
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
          quantity: 0, // Initialize quantity
        }));

        console.log('Fetched menu data:', menuData); // Log fetched menu data

        // Remove filtering logic
        setMenuItems(menuData as MenuItem[]);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        Alert.alert('Error', 'No se pudieron obtener los elementos del menú.');
      }
    };

    fetchMenuItems();
  }, []);

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

      await firestore()
        .collection('restaurants')
        .doc(restaurantId)
        .collection('tables')
        .doc(tableId)
        .update({ status: 'occupied', PedidoId: orderRef.id });

      Alert.alert('Éxito', 'Pedido creado correctamente.');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'No se pudo crear el pedido.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seleccionar Elementos del Menú</Text>
      <FlatList
        data={menuItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.menuItem}>
            <Text>{item.name} - ${item.price}</Text>
            <Text>Cantidad: {selectedItems[item.id] || 0}</Text>
            <Button
              title="Añadir"
              onPress={() => handleSelectItem(item.id, (selectedItems[item.id] || 0) + 1)}
            />
            <Button
              title="Quitar"
              onPress={() => handleSelectItem(item.id, Math.max((selectedItems[item.id] || 0) - 1, 0))}
            />
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
  },
  menuItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
});

export default OrderScreen;