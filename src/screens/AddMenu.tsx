import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

enum DishType {
  Starter = 'Entrante',
  MainCourse = 'Primer Plato',
  SecondoCourse = 'Segundo Plato',
  Dessert = 'Postre',
  Beverage = 'Bebida',
}

const AddMenu = () => {
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    image: '',
    dishType: DishType.Starter,
    price: 0,
    allergens: '',
  });
  const [modalVisible, setModalVisible] = useState(false);

  const handleImagePick = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo' });

    if (result.didCancel || !result.assets || result.assets.length === 0) {
      Alert.alert('Error', 'No se seleccionó ninguna imagen.');
      return;
    }

    const asset = result.assets[0];
    const { uri, fileName } = asset;

    if (!uri || !fileName) {
      console.error('Error: URI or fileName is missing.');
      Alert.alert('Error', 'No se pudo obtener la imagen seleccionada.');
      return;
    }

    try {
      const reference = storage().ref(`images/${fileName}`);
      await reference.putFile(uri);
      const url = await reference.getDownloadURL();
      setNewMenuItem({ ...newMenuItem, image: url });
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'No se pudo subir la imagen.');
    }
  };

  const handleSelectDishType = (type: DishType) => {
    setNewMenuItem({ ...newMenuItem, dishType: type });
    setModalVisible(false);
  };

  const handleAddMenuItem = async () => {
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

      await firestore()
        .collection('restaurants')
        .doc(restaurantId)
        .collection('menus')
        .add({
          ...newMenuItem,
          createdAt: firestore.Timestamp.now(),
        });

      Alert.alert('Éxito', 'Elemento del menú añadido correctamente.');
    } catch (error) {
      console.error('Error adding menu item:', error);
      Alert.alert('Error', 'No se pudo añadir el elemento del menú.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Añadir Nuevo Elemento del Menú</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del Plato"
        value={newMenuItem.name}
        onChangeText={(text) => setNewMenuItem({ ...newMenuItem, name: text })}
        placeholderTextColor="gray"
      />
      
      
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
            <Button title="Cerrar" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
      <TextInput
        style={styles.input}
        placeholder="Precio"
        value={newMenuItem.price === 0 ? '' : newMenuItem.price.toString()}
        onChangeText={(text) => {
          const parsedPrice = parseFloat(text);
          if (!isNaN(parsedPrice) || text === '') {
            setNewMenuItem({ ...newMenuItem, price: text === '' ? 0 : parsedPrice });
          }
        }}
        keyboardType="numeric"
        placeholderTextColor="gray"
      />
      <TextInput
        style={styles.input}
        placeholder="Alérgenos"
        value={newMenuItem.allergens}
        onChangeText={(text) => setNewMenuItem({ ...newMenuItem, allergens: text })}
        placeholderTextColor="gray"
      />
      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>{newMenuItem.dishType || 'Seleccionar Tipo de Plato'}</Text>
      </TouchableOpacity>
      <Button title="Seleccionar Imagen" onPress={handleImagePick} />
      <Button title="Añadir Elemento del Menú" onPress={handleAddMenuItem} />
    </ScrollView>
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
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
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
    backgroundColor: 'white',
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

export default AddMenu;