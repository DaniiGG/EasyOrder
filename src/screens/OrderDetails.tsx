import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Image, TouchableOpacity, Button } from 'react-native'; // Added Button
import firestore from '@react-native-firebase/firestore';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import auth from '@react-native-firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  Register: undefined; // Agregar la pantalla de registro al stack das
  Home: undefined;
  OrderScreen: { tableId: string; orderedItems: { [key: string]: number }; pedidoId: string };
};

const OrderDetails = () => {
  const [order, setOrder] = useState<{ items: { [key: string]: number }; status: string; tableId: string } | null>(null);
  const [menuItems, setMenuItems] = useState<{ id: string; image: string; name: string; price: number }[]>([]);
  const [updatedQuantities, setUpdatedQuantities] = useState<{ [key: string]: number }>({}); // State for updated quantities
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      const fetchOrderDetails = async () => {
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

          const orderDoc = await firestore()
            .collection('restaurants')
            .doc(restaurantId)
            .collection('orders')
            .doc(orderId)
            .get();

          if (orderDoc.exists) {
            const orderData = orderDoc.data() as { items: { [key: string]: number }; status: string; tableId: string };
            console.log('Order Data:', orderData); // Debugging log
            setOrder(orderData);

            // Fetch menu items data
            const menuSnapshot = await firestore()
              .collection('restaurants')
              .doc(restaurantId)
              .collection('menus')
              .get();

            const menuData = menuSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));

            setMenuItems(menuData as { id: string; image: string; name: string; price: number }[]);
          } else {
            Alert.alert('Error', 'No se encontró el pedido.');
          }
        } catch (error) {
          console.error('Error fetching order details:', error);
          Alert.alert('Error', 'No se pudieron obtener los detalles del pedido.');
        }
      };

      fetchOrderDetails();
    }, [orderId])
  );

  const handleQuantityChange = (itemId: string, change: number) => {
    setUpdatedQuantities(prevState => {
      const currentQuantity = prevState[itemId] !== undefined ? prevState[itemId] : 0;
      const newQuantity = currentQuantity + change;
  
      // Ensure the quantity does not go below zero
      if (newQuantity >= 0) {
        return {
          ...prevState,
          [itemId]: newQuantity,
        };
      }
      return prevState;
    });
  };
  
  const applyQuantityChanges = async () => {
    if (!order) return;
  
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
  
      // Fetch the current order from the database
      const orderDoc = await firestore()
        .collection('restaurants')
        .doc(restaurantId)
        .collection('orders')
        .doc(orderId)
        .get();
  
      if (orderDoc.exists) {
        const currentOrderData = orderDoc.data() as { items: { [key: string]: number } };
        const updatedItems = { ...currentOrderData.items };
  
        // Apply changes to the current quantities
        for (const itemId in updatedQuantities) {
          if (updatedQuantities.hasOwnProperty(itemId)) {
            updatedItems[itemId] = (currentOrderData.items[itemId] || 0) + updatedQuantities[itemId];
          }
        }
  
        // Update the order in the database
        await firestore()
          .collection('restaurants')
          .doc(restaurantId)
          .collection('orders')
          .doc(orderId)
          .update({
            items: updatedItems,
          });
  
        setOrder({ ...order, items: updatedItems });
        Alert.alert('Éxito', 'Cantidad actualizada correctamente.');
      } else {
        Alert.alert('Error', 'No se encontró el pedido.');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'No se pudo actualizar la cantidad.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalles del Pedido</Text>
      {order ? (
        <View>
          <Text>Estado: {order.status}</Text>
          {Object.entries(order.items).map(([itemId, quantity]) => {
            const menuItem = menuItems.find(item => item.id === itemId);
            return menuItem ? (
              <View key={itemId} style={styles.menuItem}>
                <Image
                  source={{ uri: menuItem.image }}
                  style={styles.menuItemImage}
                />
                <View style={styles.menuItemDetails}>
                  <Text>{menuItem.name}</Text>
                  <Text>Precio: {menuItem.price} €</Text>
                  <Text>Cantidad Pedida: {quantity}</Text>
                </View>
              </View>
            ) : null;
          })}
          <Button 
            title="Pedir Más" 
            onPress={() => {
              if (order) {
                navigation.navigate('OrderScreen', { 
                  tableId: order.tableId, 
                  orderedItems: order.items,
                  pedidoId: orderId // Pass the order ID to OrderScreen
                });
              }
            }} 
          />
        </View>
      ) : (
        <Text>Cargando...</Text>
      )}
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
    flexDirection: 'row', // Align items horizontally
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
  menuItemImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  menuItemDetails: {
    justifyContent: 'center',
    flex: 1, // Allow the details to take up remaining space
  },
});

export default OrderDetails;