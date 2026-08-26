import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';

export default function App() {
  return (
    <View style={styles.root}>
      <HomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
    minHeight: Platform.OS === 'web' ? ('100vh' as unknown as number) : '100%',
  },
});
