import { useState, useEffect, useCallback, memo } from 'react';
import { View, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { getPhotoLocalURI } from 'service/photoService';

const { width: windowWidth } = Dimensions.get('window');

function PhotoItem({ photoId, localUri, numColumns, onPress, item }) {
  const [resolvedUri, setResolvedUri] = useState(localUri ?? null);
  const size = (windowWidth - 4) / numColumns - 4;

  //resolve URI when photoid or localuri changes
  //if local uri exist, set it. Otherwise call getPhotoLocalURI
  useEffect(() => {
    if (localUri) {
      setResolvedUri(localUri);
      return;
    }

    let isMounted = true;

    const handleGetPhotoURI = async () => {
      try {
        const result = await getPhotoLocalURI(photoId);
        if (isMounted) {
          setResolvedUri(result);
        }
      } catch (error) {
        console.error("Error fetching local URI:", error);
      }
    };

    handleGetPhotoURI();
    return () => { isMounted = false; };
  }, [photoId, localUri]);

  const handlePress = useCallback(() => {
    onPress({ item, uri: resolvedUri });
  }, [onPress, item, resolvedUri]);

  return (
    <Pressable onPress={handlePress}>
      <View className="m-0.5 overflow-hidden bg-gray-200" style={{ width: size, height: size }}>
        {resolvedUri && (
          <Image
            source={{ uri: resolvedUri }}
            style={{ width: size, height: size }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        )}
      </View>
    </Pressable>
  );
};

export default memo(PhotoItem);