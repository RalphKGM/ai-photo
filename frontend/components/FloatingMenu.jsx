import { View, Text, Pressable, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { takePhoto } from 'service/photoService';

export default function FloatingMenu({ menuVisible, toggleMenu, menuAnim, refreshPhotos }) {

  const handleTakePhoto = async () => {
    const photoUri = await takePhoto();
        
    if (photoUri) {
      console.log("Photo ready for AI processing:", photoUri);
      toggleMenu(); 
      refreshPhotos();
    }
  }

  const menuStyle = {
    opacity: menuAnim,
    transform: [
      { scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
      { translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }
    ],
  };

  const iconRotation = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const buttonColor = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#121212', '#3f3f46'],
  });

  return (
    <>
    	{/* context menu */}
      {menuVisible && (
        <Animated.View 
          style={[menuStyle]} 
          className="absolute bottom-28 right-8 w-56 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden z-20"
        >
          <Pressable onPress={handleTakePhoto} className="flex-row items-center justify-between p-4 border-b border-gray-100 active:bg-gray-100">
            <Text className="text-lg">Take Photo</Text>
            <Ionicons name="camera-outline" size={22} color="black" />
          </Pressable>
          <Pressable className="flex-row items-center justify-between p-4 active:bg-gray-100">
            <Text className="text-lg">Upload Photo</Text>
            <Ionicons name="image-outline" size={22} color="black" />
          </Pressable>
        </Animated.View>
      )}

      {/* + button */}
      <Animated.View 
        style={{ 
          backgroundColor: buttonColor,
          elevation: 5,
          zIndex: 10
        }}
        className="absolute bottom-8 right-8 w-16 h-16 rounded-full items-center justify-center shadow-lg"
      >
        <Pressable 
          onPress={toggleMenu}
        >
          <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
            <Ionicons name="add" size={32} color="white" />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </>
  );
}