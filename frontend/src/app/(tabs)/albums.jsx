import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Modal,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePhotoContext } from '../../context/PhotoContext.jsx';
import { useThemeContext } from '../../context/ThemeContext.jsx';
import { getThemeColors } from '../../theme/appColors.js';
import AlbumDetail from '../../components/albums/AlbumDetail.jsx';
import AlbumCard from '../../components/albums/AlbumCard.jsx';
import PhotoItem from '../../components/PhotoItem.jsx';
import { addPhotosToAlbum, createAlbum, getAlbums } from '../../service/albumService.js';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CREATE_COLUMNS = 4;

export default function Albums() {
  const { photos, setPhotos } = usePhotoContext();
  const { isDarkMode } = useThemeContext();
  const colors = getThemeColors(isDarkMode);
  const [openAlbum, setOpenAlbum] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateAlbumVisible, setIsCreateAlbumVisible] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [currentAlbumPage, setCurrentAlbumPage] = useState(0);

  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  const photoMap = useMemo(() => {
    const map = new Map();
    for (const photo of photos) {
      if (photo?.id) map.set(photo.id, photo);
    }
    return map;
  }, [photos]);

  const hydrateAlbums = useCallback(
    (rawAlbums) =>
      (rawAlbums || []).map((album) => {
        const albumPhotos = (album.photo_ids || [])
          .map((photoId) => photoMap.get(photoId))
          .filter(Boolean);
        //console.log(album)
        const latestPhotoId = album.photo_ids?.[album.photo_ids.length - 1];
        const coverPhoto =
          (latestPhotoId && photoMap.get(latestPhotoId)) ||
          albumPhotos[albumPhotos.length - 1] ||
          null;

        return {
          ...album,
          photos: albumPhotos,
          coverPhoto,
        };
      }),
    [photoMap]
  );

  const loadAlbums = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);

        const result = await getAlbums();
        setAlbums(hydrateAlbums(result));
      } catch (error) {
        console.log('Load albums error:', error);
        setAlbums([]);
      } finally {
        if (refresh) setIsRefreshing(false);
        else setIsLoading(false);
      }
    },
    [hydrateAlbums]
  );

  useEffect(() => {
    loadAlbums();
  }, []);

  useEffect(() => {
    setAlbums((prev) => hydrateAlbums(prev));
  }, [photoMap, hydrateAlbums]);

  const albumPages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < albums.length; i += 4) {
      pages.push(albums.slice(i, i + 4));
    }
    return pages;
  }, [albums]);

  const renderAlbumPage = useCallback(
    ({ item: page }) => (
      <View className="w-screen px-4 pt-5 pb-3">
        <View className="flex-row justify-between mb-3">
          {page.slice(0, 2).map((album) => (
            <View key={album.id} className="w-[180px]">
              <AlbumCard album={album} onPress={handleOpenAlbum} isDarkMode={isDarkMode} />
            </View>
          ))}
          {page.length === 1 && <View className="w-[180px]" />}
        </View>
        <View className="flex-row justify-between">
          {page.slice(2, 4).map((album) => (
            <View key={album.id} className="w-[180px]">
              <AlbumCard album={album} onPress={handleOpenAlbum} isDarkMode={isDarkMode} />
            </View>
          ))}
          {page.length === 3 && <View className="w-[180px]" />}
        </View>
      </View>
    ),
    [handleOpenAlbum, isDarkMode]
  );

  const handleOpenAlbum = useCallback(
    (album) => {
      setOpenAlbum(album);
      slideAnim.setValue(SCREEN_WIDTH);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 200,
        mass: 0.9,
      }).start();
    },
    [slideAnim]
  );

  const handleCloseAlbum = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setOpenAlbum(null));
  }, [slideAnim]);

  const handleAlbumPhotosChange = useCallback((updatedPhotos, deletedPhotoIds = []) => {
    if (!openAlbum?.id) return;

    const deletedSet = new Set(deletedPhotoIds);
    if (deletedSet.size > 0) {
      setPhotos((prev) => prev.filter((photo) => !deletedSet.has(photo.id)));
    }

    const nextPhotoIds = updatedPhotos.map((photo) => photo.id);
    const nextCover = updatedPhotos[updatedPhotos.length - 1] ?? null;

    setAlbums((prev) =>
      prev.map((album) =>
        album.id === openAlbum.id
          ? {
              ...album,
              photos: updatedPhotos,
              photo_ids: nextPhotoIds,
              coverPhoto: nextCover,
              cover_photo_id: nextCover?.id ?? null,
            }
          : album
      )
    );

    setOpenAlbum((prev) =>
      prev && prev.id === openAlbum.id
        ? {
            ...prev,
            photos: updatedPhotos,
            photo_ids: nextPhotoIds,
            coverPhoto: nextCover,
            cover_photo_id: nextCover?.id ?? null,
          }
        : prev
    );
  }, [openAlbum, setPhotos]);

  const openCreateAlbum = useCallback(() => {
    setSelectedPhotoIds([]);
    setNewAlbumName('');
    setIsCreateAlbumVisible(true);
  }, []);

  const closeCreateAlbum = useCallback(() => {
    if (isCreatingAlbum) return;
    setIsCreateAlbumVisible(false);
  }, [isCreatingAlbum]);


  const toggleSelectedPhoto = useCallback((photoId) => {
    setSelectedPhotoIds((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId);
      }
      return [...prev, photoId];
    });
  }, []);


  const handleCreateAlbum = useCallback(async () => {
    const name = newAlbumName.trim();
    if (!name) {
      Alert.alert('Album name required', 'Please enter an album name.');
      return;
    }

    if (selectedPhotoIds.length === 0) {
      Alert.alert('Select photos', 'Please select at least one photo.');
      return;
    }

    try {
      setIsCreatingAlbum(true);
      const album = await createAlbum({
        name,
        coverPhotoId: selectedPhotoIds[selectedPhotoIds.length - 1],
      });
      await addPhotosToAlbum({ albumId: album.id, photoIds: selectedPhotoIds });
      setIsCreateAlbumVisible(false);
      setSelectedPhotoIds([]);
      setNewAlbumName('');
      await loadAlbums(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create album');
    } finally {
      setIsCreatingAlbum(false);
    }
  }, [newAlbumName, selectedPhotoIds, loadAlbums]);


  const renderCreatePhotoItem = useCallback(
    ({ item }) => (
      <PhotoItem
        localUri={item.uri ?? null}
        numColumns={CREATE_COLUMNS}
        onPress={() => toggleSelectedPhoto(item.id)}
        onLongPress={() => toggleSelectedPhoto(item.id)}
        item={item}
        isSelected={selectedPhotoIds.includes(item.id)}
        selectionMode
      />
    ),
    [toggleSelectedPhoto, selectedPhotoIds]
  );


  const totalPhotosInAlbums = albums.reduce((sum, album) => sum + album.photos.length, 0);

  return (
    <View className={`flex-1 ${colors.pageBg}`}>
      <View className={`pt-16 pb-6 px-4 border-b ${colors.headerBg} ${colors.border}`}>
        <View className="flex-row items-center justify-between">
          <Text className={`text-3xl font-extrabold tracking-tight ${colors.textPrimary}`}>Albums</Text>
          <Pressable onPress={openCreateAlbum} disabled={photos.length === 0}>
            <Ionicons name="add" size={30} color={photos.length === 0 ? '#9CA3AF' : colors.icon} />
          </Pressable>
        </View>
        {!isLoading && (
          <Text className={`text-xs mt-1 ${colors.count}`}>
            {albums.length} {albums.length === 1 ? 'album' : 'albums'} | {totalPhotosInAlbums}{' '}
            {totalPhotosInAlbums === 1 ? 'photo' : 'photos'}
          </Text>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.loading} />
        </View>
      ) : albums.length === 0 ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadAlbums(true)} />}
        >
          <View className="flex-1 items-center justify-center px-6 pt-32">
            <Ionicons name="albums-outline" size={64} color={colors.emptyIcon} />
            <Text className={`text-lg font-semibold mt-4 ${colors.textPrimary}`}>No albums yet</Text>
            <Text className={`text-sm text-center mt-2 ${colors.textSecondary}`}>
              Tap + to create an album from your photos
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View>
          <View className="h-[468px]">
            <FlatList
              data={albumPages}
              horizontal
              pagingEnabled
              keyExtractor={(_, index) => `page-${index}`}
              renderItem={renderAlbumPage}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              bounces={false}
              alwaysBounceVertical={false}
              overScrollMode="never"
              directionalLockEnabled
              onMomentumScrollEnd={(e) => {
                const pageIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setCurrentAlbumPage(pageIndex);
              }}
            />
          </View>
          {albumPages.length > 1 && (
            <View className="flex-row items-center justify-center gap-1.5 pb-2">
              {albumPages.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  className={`${colors.dotBg} w-1.5 h-1.5 rounded-full ${
                    index === currentAlbumPage ? 'opacity-100' : 'opacity-40'
                  }`}
                />
              ))}
            </View>
          )}
          <View className={`mx-4 h-px ${colors.line}`} />
        </View>
      )}

      {openAlbum && (
        <Animated.View
          className={`absolute inset-0 z-10 ${colors.pageBg}`}
          style={{ transform: [{ translateX: slideAnim }] }}
        >
          <AlbumDetail album={openAlbum} onBack={handleCloseAlbum} onPhotosChange={handleAlbumPhotosChange} />
        </Animated.View>
      )}

      <Modal
        visible={isCreateAlbumVisible}
        animationType="slide"
        onRequestClose={closeCreateAlbum}
      >
        <View className={`flex-1 ${colors.pageBg}`}>
          <View className={`pt-16 pb-4 px-4 border-b ${colors.headerBg} ${colors.border}`}>
            <View className="flex-row items-center justify-between">
              <Pressable onPress={closeCreateAlbum} disabled={isCreatingAlbum} className="py-1 pr-3">
                <Text className={`text-base ${colors.title}`}>Cancel</Text>
              </Pressable>
              <Text className={`text-lg font-semibold ${colors.title}`}>New Album</Text>
              <Pressable
                onPress={handleCreateAlbum}
                disabled={isCreatingAlbum}
                className={`py-1 pl-3 ${isCreatingAlbum ? 'opacity-40' : 'opacity-100'}`}
              >
                {isCreatingAlbum ? (
                  <ActivityIndicator size="small" color={colors.icon} />
                ) : (
                  <Text className="text-base font-semibold text-blue-500">Create</Text>
                )}
              </Pressable>
            </View>
            <TextInput
              value={newAlbumName}
              onChangeText={setNewAlbumName}
              placeholder="Album name"
              placeholderTextColor={colors.inputPlaceholder}
              className={`mt-3 rounded-xl px-4 py-3 ${colors.inputBg} ${colors.inputText}`}
              editable={!isCreatingAlbum}
              returnKeyType="done"
            />
            <Text className={`text-xs mt-2 ${colors.count}`}>
              {selectedPhotoIds.length} {selectedPhotoIds.length === 1 ? 'photo selected' : 'photos selected'}
            </Text>
          </View>

          <View className="px-1">
            <FlatList
              data={photos}
              numColumns={CREATE_COLUMNS}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={renderCreatePhotoItem}
              ListHeaderComponent={<View className="h-1" />}
              ListFooterComponent={<View className="h-[120px]" />}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}
