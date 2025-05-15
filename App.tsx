import { useFonts } from 'expo-font';
// import 'react-native-reanimated';

import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, Text, View } from 'react-native';
import TicTacToeScreen from './screens/tictactoe';


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return <Text style={{color: 'red'}}>Loading...</Text>;
  }else{
    SplashScreen.hideAsync();
  }

  return (
    <View style={styles.container}>
    <TicTacToeScreen/>
    </View>
    
  );
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
  }); 