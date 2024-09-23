import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper'
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore'
import { PhoneNumberInput, getCountryByCode } from 'react-native-paper-phone-number-input';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('');

    try {
      if (isSignUp) {
        //Create user account
        const userCredential = await auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        //user data
        const userData: User = {
          email,
          name: userName,
          blood_group: bloodGroup,
          emergency_contacts: emergencyContacts.map(contact => `${contact.countryCode} ${contact.phoneNumber}`),
        };
        console.log('User data:', userData);

        // Storing user data in Firestore
        await firestore().collection('users').doc(user.uid).set(userData);

        //Storing the user token
        await AsyncStorage.setItem('userToken', user.uid)

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
          await AsyncStorage.setItem('isLoggedIn', 'true')
          console.log(AsyncStorage.setItem)

          // Navigate to the next screen after successful login
        } else {
          setError('User data not found. Please try again.');
        }
      }
      navigation.navigate('SOSRequest')
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
    setEmergencyContacts([...emergencyContacts, { countryCode: 'IN', phoneNumber: '' }]);
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
    <View style={styles.container}>
      {isSignUp && (
        <>
          <TextInput
            placeholder="Name"
            value={userName}
            onChangeText={setUserName}
            style={styles.input}
          />
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={bloodGroup}
              onValueChange={(itemValue) => setBloodGroup(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Blood Group" value="" />
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                <Picker.Item key={group} label={group} value={group} />
              ))}
            </Picker>
          </View>
        </>
      )}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      {isSignUp &&
        emergencyContacts.map((contact, index) => (
          <View key={index} style={styles.phoneInput}>
            <PhoneNumberInput
              code={contact.countryCode}
              setCode={updateEmergencyContact(index, 'countryCode')} phoneNumber={contact.phoneNumber || ''}
              setPhoneNumber={updateEmergencyContact(index, 'phoneNumber')}
              includeCountries={includeCountries}
              label={'Emergency contact'}
            />
          </View>
        ))}

      {isSignUp && (
        <Button onPress={addEmergencyContact} style={styles.button}>
          Add Emergency Contact
        </Button>
      )}

      <Button onPress={handleSubmit} style={styles.button}>{isSignUp ? "Register" : "Log In"}</Button>

      <Button onPress={() => setIsSignUp(!isSignUp)} style={styles.button}>{`Switch to ${isSignUp ? "Log In" : "Register"}`}</Button>
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    marginBottom: 10,
    borderWidth: 1,
    padding: 10,
  },
  phoneInput: {
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#000000',
    borderColor: '#ccc',
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  button: {
    marginTop: 10,
  },
});

export default AuthScreen;