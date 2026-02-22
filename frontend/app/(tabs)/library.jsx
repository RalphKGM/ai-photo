import { useState, useEffect, useRef } from 'react';
import { View, FlatList, Text, Pressable, TextInput, Animated, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import FloatingMenu from '../../components/FloatingMenu';
import PhotoItem from '../../components/PhotoItem';
import { getPhotos } from 'service/photoService';

const numColumns = 4;

export default function Library() {
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({ mediaTypes: 'photo' });
  const [photos, setPhotos] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const menuAnim = useRef(new Animated.Value(0)).current;
  const searchWidth = useRef(new Animated.Value(0)).current;

  const handleGetPhotos = async () => {
    if (permissionResponse?.status !== 'granted') {
      const { status } = await requestPermission();
      if (status !== 'granted') return;
    }

    const assets = await getPhotos();
    setPhotos(assets);
  }

  useEffect(() => { handleGetPhotos(); }, []);

  const toggleMenu = () => {
    const toValue = menuVisible ? 0 : 1;
    if (!menuVisible) setMenuVisible(true);

    Animated.spring(menuAnim, {
      toValue: toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start(() => { 
      if (toValue === 0) 
        setMenuVisible(false); 
    });
  };

  const toggleSearch = () => {
    const toValue = isSearching ? 0 : 1;
    if (!isSearching) setIsSearching(true);

    Animated.timing(searchWidth, { 
      toValue: toValue, 
      duration: 250, 
      useNativeDriver: false 
    }).start(() => {
      if (toValue === 0) { 
        setIsSearching(false); 
        setSearchQuery(''); 
        Keyboard.dismiss(); 
      }
    });
  };

  return (
    <View className="flex-1 bg-white">
      {/* header */}
      <View className="flex-row items-center justify-between px-4 pt-16 pb-5 bg-[#F5F5F7]">
        {!isSearching ? <Text className="text-3xl font-bold">Photos</Text> : (
          <Animated.View
            style={{
              width: searchWidth.interpolate({ 
                inputRange: [0, 1], outputRange: ['0%', '75%'] 
              }),
            }}
          >
            <TextInput
              placeholder="Search photos..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              className="bg-gray-200 rounded-xl px-4 py-2"
            />
          </Animated.View>
        )}

        {!isSearching ? (
          <Pressable onPress={toggleSearch}>
            <Ionicons name="search" size={28} color="#000" />
          </Pressable>
        ) : (
          <Pressable onPress={toggleSearch} className="ml-3">
            <Text className="text-black text-lg">Cancel</Text>
          </Pressable>
        )}
      </View>

      {/* photo grid */}
      <FlatList
        data={photos}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 2.5 }}
        renderItem={({ item }) => <PhotoItem uri={item.thumbnail_data} numColumns={numColumns} />}
      />

      {/* + button */}
      <FloatingMenu 
        menuVisible={menuVisible} 
        toggleMenu={toggleMenu} 
        menuAnim={menuAnim} 
        refreshPhotos={handleGetPhotos}
      />
    </View>
  );
}