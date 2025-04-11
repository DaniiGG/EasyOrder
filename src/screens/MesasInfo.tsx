import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TextInput, Button } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const MesasInfo = () => {
  const [tables, setTables] = useState<{ id: string; numero: string, status: string; PedidoId: string }[]>([]);
  const [numeroDeMesas, setNumeroDeMesas] = useState(0);

  useEffect(() => {
    const fetchTables = async () => {
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

        const tablesSnapshot = await firestore()
          .collection('restaurants')
          .doc(restaurantId)
          .collection('tables')
          .get();

        const tablesData = tablesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTables(tablesData as { id: string; numero: string, status: string; PedidoId: string }[]);
      } catch (error) {
        console.error('Error fetching tables:', error);
        Alert.alert('Error', 'No se pudieron obtener las mesas.');
      }
    };

    fetchTables();
  }, []);

  const handleGenerateTables = async () => {
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

      const existingTablesSnapshot = await firestore()
        .collection('restaurants')
        .doc(restaurantId)
        .collection('tables')
        .get();

      const batchDelete = firestore().batch();
      existingTablesSnapshot.docs.forEach(doc => {
        batchDelete.delete(doc.ref);
      });
      await batchDelete.commit();

      const batchCreate = firestore().batch();
      for (let i = 0; i < numeroDeMesas; i++) {
        const tableRef = firestore()
          .collection('restaurants')
          .doc(restaurantId)
          .collection('tables')
          .doc();

        batchCreate.set(tableRef, {
          status: 'Libre', 
          PedidoId: '', 
          numero: i + 1, 
          createdAt: firestore.Timestamp.now(),
        });
      }

      await batchCreate.commit();

      Alert.alert('Éxito', `${numeroDeMesas} mesas añadidas correctamente.`);
      setNumeroDeMesas(0); 
      setTables([]); 
    } catch (error) {
      console.error('Error generating tables:', error);
      Alert.alert('Error', 'No se pudieron añadir las mesas.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Información de Mesas</Text>
      <TextInput
        style={styles.input}
        placeholder="Número de Mesas"
        value={numeroDeMesas === 0 ? '' : numeroDeMesas.toString()}
        onChangeText={(text) => {
          const parsedNumber = parseInt(text, 10);
          if (!isNaN(parsedNumber) || text === '') {
            setNumeroDeMesas(text === '' ? 0 : parsedNumber);
          }
        }}
        keyboardType="numeric"
        placeholderTextColor="gray"
      />
      <Button title="Generar Mesas" onPress={handleGenerateTables} />
      <FlatList
        data={tables}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.tableItem}>
            <Text>Numero: {item.numero}</Text>
            <Text>Estado: {item.status}</Text>
            <Text>Pedido ID: {item.PedidoId}</Text>
          </View>
        )}
      />
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
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  tableItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
});

export default MesasInfo;
