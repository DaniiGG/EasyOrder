import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
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
  Profile: { userId: string };
};



const MenuInfo = () => {
    
  

  return (
    
    <View>
      
    </View>
  );
};

const styles = StyleSheet.create({
 
});

export default MenuInfo;
