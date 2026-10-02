import { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, Image, Pressable, ActivityIndicator, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';

import ButtonComponent from '../components/ButtonComponent';
import { GlobalStyle } from '../styles/GlobalStyle';
import { uploadImage } from '../database/database';

// Udlejer: tag et billede til en side. Bygger på kursets kamera-guide (07_kamera).
// Når billedet er uploadet, sendes linket tilbage til EditPageScreen,
// som lægger det ind som en ny billedblok.
export default function CameraScreen({ navigation, route, houseId }) {
  const { pageId } = route.params;

  // Hook fra expo-camera: fortæller om vi har lov til at bruge kameraet
  const [permission, requestPermission] = useCameraPermissions();
  // useRef giver os fat i selve kameraet, så vi kan kalde takePictureAsync på det
  const cameraRef = useRef(null);
  // Kameraet skal kun køre, når skærmen er synlig (sparer batteri)
  const isFocused = useIsFocused();

  const [photoUri, setPhotoUri] = useState(null); // billedet, vi lige har taget
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function snap() {
    try {
      // quality 0.6 gør filen mindre, så upload går hurtigere
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      setPhotoUri(photo.uri);
      setError('');
    } catch (e) {
      setError('Kunne ikke tage billedet: ' + e.message);
    }
  }

  async function confirmPhoto() {
    setUploading(true);
    try {
      const url = await uploadImage(houseId, pageId, photoUri);
      // Gå tilbage til EditPage og send linket med som param.
      // merge: true beholder de params, der allerede er der (pageId).
      navigation.navigate({ name: 'EditPage', params: { newImageUrl: url }, merge: true });
    } catch (e) {
      setError('Upload mislykkedes: ' + e.message);
      setUploading(false);
    }
  }

  // Tilladelsen er ikke hentet endnu
  if (!permission) {
    return <View style={GlobalStyle.cameraContainer} />;
  }

  // Vi har ikke fået lov til kameraet
  if (!permission.granted) {
    return (
      <View style={GlobalStyle.ownerContainer}>
        <View style={GlobalStyle.ownerCard}>
          <Text style={GlobalStyle.ownerTitle}>Adgang til kamera</Text>
          <Text style={GlobalStyle.ownerSubtitle}>
            FerieGuide skal have lov til at bruge kameraet for at tage billeder til guiden.
          </Text>
          {/* canAskAgain er false, hvis brugeren har sagt nej før – så skal det ændres i Indstillinger */}
          {permission.canAskAgain ? (
            <ButtonComponent title="Giv adgang" type="primary" width={260} height={60} onPress={requestPermission} />
          ) : (
            <ButtonComponent
              title="Åbn Indstillinger"
              type="primary"
              width={260}
              height={60}
              onPress={() => Linking.openSettings()}
            />
          )}
        </View>
      </View>
    );
  }

  // Vi har taget et billede: vis det og lad udlejeren vælge
  if (photoUri) {
    return (
      <View style={GlobalStyle.cameraContainer}>
        <Image source={{ uri: photoUri }} style={GlobalStyle.cameraPreview} resizeMode="contain" />
        <View style={GlobalStyle.cameraBottomBar}>
          {uploading ? (
            <View style={GlobalStyle.cameraUploading}>
              <ActivityIndicator size="large" color={GlobalStyle.colors.surface} />
              <Text style={GlobalStyle.cameraUploadingText}>Uploader billedet …</Text>
            </View>
          ) : (
            <View style={GlobalStyle.cameraButtons}>
              <ButtonComponent title="Tag nyt" type="secondary" width={180} height={60} onPress={() => setPhotoUri(null)} />
              <ButtonComponent title="Brug billede" type="primary" width={180} height={60} onPress={confirmPhoto} />
            </View>
          )}
          {error !== '' && <Text style={GlobalStyle.cameraError}>{error}</Text>}
        </View>
        <StatusBar style="light" />
      </View>
    );
  }

  // Selve kameraet med en stor udløserknap
  return (
    <View style={GlobalStyle.cameraContainer}>
      {isFocused && <CameraView ref={cameraRef} style={GlobalStyle.cameraView} facing="back" />}
      <View style={GlobalStyle.cameraBottomBar}>
        <Pressable
          onPress={snap}
          style={({ pressed }) => [GlobalStyle.cameraShutter, pressed && GlobalStyle.cameraShutterPressed]}
        />
        {error !== '' && <Text style={GlobalStyle.cameraError}>{error}</Text>}
      </View>
      <StatusBar style="light" />
    </View>
  );
}
