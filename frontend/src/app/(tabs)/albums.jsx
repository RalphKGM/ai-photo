import { useCallback, useMemo } from 'react';
import { View, Animated, ActivityIndicator } from 'react-native';
import { usePhotoContext } from '../../context/PhotoContext.jsx';
import { useThemeContext } from '../../context/ThemeContext.jsx';
import { getThemeColors } from '../../theme/appColors.js';
import AlbumDetail from '../../components/albums/AlbumDetail.jsx';
import AlbumCard from '../../components/albums/AlbumCard.jsx';
import PhotoItem from '../../components/PhotoItem.jsx';
import AlbumsHeader from '../../components/albums/AlbumsHeader.jsx';
import AlbumsEmptyState from '../../components/albums/AlbumsEmptyState.jsx';
import AlbumsPager from '../../components/albums/AlbumsPager.jsx';
import CreateAlbumModal from '../../components/albums/CreateAlbumModal.jsx';
import AddPhotosModal from '../../components/albums/AddPhotosModal.jsx';
import AlbumMenuModal from '../../components/albums/AlbumMenuModal.jsx';
import RenameAlbumModal from '../../components/albums/RenameAlbumModal.jsx';
import useAlbums from '../../hooks/useAlbums.js';

const CREATE_COLUMNS = 4;

export default function Albums() {
  const { photos, setPhotos } = usePhotoContext();
  const { isDarkMode } = useThemeContext();
  const colors = getThemeColors(isDarkMode);
  const {
    screenWidth,
    slideAnim,
    albums,
    openAlbum,
    albumPages,
    isLoading,
    isRefreshing,
    currentAlbumPage,
    isCreateAlbumVisible,
    selectedPhotoIds,
    newAlbumName,
    isCreatingAlbum,
    isAddPhotosVisible,
    selectedAddPhotoIds,
    isAddingPhotos,
    isAlbumMenuVisible,
    isRenameVisible,
    renameValue,
    isRenamingAlbum,
    availablePhotos,
    loadAlbums,
    setCurrentAlbumPage,
    setNewAlbumName,
    setRenameValue,
    handleOpenAlbum,
    handleCloseAlbum,
    handleAlbumPhotosChange,
    openCreateAlbum,
    closeCreateAlbum,
    openAddPhotos,
    closeAddPhotos,
    openAlbumMenu,
    closeAlbumMenu,
    openRenameModal,
    closeRenameModal,
    toggleSelectedPhoto,
    toggleSelectedAddPhoto,
    handleCreateAlbum,
    handleAddPhotos,
    handleRemoveFromAlbum,
    handleRenameAlbum,
    handleDeleteAlbum,
  } = useAlbums({ photos, setPhotos });

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

  const totalPhotosInAlbums = useMemo(
    () => albums.reduce((sum, album) => sum + album.photos.length, 0),
    [albums]
  );

  return (
    <View className={`flex-1 ${colors.pageBg}`}>
      <AlbumsHeader
        colors={colors}
        albumsCount={albums.length}
        totalPhotosInAlbums={totalPhotosInAlbums}
        isLoading={isLoading}
        onAddPress={openCreateAlbum}
        disableAdd={photos.length === 0}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.loading} />
        </View>
      ) : albums.length === 0 ? (
        <AlbumsEmptyState colors={colors} isRefreshing={isRefreshing} onRefresh={() => loadAlbums(true)} />
      ) : (
        <AlbumsPager
          albumPages={albumPages}
          renderAlbumPage={renderAlbumPage}
          currentPage={currentAlbumPage}
          colors={colors}
          screenWidth={screenWidth}
          onPageChange={setCurrentAlbumPage}
        />
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

      <CreateAlbumModal
        visible={isCreateAlbumVisible}
        colors={colors}
        isCreating={isCreatingAlbum}
        onClose={closeCreateAlbum}
        onCreate={handleCreateAlbum}
        albumName={newAlbumName}
        onChangeName={setNewAlbumName}
        selectedCount={selectedPhotoIds.length}
        photos={photos}
        renderPhotoItem={renderCreatePhotoItem}
        numColumns={CREATE_COLUMNS}
      />

      <AddPhotosModal
        visible={isAddPhotosVisible}
        colors={colors}
        isAdding={isAddingPhotos}
        onClose={closeAddPhotos}
        onAdd={handleAddPhotos}
        selectedCount={selectedAddPhotoIds.length}
        photos={availablePhotos}
        renderPhotoItem={renderAddPhotoItem}
        numColumns={CREATE_COLUMNS}
      />

      <AlbumMenuModal
        visible={isAlbumMenuVisible}
        colors={colors}
        onClose={closeAlbumMenu}
        onRename={openRenameModal}
        onDelete={handleDeleteAlbum}
      />

      <RenameAlbumModal
        visible={isRenameVisible}
        colors={colors}
        isRenaming={isRenamingAlbum}
        onClose={closeRenameModal}
        onSave={handleRenameAlbum}
        value={renameValue}
        onChangeValue={setRenameValue}
      />
    </View>
  );
}
