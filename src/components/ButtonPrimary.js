import React from 'react';
import { StyleSheet, View, Text, Pressable } from "react-native";
import {
  responsiveHeight as rh,
  responsiveWidth as rw,
  responsiveFontSize as rf,
} from "react-native-responsive-dimensions";

export default function CustomButton({ title, onPress, disabled }) {
  return (
    <View style={[styles.buttonContainer, disabled ? styles.disabledButton : null]}>
      <Pressable style={styles.button} onPress={onPress} disabled={disabled}>
        <Text style={styles.label}>{title}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    backgroundColor: "#F1592A",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: rw(2),
    width: rw(80),
    height: rh(6),
    marginTop: rh(5),
    marginBottom: rh(2),
  },
  button: {
    width: "100%",
    height: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#FFFFFF",
    fontSize: rf(2),
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
});