type RootStackParamList = {
    Login: undefined; // Ruta Login no necesita parámetros
    Home: undefined;  // Ruta Home no necesita parámetros
    Register: undefined;
    Settings: undefined;
  Profile: { userId: string };
  };