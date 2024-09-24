import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import AppNavigator from './navigation/AppNavigator';
import { Appearance } from 'react-native';

const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4a306dff',
    background: '#ffffff',
    text: '#000000',
  },
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={lightTheme}>
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;