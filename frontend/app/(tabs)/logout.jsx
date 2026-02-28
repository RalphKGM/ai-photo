import { View, Text, Pressable, Alert } from 'react-native';
import { logout } from '../../service/auth/authService.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'photos_cache';

export default function Logout() {
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      Alert.alert('Logout failed', err.message);
    }
  };

  const handleDeleteCache = async () => {
    Alert.alert(
      'Delete Cache',
      'This will clear all locally cached photos. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(CACHE_KEY);
              Alert.alert('Cache cleared', 'Local photo cache has been deleted.');
            } catch (err) {
              Alert.alert('Error', 'Failed to clear cache.');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center items-center gap-4">
      <Text className="text-2xl font-semibold mb-2">Are you sure you want to logout?</Text>

      <Pressable
        className="bg-red-600 rounded-xl py-4 px-8 items-center w-full"
        onPress={handleLogout}
      >
        <Text className="text-white font-semibold">Logout</Text>
      </Pressable>

      <Pressable
        className="bg-gray-100 rounded-xl py-4 px-8 items-center w-full"
        onPress={handleDeleteCache}
      >
        <Text className="text-gray-700 font-semibold">Delete Cache</Text>
      </Pressable>
    </View>
  );
}