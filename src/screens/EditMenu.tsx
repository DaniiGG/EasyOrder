import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image, ScrollView, TouchableOpacity, Modal } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MenuInfo from './MenuInfo';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import { toString } from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage'

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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);


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
      setMenuItem(prev => ({ ...prev, image: url }));
      Toast.show({
        type: 'success',
        text1: 'Éxito',
        text2: 'Imagen subida correctamente.',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo subir la imagen.',
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

    fieldErrors.name = validateField('name', menuItem.name);
    fieldErrors.price = validateField('price', menuItem.price.toString());
    fieldErrors.image = validateField('image', menuItem.image);
    fieldErrors.allergens = validateField('allergens', menuItem.allergens);
    fieldErrors.dishType = validateField('dishType', menuItem.dishType);

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

  const handleSave = async () => {
    if (!validateFields()) return;
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
      Toast.show({
        type: 'success',
        text1: 'Éxito',
        text2: 'Elemento del menú actualizado correctamente.',
      });
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
      Toast.show({
        type: 'success',
        text1: 'Éxito',
        text2: 'Elemento del menú eliminado correctamente.',
      });
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
            source={{ uri: imagePreview || menuItem.image }}
            style={{ width: 100, height: 100, marginBottom: 10 }}
          />
          <Button title="Cambiar Imagen" onPress={handleImagePick} />
          {touched.image && errors.image ? (
            <Text style={styles.errorText}>{errors.image}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del Plato</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del Plato"
            value={menuItem.name}
            onChangeText={(text) => setMenuItem({ ...menuItem, name: text })}
            placeholderTextColor="gray"
            onBlur={() => handleBlur('name', menuItem.name)}
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
            value={menuItem.price === 0 ? '' : menuItem.price.toString()}
            onChangeText={(text) => {
              const parsedPrice = parseFloat(text);
              if (!isNaN(parsedPrice) || text === '') {
                setMenuItem({ ...menuItem, price: text === '' ? 0 : parsedPrice });
              }
            }}
            keyboardType="numeric"
            placeholderTextColor="gray"
            onBlur={() => handleBlur('price', menuItem.price.toString())}
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
            value={menuItem.allergens}
            onChangeText={(text) => setMenuItem({ ...menuItem, allergens: text })}
            placeholderTextColor="gray"
            onBlur={() => handleBlur('allergens', menuItem.allergens)}
          />
          {touched.allergens && errors.allergens ? (
            <Text style={styles.errorText}>{errors.allergens}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de Plato</Text>
          <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
            <Text style={styles.buttonText}>{menuItem.dishType || 'Seleccionar Tipo de Plato'}</Text>
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
          <Button title="Guardar" onPress={handleSave} />
        </View>
        <View style={styles.inputGroup}>
          <Button title="Borrar" color="#dc3545" onPress={() => setDeleteModalVisible(true)} />
        </View>
      </ScrollView>
      <Toast />
      <Modal
        transparent={true}
        animationType="fade"
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, marginBottom: 20 }}>¿Estás seguro de que deseas eliminar este elemento?</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#dc3545', flex: 1, marginRight: 10 }]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  handleDelete();
                }}
              >
                <Text style={styles.buttonText}>Sí, eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#6c757d', flex: 1 }]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  errorText: {
    color: 'red',
    fontSize: 13,
    marginTop: 2,
    marginLeft: 2,
  },
});

export default EditMenu;