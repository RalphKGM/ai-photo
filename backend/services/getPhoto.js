export const getPhoto = async (user, supabase, id) => {
    const { data, error } = await supabase
        .from('photo')
        .select('id, device_asset_id, descriptive, literal, tags, manual_description, created_at')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) throw error;
    return data;
};