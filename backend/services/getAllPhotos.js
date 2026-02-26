export const getAllPhotos = async (user, supabase) => {
    const { data, error } = await supabase
        .from('photo')
        .select('id, device_asset_id, descriptive, literal, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
};