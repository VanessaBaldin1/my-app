import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Button,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Solicita permissão de localização ao carregar o app
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão negada",
          "Precisamos da permissão de localização para funcionar!"
        );
        return;
      }
      setHasLocationPermission(true);
    })();
  }, []);

  // Tirar foto
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Acesso negado!",
        "Você precisa permitir o acesso à câmera para tirar fotos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Obter localização
  const handleGetLocation = async () => {
    if (!hasLocationPermission) {
      Alert.alert("Permissão negada", "A permissão de localização não foi concedida.");
      return;
    }

    try {
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    } catch (error) {
      Alert.alert(
        "Erro de Localização",
        "Não foi possível obter a localização. Verifique o GPS."
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>App 1 - Fotos de lugares visitados</Text>

        {/* Exibe a imagem ou placeholder */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <Text style={styles.placeholderText}>Nenhuma foto tirada</Text>
          )}
        </View>

        {/* Campo de texto */}
        <TextInput
          style={styles.input}
          placeholder="Digite algo sobre a foto/local..."
          value={title}
          onChangeText={setTitle}
        />

        {/* Botões */}
        <View style={styles.buttonContainer}>
          <Button title="Tirar Foto" onPress={handleTakePhoto} />
          <Button title="Localizar no mapa" onPress={handleGetLocation} />
        </View>

        {/* Mapa */}
        <View style={styles.mapContainer}>
          {location ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title={title || "Local da Foto"}
              />
            </MapView>
          ) : (
            <Text style={styles.placeholderText}>Localização não definida</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos em React Native
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 20,
  },
  imageContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderRadius: 8,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  placeholderText: {
    color: "#888",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  mapContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
});
