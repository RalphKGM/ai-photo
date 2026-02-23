import { View, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';

const { width: windowWidth } = Dimensions.get('window');

export default function PhotoItem({ uri, numColumns, onPress }) {
  const totalHorizontalPadding = 2 * 2;
  const size = (windowWidth - totalHorizontalPadding) / numColumns - 4;

  return (
    <Pressable onPress={onPress}>
      <View className="m-0.5 overflow-hidden">
        <Image
          source={{ uri: uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
        />
      </View>
    </Pressable>
  );
}