import { TextInput, Button } from 'react-native-paper'
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, PermissionsAndroid, Platform, BackHandler } from 'react-native';
import GetLocation from 'react-native-get-location';
import { SendDirectSms } from 'react-native-send-direct-sms';
import {
  responsiveHeight as rh,
  responsiveWidth as rw,
  responsiveFontSize as rf,
} from "react-native-responsive-dimensions";
import { Buffer } from 'buffer';
import { EMERGENCY_PHONE_NUMBER } from '@env';
import auth from '@react-native-firebase/auth'

const SOSRequestScreen: React.FC = () => {
  const [permissionGranter, setPermissionGranter] = useState(false)
  const [locaton, setLocation] = useState<any>(null)

  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);

  async function requestPermissions() {
    try {
      if (Platform.OS === 'android') {
        const locationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Please allow location access to use the app.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        const smsGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
          {
            title: 'SMS Permission',
            message: 'App needs SMS permission to send messages.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (locationGranted === PermissionsAndroid.RESULTS.GRANTED && smsGranted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Permissions granted');
          setPermissionGranter(true);
        } else {
          console.log('Permissions denied');
        }
      }
    } catch (err) {
      console.warn(err);
    }
  }

  function _getCurrentLocation() {
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 30000,
    })
      .then(location => {
        console.log('My current location =', location);
        _sendSOSMessage(location);
      })
      .catch(error => {
        const { code, message } = error;
        console.warn(code, message);
      });
  }

  function _sendSOSMessage(location: any) {
    const currentUser = auth().currentUser

    if (!currentUser || !currentUser.email){
      console.error('email unavailable')
      Alert.alert('Error', 'Unable to retrive user email')
      return
    }
    const messageData = {
      email: currentUser.email,
      timestamp: location.time.toString(),
      coordinates: `${location.latitude},${location.longitude}`
    };

    const jsonString = JSON.stringify(messageData);
    const base64Message = Buffer.from(jsonString).toString('base64');

    const formattedMessage = `Rakshak\n${base64Message}`
    console.log(formattedMessage)

    const phoneNumber = EMERGENCY_PHONE_NUMBER;
    console.log(phoneNumber)


    if (!phoneNumber) {
      console.error('Emergency phone number is not set in the environment variables.');
      Alert.alert('Error', 'Emergency contact number is not configured.');
      return;
    }

    SendDirectSms(phoneNumber, formattedMessage)
      .then(response => console.log("message sent", response))
      .catch(err => console.log("failed to send", err));
  }

  if (!permissionGranter)
    return (
      <View style={styles.container}>
        <Button mode='contained' onPress={_getCurrentLocation} style={styles.button} labelStyle={styles.label} >SOS</Button>
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  button: {
    backgroundColor: '#FF0000',
    borderRadius: rw(40),
    width: rw(80), 
    height: rw(80),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  content: {
    height: '100%',
  },
  label: {
    width: rw(50),
    height: rw(50),
    fontSize: rf(8),
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingTop: '18%'
  },
});


export default SOSRequestScreen;