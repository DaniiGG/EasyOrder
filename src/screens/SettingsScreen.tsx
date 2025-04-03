import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Register: undefined;
  Settings: undefined;
  ResInfo: undefined;
  MenuInfo: undefined; // También asegúrate de definir las otras pantallas
  MesasInfo: undefined;
  Profile: { userId: string };
};



const SettingsScreen = () => {

  useEffect(() => {
      navigation.setOptions({ title: "Ajustes" });
    }, []);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();


  const sections = [
    { title: 'Información del Restaurante', fotoUrl: require('../assets/iconoCamarero.png'), description: 'Configuración de diversos datos de su restaurante', screen: 'ResInfo'  as keyof RootStackParamList },
    { title: 'Gestión de Menús', fotoUrl: require('../assets/iconoComida.png'), description: 'Configuración de los menús y platos que ofrece el restaurante', screen: 'MenuInfo'  as keyof RootStackParamList },
    { title: 'Configuración de Mesas', fotoUrl: require('../assets/iconoMesa.png'), description: 'Configuración de las mesas que va a haber en el restaurante', screen: 'MesasInfo'  as keyof RootStackParamList },
    //{ title: 'Preferencias Generales', fotoUrl: require('../assets/iconoMesa.png'), description: 'Ajustes generales del restaurante', screen: 'GeneralSettings' },
  ];

  return (
    
    <View style={styles.container}>
      {sections.map((section, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.sectionButton} 
          onPress={() => navigation.navigate(section.screen as never)}
        >
          <View style={styles.sectionContent}>
            <Image source={section.fotoUrl} style={styles.image} />
            <View style={styles.textContainer}>
              <Text style={styles.sectionText}>{section.title}</Text>
              <Text style={styles.sectionSubText}>{section.description}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
      
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sectionContent: {
    flexDirection: 'row', // Establece una dirección horizontal
    alignItems: 'center', // Centra los elementos verticalmente en el contenedor
  },
  textContainer: {
    flex: 1, // Asegura que el contenedor de texto ocupe todo el espacio restante
  },
  sectionButton: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 1,
    elevation: 2, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionText: {
    fontSize: 18,
    fontWeight: '500',
  },
  sectionSubText: {
    fontSize: 12,
    color: 'grey'
  },
  image: {
    width: 45,
    height: 45,
    marginRight: 15, // Espacio entre la imagen y los textos
  },
});

export default SettingsScreen;
