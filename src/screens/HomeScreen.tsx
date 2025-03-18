import React from 'react';
import {View, Text, Button, Alert, StyleSheet, Image} from 'react-native';
import auth from '@react-native-firebase/auth';

const Home = () => {
  const user = auth().currentUser;

  const handleLogout = async () => {
    await auth().signOut();
    Alert.alert('Sesión cerrada', 'Has cerrado sesión exitosamente.');
  };

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>Bienvenido, {user?.email}</Text>
      <Button title="Cerrar Sesión" onPress={handleLogout} />

      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/aa.png')}
          style={styles.image}
        />
        <Text style={styles.number}>42</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative', // Permite posicionar elementos encima de la imagen
    width: 100, // Ancho de la imagen
    height: 100, // Alto de la imagen
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10, // Opcional: bordes redondeados
  },
  number: {
    position: 'absolute', // Posiciona el texto sobre la imagen
    top: '50%', // Centra verticalmente
    left: '53%', // Centra horizontalmente
    transform: [{ translateX: -50 }, { translateY: -50 }], // Ajusta la posición al centro exacto
    fontSize: 30, // Tamaño del número
    fontWeight: 'bold', // Fondo semitransparente
    padding: 10,
    borderRadius: 10,
  },
});
export default Home;
