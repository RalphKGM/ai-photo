import { getClientAuthToken } from '../utils/getClientAuthToken.js';
import { addPhotosToAlbum, createAlbum, getAlbums } from '../services/albumService.js';

export const getAlbumsController = async (req, res) => {
  try {
    const supabase = getClientAuthToken(req, res);
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const albums = await getAlbums(user, supabase);
    res.status(200).json({ albums });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch albums',
      details: error.message,
    });
  }
};

export const createAlbumController = async (req, res) => {
  try {
    const supabase = getClientAuthToken(req, res);
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, cover_photo_id: coverPhotoId = null } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'Album name is required' });

    const album = await createAlbum(user, supabase, name, coverPhotoId);
    res.status(201).json({ album });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Album name already exists' });
    }

    res.status(500).json({
      error: 'Failed to create album',
      details: error.message,
    });
  }
};

export const addPhotosToAlbumController = async (req, res) => {
  try {
    const supabase = getClientAuthToken(req, res);
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id: albumId } = req.params;
    const { photoIds } = req.body || {};

    const result = await addPhotosToAlbum(user, supabase, albumId, photoIds);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Album not found') {
      return res.status(404).json({ error: error.message });
    }

    if (
      error.message === 'photoIds is required' ||
      error.message === 'No valid photos to add'
    ) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: 'Failed to add photos to album',
      details: error.message,
    });
  }
};
