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
import {
  addPhotosToAlbum,
  createAlbum,
  deleteAlbum,
  getAlbums,
  removePhotosFromAlbum,
  renameAlbum,
} from '../../service/albumService.js';

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
  const [isAddPhotosVisible, setIsAddPhotosVisible] = useState(false);
  const [selectedAddPhotoIds, setSelectedAddPhotoIds] = useState([]);
  const [isAddingPhotos, setIsAddingPhotos] = useState(false);
  const [isAlbumMenuVisible, setIsAlbumMenuVisible] = useState(false);
  const [isRenameVisible, setIsRenameVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isRenamingAlbum, setIsRenamingAlbum] = useState(false);
  const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);

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

  useEffect(() => {
    if (!openAlbum?.id) {
      setIsAddPhotosVisible(false);
      setSelectedAddPhotoIds([]);
      setIsAlbumMenuVisible(false);
      setIsRenameVisible(false);
    }
  }, [openAlbum?.id]);

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

  const openAddPhotos = useCallback(() => {
    if (!openAlbum?.id) return;
    setSelectedAddPhotoIds([]);
    setIsAddPhotosVisible(true);
  }, [openAlbum?.id]);

  const closeAddPhotos = useCallback(() => {
    if (isAddingPhotos) return;
    setIsAddPhotosVisible(false);
  }, [isAddingPhotos]);

  const openAlbumMenu = useCallback(() => {
    if (!openAlbum?.id) return;
    setIsAlbumMenuVisible(true);
  }, [openAlbum?.id]);

  const closeAlbumMenu = useCallback(() => {
    if (isRenamingAlbum || isDeletingAlbum) return;
    setIsAlbumMenuVisible(false);
  }, [isRenamingAlbum, isDeletingAlbum]);

  const openRenameModal = useCallback(() => {
    if (!openAlbum?.id) return;
    setRenameValue(openAlbum.name || '');
    setIsAlbumMenuVisible(false);
    setIsRenameVisible(true);
  }, [openAlbum]);

  const closeRenameModal = useCallback(() => {
    if (isRenamingAlbum) return;
    setIsRenameVisible(false);
  }, [isRenamingAlbum]);


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

  const availablePhotos = useMemo(() => {
    if (!openAlbum?.id) return [];
    const existingIds = new Set(openAlbum.photo_ids || openAlbum.photos?.map((p) => p.id) || []);
    return photos.filter((photo) => photo?.id && !existingIds.has(photo.id));
  }, [openAlbum, photos]);

  const toggleSelectedAddPhoto = useCallback((photoId) => {
    setSelectedAddPhotoIds((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId);
      }
      return [...prev, photoId];
    });
  }, []);

  const handleAddPhotos = useCallback(async () => {
    if (!openAlbum?.id) return;
    if (selectedAddPhotoIds.length === 0) {
      Alert.alert('Select photos', 'Please select at least one photo.');
      return;
    }

    try {
      setIsAddingPhotos(true);
      await addPhotosToAlbum({ albumId: openAlbum.id, photoIds: selectedAddPhotoIds });
      const addedPhotos = selectedAddPhotoIds.map((id) => photoMap.get(id)).filter(Boolean);
      const updatedPhotos = [...(openAlbum.photos || []), ...addedPhotos];
      handleAlbumPhotosChange(updatedPhotos, []);
      setIsAddPhotosVisible(false);
      setSelectedAddPhotoIds([]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add photos');
    } finally {
      setIsAddingPhotos(false);
    }
  }, [openAlbum, selectedAddPhotoIds, photoMap, handleAlbumPhotosChange]);

  const handleRemoveFromAlbum = useCallback(async (photoIds) => {
    if (!openAlbum?.id) return;
    const idsToRemove = (photoIds || []).filter(Boolean);
    if (idsToRemove.length === 0) return;

    await removePhotosFromAlbum({ albumId: openAlbum.id, photoIds: idsToRemove });

    const removedSet = new Set(idsToRemove);
    const updatedPhotos = (openAlbum.photos || []).filter((photo) => !removedSet.has(photo.id));
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
  }, [openAlbum]);

  const handleRenameAlbum = useCallback(async () => {
    if (!openAlbum?.id) return;
    const name = renameValue.trim();
    if (!name) {
      Alert.alert('Album name required', 'Please enter an album name.');
      return;
    }

    try {
      setIsRenamingAlbum(true);
      const updated = await renameAlbum({ albumId: openAlbum.id, name });

      setAlbums((prev) =>
        prev.map((album) =>
          album.id === openAlbum.id
            ? {
                ...album,
                name: updated.name,
              }
            : album
        )
      );

      setOpenAlbum((prev) =>
        prev && prev.id === openAlbum.id
          ? {
              ...prev,
              name: updated.name,
            }
          : prev
      );

      setIsRenameVisible(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to rename album');
    } finally {
      setIsRenamingAlbum(false);
    }
  }, [openAlbum, renameValue]);

  const handleDeleteAlbum = useCallback(() => {
    if (!openAlbum?.id) return;

    Alert.alert(
      'Delete album',
      'Delete this album? Photos will remain in your library.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingAlbum(true);
              await deleteAlbum({ albumId: openAlbum.id });
              setAlbums((prev) => prev.filter((album) => album.id !== openAlbum.id));
              setOpenAlbum(null);
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete album');
            } finally {
              setIsDeletingAlbum(false);
              setIsAlbumMenuVisible(false);
            }
          },
        },
      ]
    );
  }, [openAlbum]);

  const renderAddPhotoItem = useCallback(
    ({ item }) => (
      <PhotoItem
        localUri={item.uri ?? null}
        numColumns={CREATE_COLUMNS}
        onPress={() => toggleSelectedAddPhoto(item.id)}
        onLongPress={() => toggleSelectedAddPhoto(item.id)}
        item={item}
        isSelected={selectedAddPhotoIds.includes(item.id)}
        selectionMode
      />
    ),
    [toggleSelectedAddPhoto, selectedAddPhotoIds]
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
          <AlbumDetail
            album={openAlbum}
            onBack={handleCloseAlbum}
            onPhotosChange={handleAlbumPhotosChange}
            onAddPhotos={openAddPhotos}
            canAddPhotos={availablePhotos.length > 0}
            onRemovePhotos={handleRemoveFromAlbum}
            onOpenMenu={openAlbumMenu}
          />
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

      <Modal
        visible={isAddPhotosVisible}
        animationType="slide"
        onRequestClose={closeAddPhotos}
      >
        <View className={`flex-1 ${colors.pageBg}`}>
          <View className={`pt-16 pb-4 px-4 border-b ${colors.headerBg} ${colors.border}`}>
            <View className="flex-row items-center justify-between">
              <Pressable onPress={closeAddPhotos} disabled={isAddingPhotos} className="py-1 pr-3">
                <Text className={`text-base ${colors.title}`}>Cancel</Text>
              </Pressable>
              <Text className={`text-lg font-semibold ${colors.title}`}>Add Photos</Text>
              <Pressable
                onPress={handleAddPhotos}
                disabled={isAddingPhotos}
                className={`py-1 pl-3 ${isAddingPhotos ? 'opacity-40' : 'opacity-100'}`}
              >
                {isAddingPhotos ? (
                  <ActivityIndicator size="small" color={colors.icon} />
                ) : (
                  <Text className="text-base font-semibold text-blue-500">Add</Text>
                )}
              </Pressable>
            </View>
            <Text className={`text-xs mt-2 ${colors.count}`}>
              {selectedAddPhotoIds.length}{' '}
              {selectedAddPhotoIds.length === 1 ? 'photo selected' : 'photos selected'}
            </Text>
          </View>

          <View className="px-1">
            <FlatList
              data={availablePhotos}
              numColumns={CREATE_COLUMNS}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={renderAddPhotoItem}
              ListHeaderComponent={<View className="h-1" />}
              ListFooterComponent={<View className="h-[120px]" />}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center px-6 pt-24">
                  <Ionicons name="images-outline" size={50} color={colors.emptyIcon} />
                  <Text className={`text-base font-semibold mt-4 ${colors.textPrimary}`}>
                    No photos to add
                  </Text>
                  <Text className={`text-sm text-center mt-2 ${colors.textSecondary}`}>
                    All your photos are already in this album.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal visible={isAlbumMenuVisible} transparent animationType="fade" onRequestClose={closeAlbumMenu}>
        <Pressable className="flex-1 bg-black/40" onPress={closeAlbumMenu}>
          <View className="flex-1 justify-end">
            <View className={`mx-4 mb-8 rounded-2xl ${colors.cardBg}`}>
              <Pressable onPress={openRenameModal} className="px-4 py-4 border-b border-black/10">
                <Text className={`text-base ${colors.textPrimary}`}>Rename album</Text>
              </Pressable>
              <Pressable onPress={handleDeleteAlbum} className="px-4 py-4">
                <Text className="text-base text-red-500">Delete album</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={isRenameVisible} animationType="slide" onRequestClose={closeRenameModal}>
        <View className={`flex-1 ${colors.pageBg}`}>
          <View className={`pt-16 pb-4 px-4 border-b ${colors.headerBg} ${colors.border}`}>
            <View className="flex-row items-center justify-between">
              <Pressable onPress={closeRenameModal} disabled={isRenamingAlbum} className="py-1 pr-3">
                <Text className={`text-base ${colors.title}`}>Cancel</Text>
              </Pressable>
              <Text className={`text-lg font-semibold ${colors.title}`}>Rename Album</Text>
              <Pressable
                onPress={handleRenameAlbum}
                disabled={isRenamingAlbum}
                className={`py-1 pl-3 ${isRenamingAlbum ? 'opacity-40' : 'opacity-100'}`}
              >
                {isRenamingAlbum ? (
                  <ActivityIndicator size="small" color={colors.icon} />
                ) : (
                  <Text className="text-base font-semibold text-blue-500">Save</Text>
                )}
              </Pressable>
            </View>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Album name"
              placeholderTextColor={colors.inputPlaceholder}
              className={`mt-3 rounded-xl px-4 py-3 ${colors.inputBg} ${colors.inputText}`}
              editable={!isRenamingAlbum}
              returnKeyType="done"
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}
