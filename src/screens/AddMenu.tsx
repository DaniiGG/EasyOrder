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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [userRole, setUserRole] = useState<string | null>(null);



  useEffect(() => {
  navigation.setOptions({ title: "Añadir menu" });

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

  const validateField = (field: string, value: string) => {
  switch (field) {
    case 'name':
      if (!value.trim()) return 'El nombre es obligatorio.';
      break;
    case 'price':
      if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Precio inválido. Usa formato 0.00.';
      break;
    case 'image':
      if (!value) return 'La imagen es obligatoria.';
      break;
    case 'allergens':
      if (!value.trim()) return 'Los alérgenos son obligatorios.';
      break;
    case 'dishType':
      if (!value) return 'El tipo de plato es obligatorio.';
      break;
    default:
      return '';
  }
  return '';
};


    const validateFields = () => {
  const fieldErrors: { [key: string]: string } = {};

  fieldErrors.name = validateField('name', newMenuItem.name);
  fieldErrors.price = validateField('price', newMenuItem.price);
  fieldErrors.image = validateField('image', newMenuItem.image);
  fieldErrors.allergens = validateField('allergens', newMenuItem.allergens);
  fieldErrors.dishType = validateField('dishType', newMenuItem.dishType);

  setErrors(fieldErrors);
  setTouched({
    name: true,
    price: true,
    image: true,
    allergens: true,
    dishType: true,
  });

  const hasErrors = Object.values(fieldErrors).some(error => error !== '');
  if (hasErrors) {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'Por favor, completa los campos correctamente.',
    });
    return false;
  }
  return true;
};

const handleBlur = (field: string, value: string) => {
  setTouched({ ...touched, [field]: true });
  const error = validateField(field, value);
  setErrors({ ...errors, [field]: error });
};

  const handleSelectDishType = (type: DishType) => {
    setNewMenuItem({ ...newMenuItem, dishType: type });
    setModalVisible(false);
  };

  const handleAddMenuItem = async () => {
    
    if (!validateFields()) return;
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
            onBlur={() => handleBlur('name', newMenuItem.name)}
          />
          {touched.name && errors.name ? (
  <Text style={styles.errorText}>{errors.name}</Text>
) : null}
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
            onBlur={() => handleBlur('price', newMenuItem.price)}
          />
          {touched.price && errors.price ? (
  <Text style={styles.errorText}>{errors.price}</Text>
) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Alérgenos</Text>
          <TextInput
            style={styles.input}
            placeholder="Alérgenos"
            value={newMenuItem.allergens}
            onChangeText={(text) => setNewMenuItem({ ...newMenuItem, allergens: text })}
            placeholderTextColor="gray"
            onBlur={() => handleBlur('allergens', newMenuItem.allergens)}
          />
          {touched.allergens && errors.allergens ? (
  <Text style={styles.errorText}>{errors.allergens}</Text>
) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de Plato</Text>
          <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
            <Text style={styles.buttonText}>{newMenuItem.dishType || 'Seleccionar Tipo de Plato'}</Text>
          </TouchableOpacity>
          {touched.dishType && errors.dishType ? (
  <Text style={styles.errorText}>{errors.dishType}</Text>
) : null}
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
  errorText: {
  color: 'red',
  fontSize: 13,
  marginTop: 2,
  marginLeft: 2,
},
});

export default AddMenu;