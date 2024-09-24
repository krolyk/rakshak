import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PhoneNumberInput, getCountryByCode } from 'react-native-paper-phone-number-input';
import { Picker } from '@react-native-picker/picker';

interface User {
  email: string;
  name: string;
  blood_group: string;
  emergency_contacts: string[];
}

interface AuthScreenProps {
  navigation: any;
}

const includeCountries = ['AZ', 'BD', 'CA', 'GB', 'IN', 'NZ', 'US', 'TR'];

const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [emergencyContacts, setEmergencyContacts] = useState<{ countryCode: string; phoneNumber: string }[]>([
    { countryCode: 'IN', phoneNumber: '' }
  ]);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    try {
      if (isSignUp) {
        // Create user account
        const userCredential = await auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // User data
        const userData: User = {
          email,
          name: userName,
          blood_group: bloodGroup,
          emergency_contacts: emergencyContacts.map(contact => `${contact.countryCode} ${contact.phoneNumber}`),
        };
        console.log('User data:', userData);

        // Storing user data in Firestore
        await firestore().collection('users').doc(user.uid).set(userData);

        // Storing the user token
        await AsyncStorage.setItem('userToken', user.uid);

        console.log('User account created & signed in!');
      } else {
        // Log in user (Login)
        const userCredential = await auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Retrieve user data from Firestore
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log('User logged in:', userData);
          await AsyncStorage.setItem('isLoggedIn', 'true');
          console.log(AsyncStorage.setItem);
        } else {
          setError('User data not found. Please try again.');
        }
      }
      navigation.navigate('SOSRequest');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else if (typeof error === 'object' && error !== null && 'code' in error) {
        setError('That email address is invalid!');
      } else {
        const firebaseError = error as FirebaseAuthTypes.NativeFirebaseAuthError;
        switch (firebaseError.code) {
          case 'auth/email-already-in-use':
            setError('That email address is already in use!');
            break;
          case 'auth/invalid-email':
            setError('That email address is invalid!');
            break;
          default:
            setError('An error occurred during sign up. Please try again.');
        }
      }
      console.error(error);
    }
  };
  const addEmergencyContact = () => {
    if (emergencyContacts.length < 3) {
      setEmergencyContacts([...emergencyContacts, { countryCode: 'IN', phoneNumber: '' }]);
    }
  };

  const removeEmergencyContact = (index: number) => {
    setEmergencyContacts(prevContacts => prevContacts.filter((_, i) => i !== index));
  };

  const updateEmergencyContact = (index: number, field: 'phoneNumber' | 'countryCode') =>
    (value: React.SetStateAction<string> | React.SetStateAction<string | undefined>) => {
      setEmergencyContacts(prevContacts => {
        const updatedContacts = [...prevContacts];
        updatedContacts[index] = {
          ...updatedContacts[index],
          [field]: typeof value === 'function' ? value(updatedContacts[index][field]) : value
        };
        return updatedContacts;
      });
    };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{isSignUp ? 'Sign Up' : 'Log In'}</Text>

      {isSignUp && (
        <>
          <TextInput
            label="Name"
            value={userName}
            onChangeText={setUserName}
            style={styles.input}
            mode="outlined"
            theme={{ colors: { primary: '#a167a5ff' } }}
          />

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={bloodGroup}
              onValueChange={(itemValue) => setBloodGroup(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Blood Group" value="" color='#4a306dff' />
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                <Picker.Item key={group} label={group} value={group} />
              ))}
            </Picker>
          </View>
        </>
      )}

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
        theme={{ colors: { primary: '#a167a5ff' } }}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
        theme={{ colors: { primary: '#a167a5ff' } }}
      />

      {isSignUp && (
        <>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          {emergencyContacts.map((contact, index) => (
            <View key={index} style={styles.phoneInputContainer}>
              <View style={styles.phoneInput}>
                <PhoneNumberInput
                  code={contact.countryCode}
                  setCode={updateEmergencyContact(index, 'countryCode')}
                  phoneNumber={contact.phoneNumber || ''}
                  setPhoneNumber={updateEmergencyContact(index, 'phoneNumber')}
                  includeCountries={includeCountries}
                  label={`Emergency contact ${index + 1}`}
                />
              </View>
              {index > 0 && (
                <Text style={styles.removeButton} onPress={() => removeEmergencyContact(index)}>
                  ➖
                </Text>
              )}
            </View>
          ))}
          {emergencyContacts.length < 3 && (
            <Button
              onPress={addEmergencyContact}
              style={styles.addButton}
              mode="outlined"
              theme={{ colors: { primary: '#a167a5ff' } }}
            >
              ➕ Add another
            </Button>
          )}
        </>
      )}

      <Button
        onPress={handleSubmit}
        style={styles.submitButton}
        mode="contained"
        theme={{ colors: { primary: '#a167a5ff' } }}
      >
        {isSignUp ? "Register" : "Log In"}
      </Button>

      <Button
        onPress={() => setIsSignUp(!isSignUp)}
        style={styles.switchButton}
        mode="text"
        theme={{ colors: { primary: '#a167a5ff' } }}
      >
        {`Switch to ${isSignUp ? "Log In" : "Register"}`}
      </Button>

      {error !== '' && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#e8d7f1ff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#4a306dff',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  phoneInput: {
    flexGrow: 1,  // Allow it to take as much space as possible
    minWidth: 200, // Minimum width to prevent shrinking too much
    backgroundColor: '#ffffff', // Maintain consistent background
    paddingHorizontal: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#a167a5ff',
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    color: '#4a306dff',
  },
  removeButton: {
    marginLeft: 10,
    fontSize: 24,
  },
  addButton: {
    marginBottom: 15,
  },
  submitButton: {
    marginTop: 10,
  },
  switchButton: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default AuthScreen;