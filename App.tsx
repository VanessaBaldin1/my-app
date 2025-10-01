import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Alert,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Localizacao from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Chaves do AsyncStorage
const FOTO_KEY = "@meuapp:foto";
const TITULO_KEY = "@meuapp:titulo";

type LocalizacaoType = {
  coords: {
    latitude: number;
    longitude: number;
  };
} | null;

export default function App() {
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [localizacao, setLocalizacao] = useState<LocalizacaoType>(null);
  const [titulo, setTitulo] = useState<string>("");
  const [temPermissaoLocalizacao, setTemPermissaoLocalizacao] =
    useState<boolean>(false);

  // Carrega foto e título ao iniciar
  useEffect(() => {
    (async () => {
      try {
        const fotoSalva = await AsyncStorage.getItem(FOTO_KEY);
        const tituloSalvo = await AsyncStorage.getItem(TITULO_KEY);

        if (fotoSalva) setFotoUri(fotoSalva);
        if (tituloSalvo) setTitulo(tituloSalvo);
      } catch (err) {
        console.log("Erro ao carregar storage:", err);
      }
    })();
  }, []);

  // Permissão de localização
  useEffect(() => {
    (async () => {
      try {
        const { status } =
          await Localizacao.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permissão negada",
            "Precisamos da permissão de localização para funcionar!"
          );
          return;
        }
        setTemPermissaoLocalizacao(true);
      } catch (err) {
        console.log("Erro ao pedir permissão de localização:", err);
      }
    })();
  }, []);

  // Tirar foto
  const tirarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Acesso negado!",
          "Você precisa permitir o acesso à câmera para tirar fotos."
        );
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (resultado.canceled) {
        console.log("Usuário cancelou a câmera.");
        return;
      }

      // Pega a URI correta da foto
      const uri = resultado.assets?.[0]?.uri;
      if (!uri) {
        console.log("⚠️ Nenhuma URI de foto retornada:", resultado);
        Alert.alert("Erro", "Não foi possível capturar a imagem.");
        return;
      }

      setFotoUri(uri);
      await AsyncStorage.setItem(FOTO_KEY, uri);
      console.log("📸 Foto salva:", uri);
    } catch (err) {
      console.log("Erro ao abrir câmera:", err);
      Alert.alert("Erro", "Ocorreu um erro ao abrir a câmera.");
    }
  };

  //  Atualizar título
  const atualizarTitulo = async (texto: string) => {
    setTitulo(texto);
    try {
      await AsyncStorage.setItem(TITULO_KEY, texto);
    } catch (err) {
      console.log("Erro ao salvar título:", err);
    }
  };

  //  Obter localização
  const obterLocalizacao = async () => {
    if (!temPermissaoLocalizacao) {
      Alert.alert(
        "Permissão negada",
        "A permissão de localização não foi concedida."
      );
      return;
    }
    try {
      const pos = await Localizacao.getCurrentPositionAsync({});
      setLocalizacao(pos);
    } catch (err) {
      console.log("Erro ao obter localização:", err);
      Alert.alert(
        "Erro de Localização",
        "Não foi possível obter a localização. Verifique o GPS."
      );
    }
  };

  //  Limpar dados
  const limparDadosSalvos = async () => {
    try {
      await AsyncStorage.multiRemove([FOTO_KEY, TITULO_KEY]);
      setFotoUri(null);
      setTitulo("");
      setLocalizacao(null);
      Alert.alert("Pronto", "Dados apagados.");
    } catch (err) {
      console.log("Erro ao apagar dados:", err);
      Alert.alert("Erro", "Não foi possível apagar os dados.");
    }
  };

  return (
    <>
      <SafeAreaView style={estilos.safeArea}>
        <ScrollView contentContainerStyle={estilos.container}>
          <Text style={estilos.tituloApp}>Meu App - Lugares Visitados</Text>

          <View style={estilos.caixaImagem}>
            {fotoUri ? (
              <Image
                source={{ uri: fotoUri }}
                style={estilos.imagem}
                resizeMode="cover"
              />
            ) : (
              <Text style={estilos.textoPlaceholder}>Nenhuma foto tirada</Text>
            )}
          </View>

          <TextInput
            style={estilos.input}
            placeholder="Digite algo sobre a foto/local..."
            value={titulo}
            onChangeText={atualizarTitulo}
          />

          <View style={estilos.caixaBotoes}>
            <Pressable
              style={({ pressed }) => [
                estilos.botao,
                { backgroundColor: pressed ? "#E65100" : "#FF6F00" },
              ]}
              onPress={tirarFoto}
            >
              <Text style={estilos.textoBotao}> Tirar Foto</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                estilos.botao,
                { backgroundColor: pressed ? "#E65100" : "#FF6F00" },
              ]}
              onPress={obterLocalizacao}
            >
              <Text style={estilos.textoBotao}> Localizar</Text>
            </Pressable>
          </View>

          <View style={{ width: "100%", marginBottom: 12 }}>
            <Pressable
              style={({ pressed }) => [
                estilos.botaoLimpar,
                { backgroundColor: pressed ? "#ddd" : "#efefef" },
              ]}
              onPress={limparDadosSalvos}
            >
              <Text> Apagar dados salvos</Text>
            </Pressable>
          </View>

          <View style={estilos.caixaMapa}>
            {localizacao ? (
              <MapView
                style={estilos.mapa}
                initialRegion={{
                  latitude: localizacao.coords.latitude,
                  longitude: localizacao.coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: localizacao.coords.latitude,
                    longitude: localizacao.coords.longitude,
                  }}
                  title={titulo || "Local da Foto"}
                />
              </MapView>
            ) : (
              <Text style={estilos.textoPlaceholder}>
                Localização não definida
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const estilos = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flexGrow: 1, alignItems: "center", padding: 20 },
  tituloApp: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
  },
  caixaImagem: {
    width: "100%",
    height: 250,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderRadius: 8,
  },
  imagem: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  textoPlaceholder: { color: "#888" },
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
  caixaBotoes: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  botao: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotao: { color: "#fff", fontSize: 16, fontWeight: "600" },
  botaoLimpar: { padding: 12, alignItems: "center", borderRadius: 8 },
  caixaMapa: {
    width: "100%",
    height: 300,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  mapa: { flex: 1 },
});
