import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import ButtonComponent from '../components/ButtonComponent';
import TextInputComponent from '../components/TextInputComponent';
import { GlobalStyle } from '../styles/GlobalStyle';
import { HOUSE } from '../data/const';
import { updateHouse, uploadCoverImage } from '../database/database';

// Udlejer: ret husets info, som gæsten ser på forsiden
// (baggrundsbillede, navn, velkomsttekst, wifi og kontakt).
export default function EditHouseScreen({ navigation, route, house, setHouse }) {
  // Kladde: som på EditPageScreen gemmes først, når der trykkes "Gem"
  // coverUrl = link til eget baggrundsbillede i Storage (null = standardbilledet)
  const [coverUrl, setCoverUrl] = useState(house.coverUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState(house.name);
  const [welcome, setWelcome] = useState(house.welcome);
  const [wifiName, setWifiName] = useState(house.wifiName);
  const [wifiPassword, setWifiPassword] = useState(house.wifiPassword);
  const [ownerName, setOwnerName] = useState(house.ownerName);
  const [ownerPhone, setOwnerPhone] = useState(house.ownerPhone);

  // Når CameraScreen har uploadet et billede, kommer linket tilbage som
  // route.params.newImageUrl – ligesom på EditPageScreen
  const newImageUrl = route.params?.newImageUrl;
  useEffect(() => {
    if (newImageUrl) {
      setCoverUrl(newImageUrl);
    }
  }, [newImageUrl]);

  // Vælg baggrund fra galleriet og upload den til Storage
  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (result.canceled) {
      return;
    }
    setUploading(true);
    setError('');
    try {
      const url = await uploadCoverImage(house.id, result.assets[0].uri);
      setCoverUrl(url);
    } catch (e) {
      setError('Upload mislykkedes: ' + e.message);
    }
    setUploading(false);
  }

  function save() {
    // Vent med at gemme, til billedet er uploadet
    if (uploading) {
      return;
    }
    const changes = {
      coverUrl: coverUrl,
      name: name,
      welcome: welcome,
      wifiName: wifiName,
      wifiPassword: wifiPassword,
      ownerName: ownerName,
      ownerPhone: ownerPhone,
    };
    // Opdatér state i App.js, så forsiden viser ændringen med det samme ...
    setHouse({ ...house, ...changes });
    // ... og gem i Firestore
    updateHouse(house.id, changes).catch((error) =>
      console.log('Kunne ikke gemme i Firestore:', error.message)
    );
    navigation.goBack();
  }

  return (
    <View style={GlobalStyle.ownerListContainer}>
      <ScrollView
        contentContainerStyle={GlobalStyle.editScroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        <View style={GlobalStyle.editCard}>
          <View style={GlobalStyle.editHeader}>
            <Ionicons name="home-outline" size={28} color={GlobalStyle.colors.accent} />
            <Text style={GlobalStyle.editHeaderText}>Husinfo</Text>
          </View>

          {/* Baggrundsbillede på forsiden: eget billede eller appens standardbillede */}
          <Text style={GlobalStyle.inpLabel}>Baggrund på forsiden</Text>
          <Image
            source={coverUrl ? { uri: coverUrl } : HOUSE.cover}
            style={GlobalStyle.coverPreview}
            resizeMode="cover"
          />
          <View style={GlobalStyle.blockAddRow}>
            <ButtonComponent
              title="Kamera"
              type="secondary"
              width={140}
              height={56}
              onPress={() => navigation.navigate('Camera', { returnTo: 'EditHouse' })}
            />
            <ButtonComponent title="Galleri" type="secondary" width={140} height={56} onPress={pickFromGallery} />
            {/* "Standard" vises kun, når der er valgt et eget billede */}
            {coverUrl && (
              <ButtonComponent title="Standard" type="secondary" width={140} height={56} onPress={() => setCoverUrl(null)} />
            )}
          </View>
          {uploading && (
            <View style={GlobalStyle.blockUploading}>
              <ActivityIndicator color={GlobalStyle.colors.accent} />
              <Text style={GlobalStyle.blockUploadingText}>Uploader billedet …</Text>
            </View>
          )}
          {error !== '' && <Text style={GlobalStyle.ownerError}>{error}</Text>}

          <TextInputComponent label="Husets navn" hint="Fx Sommerhus Klitvej 12" value={name} onChangeText={setName} />
          <TextInputComponent
            label="Velkomsttekst"
            hint="Det første gæsten læser"
            value={welcome}
            onChangeText={setWelcome}
            multiline={true}
          />
          <TextInputComponent
            label="Wifi-navn"
            hint="Netværkets navn"
            value={wifiName}
            onChangeText={setWifiName}
            autoCapitalize="none"
          />
          <TextInputComponent
            label="Wifi-kode"
            hint="Kodeordet til wifi"
            value={wifiPassword}
            onChangeText={setWifiPassword}
            autoCapitalize="none"
          />
          <TextInputComponent label="Kontaktperson" hint="Dit navn" value={ownerName} onChangeText={setOwnerName} />
          <TextInputComponent
            label="Telefon"
            hint="Fx +45 12 34 56 78"
            value={ownerPhone}
            onChangeText={setOwnerPhone}
            keyboardType="phone-pad"
          />

          <View style={GlobalStyle.editButtons}>
            <ButtonComponent
              title="Annuller"
              type="secondary"
              width={160}
              height={56}
              onPress={() => navigation.goBack()}
            />
            <ButtonComponent title="Gem" type="primary" width={160} height={56} onPress={save} />
          </View>
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </View>
  );
}
