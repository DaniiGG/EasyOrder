import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, TextInput, TouchableOpacity, Image } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

type RootStackParamList = {
  Home: undefined;
  UserInfo: undefined;
};

const UserInfo = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editField, setEditField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<{ [key: string]: string }>({});
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = auth().currentUser;

  useEffect(() => {
    navigation.setOptions({ title: "Mi perfil" });
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const data = userDoc.data();
        setUserData(data);
        setFieldValues({
          name: data?.name || '',
          email: data?.email || '',
          phoneNumber: data?.phoneNumber || '',
          address: data?.address || '',
        });
      } catch (error) {
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleEdit = (field: string) => {
    setEditField(field);
  };

  const handleSave = async (field: string) => {
    if (!user) return;
    try {
      await firestore().collection('users').doc(user.uid).update({
        [field]: fieldValues[field],
      });
      setUserData({ ...userData, [field]: fieldValues[field] });
      setEditField(null);
      Toast.show({
        type: 'success',
        text1: 'Actualizado',
        text2: `El campo ${field} se ha actualizado correctamente.`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `No se pudo actualizar el campo ${field}.`,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.centered}>
        <Text>No se encontraron datos del usuario.</Text>
        <Button title="Volver" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Información del Usuario</Text>
      {/* Name */}
      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Nombre:</Text>
          <TextInput
            style={[
              styles.input,
              editField === 'name' ? styles.inputEnabled : styles.inputDisabled
            ]}
            value={fieldValues.name}
            editable={editField === 'name'}
            onChangeText={text => setFieldValues({ ...fieldValues, name: text })}
            placeholder="Nombre"
            placeholderTextColor="#aaa"
          />
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            editField === 'name' ? handleSave('name') : handleEdit('name')
          }
        >
          <Image
            source={
              editField === 'name'
                ? require('../assets/iconoGuardar.png')
                : require('../assets/iconoEditar.png')
            }
            style={styles.iconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      {/* Email */}
      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Correo electrónico:</Text>
          <TextInput
            style={[
              styles.input,
              editField === 'email' ? styles.inputEnabled : styles.inputDisabled
            ]}
            value={fieldValues.email}
            editable={editField === 'email'}
            onChangeText={text => setFieldValues({ ...fieldValues, email: text })}
            keyboardType="email-address"
            placeholder="Correo electrónico"
            placeholderTextColor="#aaa"
          />
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            editField === 'email' ? handleSave('email') : handleEdit('email')
          }
        >
          <Image
            source={
              editField === 'email'
                ? require('../assets/iconoGuardar.png')
                : require('../assets/iconoEditar.png')
            }
            style={styles.iconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      {/* Phone */}
      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Teléfono:</Text>
          <TextInput
            style={[
              styles.input,
              editField === 'phoneNumber' ? styles.inputEnabled : styles.inputDisabled
            ]}
            value={fieldValues.phoneNumber}
            editable={editField === 'phoneNumber'}
            onChangeText={text => setFieldValues({ ...fieldValues, phoneNumber: text })}
            keyboardType="phone-pad"
            placeholder="Teléfono"
            placeholderTextColor="#aaa"
          />
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            editField === 'phoneNumber' ? handleSave('phoneNumber') : handleEdit('phoneNumber')
          }
        >
          <Image
            source={
              editField === 'phoneNumber'
                ? require('../assets/iconoGuardar.png')
                : require('../assets/iconoEditar.png')
            }
            style={styles.iconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Dirección:</Text>
          <TextInput
            style={[
              styles.input,
              editField === 'address' ? styles.inputEnabled : styles.inputDisabled
            ]}
            value={fieldValues.address}
            editable={editField === 'address'}
            onChangeText={text => setFieldValues({ ...fieldValues, address: text })}
            placeholder="Dirección"
            placeholderTextColor="#aaa"
          />
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            editField === 'address' ? handleSave('address') : handleEdit('address')
          }
        >
          <Image
            source={
              editField === 'address'
                ? require('../assets/iconoGuardar.png')
                : require('../assets/iconoEditar.png')
            }
            style={styles.iconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      <Button title="Volver" onPress={() => navigation.goBack()} />
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#343a40',
  },
  label: {
    fontSize: 16,
    color: '#495057',
    marginTop: 10,
  },
  input: {
    fontSize: 18,
    color: '#222',
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 5,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#e0e0e0',
    color: '#888',
  },
  inputEnabled: {
    backgroundColor: '#fff',
    color: '#222',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 8,
  },
  iconButton: {
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: 'rgb(59, 175, 252)',
  },
  iconImage: {
    width: 28,
    height: 28,
  },
});

export default UserInfo;