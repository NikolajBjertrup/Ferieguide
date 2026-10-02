import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ButtonComponent from '../components/ButtonComponent';
import TextInputComponent from '../components/TextInputComponent';
import { GlobalStyle } from '../styles/GlobalStyle';
import { updateHouse } from '../database/database';

// Udlejer: ret husets info, som gæsten ser på forsiden
// (navn, velkomsttekst, wifi, udtjekning og kontakt).
export default function EditHouseScreen({ navigation, house, setHouse }) {
  // Kladde: som på EditPageScreen gemmes først, når der trykkes "Gem"
  const [name, setName] = useState(house.name);
  const [welcome, setWelcome] = useState(house.welcome);
  const [checkout, setCheckout] = useState(house.checkout);
  const [wifiName, setWifiName] = useState(house.wifiName);
  const [wifiPassword, setWifiPassword] = useState(house.wifiPassword);
  const [ownerName, setOwnerName] = useState(house.ownerName);
  const [ownerPhone, setOwnerPhone] = useState(house.ownerPhone);

  function save() {
    const changes = {
      name: name,
      welcome: welcome,
      checkout: checkout,
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

          <TextInputComponent label="Husets navn" hint="Fx Sommerhus Klitvej 12" value={name} onChangeText={setName} />
          <TextInputComponent
            label="Velkomsttekst"
            hint="Det første gæsten læser"
            value={welcome}
            onChangeText={setWelcome}
            multiline={true}
          />
          <TextInputComponent label="Udtjekning" hint="Fx Senest kl. 10.00" value={checkout} onChangeText={setCheckout} />
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
