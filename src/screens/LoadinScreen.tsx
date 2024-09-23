import React from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";

const Loading = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator style={styles.loading} size="large" color="red" />
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
