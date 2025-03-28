import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom:100,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Negro con opacidad
    opacity: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color:'white',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color:'white',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
    color: 'white',
  },

  link: {
    color: '#1E90FF',
    marginTop: 20,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  background: {
    flex: 1,
    resizeMode: 'cover', // Ajusta la imagen para cubrir toda la pantalla
  },
  text:{
    marginTop: 20,
    color:'white'
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 20,
  },
  
});

export default styles;