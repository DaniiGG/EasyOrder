import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, PanResponder, Animated, Alert, Text, Button, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message'; 

const MesasInfo = () => {
  const [tables, setTables] = useState<{ id: string; position: { x: number, y: number }, numero: string, status: string; PedidoId: string }[]>([]);
  const [tablePositions, setTablePositions] = useState<{ [key: string]: Animated.ValueXY }>({});
  const [containerLayout, setContainerLayout] = useState(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

        setTables(tablesData as { id: string; position: { x: number, y: number }, numero: string, status: string; PedidoId: string }[]);

        // Initialize positions for each table using saved coordinates
        const initialPositions = tablesData.reduce((acc, table) => {
          const position = (table as { position?: { x: number, y: number } }).position || { x: 0, y: 0 };
          acc[table.id] = new Animated.ValueXY({
            x: position?.x || 0, // Use saved x or default
            y: position?.y || 0, // Use saved y or default
          });
          return acc;
        }, {} as { [key: string]: Animated.ValueXY });

        setTablePositions(initialPositions);
      } catch (error) {
        console.error('Error fetching tables:', error);
        Alert.alert('Error', 'No se pudieron obtener las mesas.');
      }
    };

    fetchTables();
  }, []);

  const addTable = () => {
    const offset = -70; // Distancia entre mesas
    const newIndex = tables.length;
    const newTable = {
      id: `table-${Date.now()}`,
      numero: `${tables.length + 1}`,
      position: { x: 0 * newIndex, y: offset * newIndex },
      status: 'Libre',
      PedidoId: '',
    };
    setTables([...tables, newTable]);
    setTablePositions({
      ...tablePositions,
      [newTable.id]: new Animated.ValueXY({ x: 0 * newIndex, y: offset * newIndex }),
    });
  };

  const removeTable = (tableId: string) => {
    setTables(tables.filter(table => table.id !== tableId));
    const updatedPositions = { ...tablePositions };
    delete updatedPositions[tableId];
    setTablePositions(updatedPositions);
  };

  const panResponders = Object.keys(tablePositions).reduce((acc, tableId) => {
    (acc as { [key: string]: any })[tableId] = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        tablePositions[tableId].setOffset({
          x: tablePositions[tableId].x._value,
          y: tablePositions[tableId].y._value,
        });
        tablePositions[tableId].setValue({ x: 0, y: 0 }); // Reset value for clean gesture
      },
      onPanResponderMove: (e, gestureState) => {
        // Remove boundary checks to allow free movement
        tablePositions[tableId].setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: () => {
        tablePositions[tableId].flattenOffset(); 
      },
    });
    return acc;
  }, {});
  

  const saveTablePositions = async () => {
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

      const batchUpdate = firestore().batch();
      const batchDelete = firestore().batch();

      tables.forEach(table => {
        const tableRef = firestore()
          .collection('restaurants')
          .doc(restaurantId)
          .collection('tables')
          .doc(table.id);

        const position = tablePositions[table.id];
        const x = position.x._value;
        const y = position.y._value;

        batchUpdate.set(tableRef, {
          position: { x, y },
          status: table.status,
          PedidoId: table.PedidoId,
          numero: table.numero,
        });
      });

      // Handle deletions
      const existingTablesSnapshot = await firestore()
        .collection('restaurants')
        .doc(restaurantId)
        .collection('tables')
        .get();

      existingTablesSnapshot.docs.forEach(doc => {
        if (!tables.some(table => table.id === doc.id)) {
          batchDelete.delete(doc.ref);
        }
      });

      await batchUpdate.commit();
      await batchDelete.commit();
      Toast.show({
                type: 'success',
                text1: 'Éxito',
                text2: 'Cambios guardados correctamente.',
              });
    } catch (error) {
      console.error('Error saving table positions:', error);
      Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudieron guardar los cambios.',
              });
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: "Organización Personalizada" ,
      headerRight: () => (
      <TouchableOpacity onPress={addTable} style={styles.addButton}>
      <Image
          source={require('../assets/iconoAdd.png')}
          style={{ width: 30, height: 30, borderRadius: 5 }}
        />
    </TouchableOpacity>
      ),
   
    })

  })

  return (
    <View style={styles.container}>
      

      <View
        style={styles.tableZone}
        onLayout={(event) => setContainerLayout(event.nativeEvent.layout as any)}
      >
        {Object.keys(tablePositions).map(tableId => {
          const table = tables.find(t => t.id === tableId);
          return (
            <Animated.View
              key={tableId}
              style={[styles.tableImage, tablePositions[tableId].getLayout()]}
              {...(panResponders as { [key: string]: any })[tableId].panHandlers}
            >
              <View style={styles.tableContainer}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeTable(tableId)}
                >
                  <Text style={styles.removeButtonText}>-</Text>
                </TouchableOpacity>
                <Image
                  source={require(`../assets/iconoMesa.png`)}
                  style={styles.tableImage}
                />
                <Text style={styles.tableLabel}>Mesa {table?.numero}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.saveButton}>
        <Button title="Guardar Posiciones" onPress={saveTablePositions} />
      </View>
      <Toast/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  tableContainer: {
    alignItems: 'center',
  },
  tableImage: {
    width: 70,
    height: 70,
  },
  tableLabel: {
    textAlign: 'center',
    marginTop: -10,
    color: 'black',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: 'black',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  tableZone: {
    width: '100%',
    height: 650,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    backgroundColor: '#FF0000',
    borderRadius: 15,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -7,
  },
  addButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
});

export default MesasInfo;
