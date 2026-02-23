import { Modal, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

export default function PhotoViewer({ visible, photo, onClose }) {
  return (
    <Modal 
      visible={visible} 
      transparent={false} 
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black justify-center items-center">
        {photo && (
          <Image
            source={{ uri: photo.thumbnail_data }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        )}

        <Pressable 
          onPress={onClose} 
          className="absolute top-14 right-6 z-50 p-2 bg-black/40 rounded-full"
        >
          <Ionicons name="close" size={32} color="white" />
        </Pressable>
      </View>
    </Modal>
  );
}