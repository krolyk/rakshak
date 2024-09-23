import React, { useState, useEffect} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from '../screens/AuthScreen'
import SOSRequestScreen from '../screens/SOSrequestScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loading from '../screens/LoadinScreen';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null)
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        if (isLoggedIn === 'true'){
          setInitialRoute('SOSRequest')
        } else {
          setInitialRoute('Auth')
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setInitialRoute('Auth');
      }
    };

    checkLoginStatus();
  }, []);

  if (!initialRoute) {
    return <Loading />;
  }

  console.log('Initial Route:', initialRoute);

    return(
        <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SOSRequest" 
          component={SOSRequestScreen} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    )
}

export default AppNavigator;