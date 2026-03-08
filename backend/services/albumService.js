export const getAlbums = async (user, supabase) => {
  const { data, error } = await supabase
    .from('album')
    .select('id, name, cover_photo_id, created_at, updated_at, album_photo(photo_id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((album) => ({
    id: album.id,
    name: album.name,
    cover_photo_id: album.cover_photo_id,
    created_at: album.created_at,
    updated_at: album.updated_at,
    photo_ids: (album.album_photo || []).map((row) => row.photo_id),
  }));
};

export const createAlbum = async (user, supabase, name, coverPhotoId = null) => {
  const safeName = name?.trim();
  if (!safeName) throw new Error('Album name is required');

  const { data, error } = await supabase
    .from('album')
    .insert({
      user_id: user.id,
      name: safeName,
      cover_photo_id: coverPhotoId,
    })
    .select('id, name, cover_photo_id, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
};

export const addPhotosToAlbum = async (user, supabase, albumId, photoIds = []) => {
  if (!albumId) throw new Error('Album ID is required');
  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    throw new Error('photoIds is required');
  }

  const uniquePhotoIds = [...new Set(photoIds.filter(Boolean))];

  const { data: album, error: albumError } = await supabase
    .from('album')
    .select('id, user_id')
    .eq('id', albumId)
    .eq('user_id', user.id)
    .single();

  if (albumError || !album) throw new Error('Album not found');

  const { data: ownedPhotos, error: ownedPhotosError } = await supabase
    .from('photo')
    .select('id')
    .eq('user_id', user.id)
    .in('id', uniquePhotoIds);

  if (ownedPhotosError) throw ownedPhotosError;

  const ownedPhotoIdSet = new Set((ownedPhotos || []).map((p) => p.id));
  const validPhotoIds = uniquePhotoIds.filter((id) => ownedPhotoIdSet.has(id));

  if (validPhotoIds.length === 0) {
    throw new Error('No valid photos to add');
  }

  const rows = validPhotoIds.map((photoId) => ({
    album_id: albumId,
    photo_id: photoId,
  }));

  const { error } = await supabase
    .from('album_photo')
    .upsert(rows, { onConflict: 'album_id,photo_id', ignoreDuplicates: true });

  if (error) throw error;

  return {
    album_id: albumId,
    added_count: validPhotoIds.length,
  };
};
