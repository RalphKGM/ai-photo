import { View, Dimensions } from 'react-native';
import { Image } from 'expo-image';

const { width: windowWidth } = Dimensions.get('window');

export default function PhotoItem({ uri, numColumns }) {
  const totalHorizontalPadding = 2 * 2;
  const size = (windowWidth - totalHorizontalPadding) / numColumns - 4;

  return (
    <View className="m-0.5 overflow-hidden">
      <Image
        source={{ uri: uri }}
        style={{ width: size, height: size }}
        contentFit="cover"
      />
    </View>
  );
}