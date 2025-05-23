import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Image, TouchableOpacity, Button } from 'react-native'; // Added Button
import firestore from '@react-native-firebase/firestore';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import auth from '@react-native-firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import Toast from 'react-native-toast-message';  

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
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
  const statusTranslations: { [key: string]: string } = {
    pending: 'Pendiente',
    served: 'Servido',
    completed: 'Completado',
  };


  useEffect(() => {
    navigation.setOptions({ title: "Detalles del Pedido" ,
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={[
                styles.statusCircle,
                { backgroundColor: order?.status === 'pending' ? '#dc401e' : order?.status === 'served' ? '#60dc1e' : '#28a745' }
              ]}
            />
            <Text style={{color:'#fff', fontWeight:'bold'}}>{order?.status ? statusTranslations[order.status] || order.status : ''}</Text>
          </View>
      )


     
    })

  })
  

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
        Toast.show({
          type: 'success',
          text1: 'Éxito',
          text2: 'Cantidad actualizada correctamente.',
        });
      } else {
        Alert.alert('Error', 'No se encontró el pedido.');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo actualizar la cantidad.',
      });
    }
  };

  const calculateTotalPrice = () => {
    if (!order) return 0;
    return Object.entries(order.items).reduce((total, [itemId, quantity]) => {
      const menuItem = menuItems.find(item => item.id === itemId);
      if (menuItem) {
        total += menuItem.price * quantity;
      }
      return total;
    }, 0);
  };

  const updateOrderAndTableStatus = async (orderStatus: string, tableStatus: string) => {
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado.');
        return;
      }
  
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      const restaurantId = userData?.restaurantId;
  
      if (!restaurantId || !order) {
        Alert.alert('Error', 'No se encontró el ID del restaurante o el pedido.');
        return;
      }
  
      // Update order status
      await firestore()
        .collection('restaurants')
        .doc(restaurantId)
        .collection('orders')
        .doc(orderId)
        .update({ status: orderStatus });
  
      // Update table status
      await firestore()
        .collection('restaurants')
        .doc(restaurantId)
        .collection('tables')
        .doc(order.tableId)
        .update({ status: tableStatus });
  
      Alert.alert('Éxito', `Estado actualizado a ${orderStatus}.`);
      Toast.show({
        type: 'success',
        text1: 'Éxito',
        text2: `Estado actualizado a ${orderStatus}.`,
      });
      navigation.goBack(); // Return to previous screen after status update
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            order?.status === 'served' ? styles.buttonDisabled : styles.buttonServido
          ]}
          onPress={() => updateOrderAndTableStatus('served', 'served')}
          disabled={order?.status === 'served'}
        >
          <Text style={styles.buttonText}>Servido</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            order?.status === 'completed' ? styles.buttonDisabled : styles.buttonPagado
          ]}
          onPress={() => updateOrderAndTableStatus('completed', 'free')}
          disabled={order?.status === 'completed'}
        >
          <Text style={styles.buttonText}>Pagado</Text>
        </TouchableOpacity>
      </View>
      {order ? (
        <View style={styles.content}>
          
          {Object.entries(order.items).map(([itemId, quantity]) => {
            const menuItem = menuItems.find(item => item.id === itemId);
            return menuItem ? (
              <View key={itemId} style={styles.menuItem}>
                <Image
                  source={{ uri: menuItem.image }}
                  style={styles.menuItemImage}
                />
                <View style={styles.menuItemDetails}>
                  <View style={styles.menuItemText}>
                    <Text style={{ fontWeight: 'bold' }}>{menuItem.name}</Text>
                    <Text>Precio (Ud.): {menuItem.price} €</Text>
                    <Text >Cantidad: {quantity}</Text>
                  </View>
                  <Text style={styles.itemTotalPrice}>
                    Total: {(menuItem.price * quantity).toFixed(2)} €
                  </Text>
                </View>
              </View>
            ) : null;
          })}
          <Text style={styles.totalPrice}>Precio Total: {calculateTotalPrice()} €</Text>
        </View>
      ) : (
        <Text>Cargando...</Text>
      )}
      <View>
        <Button 
          title="Pedir Más" 
          onPress={async () => {
            if (order) {
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
  
              // Update order status to pending when ordering more items
              await firestore()
                .collection('restaurants')
                .doc(restaurantId)
                .collection('orders')
                .doc(orderId)
                .update({ status: 'pending' });
  
              // Update table status to pending
              await firestore()
                .collection('restaurants')
                .doc(restaurantId)
                .collection('tables')
                .doc(order.tableId)
                .update({ status: 'pending' });
  
              navigation.navigate('OrderScreen', { 
                tableId: order.tableId, 
                orderedItems: order.items,
                pedidoId: orderId // Pass the order ID to OrderScreen
              });
            }
          }} 
        />
      </View>
      <Toast/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa', 
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#343a40', 
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
  },
  menuItemImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  menuItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    justifyContent: 'center',
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    color: '#495057', // Darker text color
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonServido: {
    backgroundColor: '#28a745',
  },
  buttonPagado: {
    backgroundColor: '#000',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default OrderDetails;