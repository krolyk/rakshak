import { TextInput, Button, Text } from 'react-native-paper'
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, PermissionsAndroid, Platform, BackHandler, Animated, Easing, TouchableOpacity } from 'react-native';
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
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [radarAnimations] = useState([...Array(3)].map(() => new Animated.Value(0)));

  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    requestPermissions();
    startPulseAnimation();
    startRadarAnimation();

    return () => backHandler.remove();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startRadarAnimation = () => {
    const animations = radarAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.ease,
        delay: index * 666,
        useNativeDriver: true,
      })
    );

    Animated.loop(Animated.stagger(666, animations)).start();
  };

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
          setPermissionGranted(true);
        } else {
          console.log('Permissions denied');
        }
      }
    } catch (err) {
      console.warn(err);
    }
  }

  function _getCurrentLocation() {
    setIsLoading(true);
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
      })
      .finally(() => setIsLoading(false));
  }

  function _sendSOSMessage(location: any) {
    const currentUser = auth().currentUser

    if (!currentUser || !currentUser.email) {
      console.error('email unavailable')
      Alert.alert('Error', 'Unable to retrieve user email')
      return
    }
    const messageData = {
      email: currentUser.email,
      timestamp: location.time.toString(),
      coordinates: `${location.latitude},${location.longitude}`
    };

    const jsonString = JSON.stringify(messageData);
    const base64Message = Buffer.from(jsonString).toString('base64');

    const formattedMessage = `Rakshak\nhttps://www.google.com/maps/place/${location.latitude}+${location.longitude}`
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

  const handleSOSPress = () => {
    if (!permissionGranted) {
      Alert.alert(
        'Permissions Required',
        'Location and SMS permissions are required to use the SOS feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permissions', onPress: requestPermissions },
        ]
      );
    } else {
      _getCurrentLocation();
    }
  };

  const animatedStyle = {
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.1],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        {radarAnimations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.radarCircle,
              {
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 4],
                    }),
                  },
                ],
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 0],
                }),
              },
            ]}
          />
        ))}
        <Animated.View style={[styles.buttonWrapper, animatedStyle]}>
          <TouchableOpacity
            onPress={handleSOSPress}
            style={styles.button}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Sending' : 'SOS'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
  },
  buttonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: rw(70),
    height: rw(70),
  },
  buttonWrapper: {
    borderRadius: rw(35),
    padding: rw(3),
    backgroundColor: 'rgba(232, 33, 103, 0.1)',
  },
  button: {
    backgroundColor: '#E82167',
    borderRadius: rw(32),
    width: rw(64),
    height: rw(64),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  buttonText: {
    fontSize: rf(3.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  radarCircle: {
    position: 'absolute',
    width: rw(64),
    height: rw(64),
    borderRadius: rw(32),
    borderWidth: 2,
    borderColor: 'rgba(232, 33, 103, 0.5)',
  },
});

export default SOSRequestScreen;