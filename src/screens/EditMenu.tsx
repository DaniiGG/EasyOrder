import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image,ScrollView, TouchableOpacity, Modal } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import  MenuInfo  from './MenuInfo';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message'; 

enum DishType {
  Starter = 'Entrante',
  MainCourse = 'Primer Plato',
  SecondoCourse = 'Segundo Plato',
  Dessert = 'Postre',
  Beverage = 'Bebida',
  Tapa = 'Tapa',
}


const EditMenu = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { menuId } = route.params as { menuId: string };
  const [menuItem, setMenuItem] = useState({
    name: '',
    image: '',
    dishType: DishType.Starter,
    price: 0,
    allergens: '',
    createdAt: firestore.Timestamp.now(),
  });
  const [modalVisible, setModalVisible] = useState(false);
  

  useEffect(() => {
    const fetchMenuItem = async () => {
      try {
        const user = auth().currentUser;
        const userDoc = await firestore().collection('users').doc(user?.uid || '').get();
        const userData = userDoc.data();
        const restaurantId = userData?.restaurantId;

        const menuDoc = await firestore()
          .collection('restaurants')
          .doc(restaurantId)
          .collection('menus')
          .doc(menuId)
          .get();
        
        if (menuDoc.exists) {
          setMenuItem(menuDoc.data() as typeof menuItem);
        } else {
          Alert.alert('Error', 'Menu item not found.');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching menu item:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No se pudo obtener elementos del menú.',
        });
      }
    };

    fetchMenuItem();
  }, [menuId]);

  const handleSave = async () => {
    try {
      console.log('Menu ID:', menuId);
      console.log('Saving menu item:', menuItem);

      const updatedMenuItem = { ...menuItem };

      const user = auth().currentUser;
      const userDoc = await firestore().collection('users').doc(user?.uid || '').get();
      const userData = userDoc.data();
      const restaurantId = userData?.restaurantId;

      await firestore()
        .collection('restaurants')
        .doc(restaurantId)
        .collection('menus')
        .doc(menuId)
        .update(updatedMenuItem);

      Alert.alert('Éxito', 'Elemento del menú actualizado correctamente.');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating menu item:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo actualizar el elemento del menú.',
      });
    }
  };

  const handleDelete = async () => {
    try {
      const user = auth().currentUser;
      const userDoc = await firestore().collection('users').doc(user?.uid || '').get();
      const userData = userDoc.data();
      const restaurantId = userData?.restaurantId;

      await firestore()
        .collection('restaurants')
        .doc(restaurantId)
        .collection('menus')
        .doc(menuId)
        .delete();
      Alert.alert('Éxito', 'Elemento del menú eliminado correctamente.');
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo eliminar el elemento del menú.',
      });
    }
  };

  const handleSelectDishType = (type: DishType) => {
    setMenuItem({ ...menuItem, dishType: type });
    setModalVisible(false);
  };

  useEffect(() => {
    navigation.setOptions({ title: "Editar menu" });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Elemento del Menú</Text>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Imagen</Text>
          <Image
            source={{ uri: menuItem.image }}
            style={{ width: 100, height: 100, marginBottom: 10 }}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del Plato</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del Plato"
            value={menuItem.name}
            onChangeText={(text) => setMenuItem({ ...menuItem, name: text })}
            placeholderTextColor="gray"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Precio</Text>
          <TextInput
            style={styles.input}
            placeholder="Precio"
            value={menuItem.price === 0 ? '' : menuItem.price.toString()}
            onChangeText={(text) => {
              const parsedPrice = parseFloat(text);
              if (!isNaN(parsedPrice) || text === '') {
                setMenuItem({ ...menuItem, price: text === '' ? 0 : parsedPrice });
              }
            }}
            keyboardType="numeric"
            placeholderTextColor="gray"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Alérgenos</Text>
          <TextInput
            style={styles.input}
            placeholder="Alérgenos"
            value={menuItem.allergens}
            onChangeText={(text) => setMenuItem({ ...menuItem, allergens: text })}
            placeholderTextColor="gray"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de Plato</Text>
          <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
            <Text style={styles.buttonText}>{menuItem.dishType || 'Seleccionar Tipo de Plato'}</Text>
          </TouchableOpacity>
        </View>

        <Modal
          transparent={true}
          animationType="slide"
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity onPress={() => handleSelectDishType(DishType.Starter)}>
                <Text style={styles.modalItem}>Entrante</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSelectDishType(DishType.MainCourse)}>
                <Text style={styles.modalItem}>Primer Plato</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSelectDishType(DishType.SecondoCourse)}>
                <Text style={styles.modalItem}>Segundo Plato</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSelectDishType(DishType.Dessert)}>
                <Text style={styles.modalItem}>Postre</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSelectDishType(DishType.Beverage)}>
                <Text style={styles.modalItem}>Bebida</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSelectDishType(DishType.Tapa)}>
                <Text style={styles.modalItem}>Tapa</Text>
              </TouchableOpacity>
              <Button title="Cerrar" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </Modal>

        <View style={styles.inputGroup}>
          <Button title="Guardar" onPress={handleSave} />
        </View>
        <View style={styles.inputGroup}>
          <Button title="Borrar" color="#dc3545" onPress={handleDelete} />
        </View>
      </ScrollView>
      <Toast/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#343a40',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: 'black',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalItem: {
    fontSize: 18,
    padding: 10,
    textAlign: 'center',
  },
});

export default EditMenu;