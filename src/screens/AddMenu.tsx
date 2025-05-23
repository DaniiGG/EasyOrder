import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Image } from 'react-native';
import Toast from 'react-native-toast-message'; 

enum DishType {
  Starter = 'Entrante',
  MainCourse = 'Primer Plato',
  SecondoCourse = 'Segundo Plato',
  Dessert = 'Postre',
  Beverage = 'Bebida',
  Tapa = 'Tapa'
}


const AddMenu = () => {
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    image: '',
    dishType: DishType.Starter,
    price: '',
    allergens: '',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null); 
  const navigation = useNavigation();

  useEffect(() => { 
    navigation.setOptions({ title: "Añadir menu" });
  }, []);

  const handleImagePick = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo' });

    if (result.didCancel || !result.assets || result.assets.length === 0) {
      Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No se seleccionó ninguna imagen.',
        });
      return;
    }

    const asset = result.assets[0];
    const { uri, fileName } = asset;

    if (!uri || !fileName) {
      console.error('Error: URI or fileName is missing.');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo obtener la imagen seleccionada.',
      });
      return;
    }

    setImagePreview(uri);

    try {
      const reference = storage().ref(`images/${fileName}`);
      await reference.putFile(uri);
      const url = await reference.getDownloadURL();
      setNewMenuItem(prevState => ({ ...prevState, image: url }));
      console.log('Image URL set:', url);
    } catch (error) {
      console.error('Error uploading image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo abrir la imagen.',
      });
    }
  };

  const handleSelectDishType = (type: DishType) => {
    setNewMenuItem({ ...newMenuItem, dishType: type });
    setModalVisible(false);
  };

  const handleAddMenuItem = async () => {
    try {
      console.log('Menu item to add:', newMenuItem); 
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
          text2: 'No se encontro el id del restaurante.',
        });
        return;
      }
  
      if (!newMenuItem.image) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'La url de la imagen no está presente.',
        });
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
  
        Toast.show({
          type: 'success',
          text1: 'Éxito',
          text2: 'Elemento del menú añadido correctamente.',
        });
    } catch (error) {
      console.error('Error adding menu item:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo añadir el elemento del menú.',
      });
    }
  };

  

  return (
    <View style={styles.container}> 
    
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Añadir Nuevo Elemento del Menú</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del Plato</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del Plato"
            value={newMenuItem.name}
            onChangeText={(text) => setNewMenuItem({ ...newMenuItem, name: text })}
            placeholderTextColor="gray"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Precio</Text>
          <TextInput
            style={styles.input}
            placeholder="Precio"
            value={newMenuItem.price.toString()}
            onChangeText={(text) => setNewMenuItem({ ...newMenuItem, price: text })}
            keyboardType="numeric"
            placeholderTextColor="gray"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Alérgenos</Text>
          <TextInput  
            style={styles.input}
            placeholder="Alérgenos"
            value={newMenuItem.allergens}
            onChangeText={(text) => setNewMenuItem({ ...newMenuItem, allergens: text })}
            placeholderTextColor="gray"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de Plato</Text>
          <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
            <Text style={styles.buttonText}>{newMenuItem.dishType || 'Seleccionar Tipo de Plato'}</Text>
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
          <Text style={styles.label}>Imagen</Text>
          <Button title="Seleccionar Imagen" onPress={handleImagePick} />
          {imagePreview && (
            <Image
              source={{ uri: imagePreview }}
              style={{ width: 100, height: 100, marginTop: 10, marginBottom: 5 }} 
            />
          )}
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.addButton} onPress={handleAddMenuItem}>
        <Image
          source={require('../assets/iconoAdd.png')} 
          style={styles.addIcon}
        />
      </TouchableOpacity>
      <Toast />
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
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007BFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addIcon: {
    width: 30,
    height: 30,
    tintColor: '#fff',
  },
});

export default AddMenu;