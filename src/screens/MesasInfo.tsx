import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, PanResponder, Animated, Alert, Text, TextInput, Button } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

const MesasInfo = () => {
  const [tables, setTables] = useState<{ id: string; position:[x:number, y:number], numero: string, status: string; PedidoId: string }[]>([]);
  const [tablePositions, setTablePositions] = useState<{ [key: string]: Animated.ValueXY }>({});
  const [numeroDeMesas, setNumeroDeMesas] = useState(0);
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

        setTables(tablesData as { id: string; position:[x:number, y:number], numero: string, status: string; PedidoId: string }[]);

        // Initialize positions for each table using saved coordinates
        const initialPositions = tablesData.reduce((acc, table) => {
          const position = (table as { position?: { x: number, y: number } }).position || { x: 50, y: 100 };
          acc[table.id] = new Animated.ValueXY({
            x: position?.x || 50, // Use saved x or default
            y: position?.y || 100, // Use saved y or default
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
        if (!containerLayout) return;

        const offsetX = tablePositions[tableId].x._offset ?? 0;
        const offsetY = tablePositions[tableId].y._offset ?? 0;
        
        const newX = offsetX + gestureState.dx;
        const newY = offsetY + gestureState.dy;
        
        const TABLE_WIDTH = 100;
        const TABLE_HEIGHT = 100;
        
        const withinBoundsX = newX >= 0 && (newX + TABLE_WIDTH) <= containerLayout.width;
        const withinBoundsY = newY >= 0 && (newY + TABLE_HEIGHT) <= containerLayout.height;
        
        if (withinBoundsX && withinBoundsY) {
          tablePositions[tableId].setValue({ x: gestureState.dx, y: gestureState.dy });
        }
      },/*
      onPanResponderMove: Animated.event(
        [null, { dx: tablePositions[tableId].x, dy: tablePositions[tableId].y }],
        { useNativeDriver: false }
      ),*/
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
      tables.forEach(table => {
        const tableRef = firestore()
          .collection('restaurants')
          .doc(restaurantId)
          .collection('tables')
          .doc(table.id);

        const position = tablePositions[table.id];
        const x = position.x._value;
        const y = position.y._value;

        batchUpdate.update(tableRef, {
          position: { x, y },
        });
      });

      await batchUpdate.commit();
      Alert.alert('Éxito', 'Posiciones de las mesas guardadas correctamente.');
    } catch (error) {
      console.error('Error saving table positions:', error);
      Alert.alert('Error', 'No se pudieron guardar las posiciones de las mesas.');
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: "Mesas" ,
   
    })

  })

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
  saveButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  tableZone: {
    width: '100%',
    height: 500,
    backgroundColor: '#f0f0f0',
    position: 'relative',
    marginVertical: 20,
  },
});

export default MesasInfo;
