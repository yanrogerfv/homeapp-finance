import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from 'react-native';

export const getSecureToken = async (key: string) => {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

export const setSecureToken = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export const removeSecureToken = async (key: string) => {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://home-finance-api-dwmz.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getSecureToken('user_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
