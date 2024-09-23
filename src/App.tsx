import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './navigation/AppNavigator';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider>
      <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;