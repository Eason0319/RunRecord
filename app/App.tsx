import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import Dashboard from './Dashboard';
import StravaAuth from './StravaAuth';

WebBrowser.maybeCompleteAuthSession();

export type RootStackParamList = {
  StravaAuth: undefined;
  Dashboard: { accessToken: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="StravaAuth" component={StravaAuth} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}