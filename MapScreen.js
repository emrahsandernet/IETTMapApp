import React, { useEffect, useState } from "react";
import MapView, { Marker } from "react-native-maps";
import { StyleSheet, Image } from "react-native";
import CustomMarker from "./CustomMarker"; // Özelleştirilmiş işaretçi bileşeni
import axios from "axios";

const MapScreen = ({ route }) => {
  const [markerCoordinate, setMarkerCoordinate] = useState({
    latitude: 40.9931945, // Default enlem
    longitude: 28.6093371666667, // Default boylam
  });
  const [lineCode, setLineCode] = useState(""); // lineCode'u state'e ekle
  const [stationName, setStationName] = useState("null"); // stationName'i state'e ekle
  const [results, setResults] = useState([]);
  const api = axios.create({
    baseURL: "http://188.119.41.56:3009",
  });

  useEffect(() => {
    if (route.params && route.params.xCoordinate && route.params.yCoordinate) {
      // Eğer xCoordinate ve yCoordinate route parametrelerinde varsa,
      // bu değerleri kullanarak markerCoordinate'ı güncelle

      setMarkerCoordinate({
        latitude: parseFloat(route.params.xCoordinate),
        longitude: parseFloat(route.params.yCoordinate),
      });
      setStationName(route.params.stationName); // stationName'i güncelle
      setLineCode(route.params.lineCode); // lineCode'u güncelle
      searchApi(); // searchApi() fonksiyonunu çağır
    }
  }, [route.params]);
  const searchApi = async () => {
    try {
      const response = await api.get(
        `/api/bus/?line_code=${route.params.lineCode}`
      );
      setResults(response.data);
      response.data.map((result) => {
        console.log(result.boylam, result.enlem);
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: markerCoordinate.latitude, // Harita başlangıç enlemi
        longitude: markerCoordinate.longitude, // Harita başlangıç boylamı
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      zoomControlEnabled={true}
      zoomEnabled={true}
      showsUserLocation={true}
      showsCompass={true}
      camera={{
        center: {
          latitude: markerCoordinate.latitude, // Harita başlangıç enlemi
          longitude: markerCoordinate.longitude, // Harita başlangıç boylamı
        },
        pitch: 45,
        heading: 180,
        altitude: 1000,
        zoom: 16,
      }}
    >
      <CustomMarker
        coordinate={markerCoordinate}
        title={stationName}
        description="Haritanın üzerindeki özelleştirilmiş işaretçi"
        customIcon={require("./assets/bus-stop.png")} // Özel simge
      />
      {results.map((result, index) => (
        <Marker
          key={index}
          coordinate={{
            latitude: parseFloat(result.enlem), // parseFloat() fonksiyonu ile string değeri float'a çeviriyoruz
            longitude: parseFloat(result.boylam), // parseFloat() fonksiyonu ile string değeri float'a çeviriyoruz
          }}
          title={result.yon}
          description={result.hatkodu}
        >
          <Image
            source={require("./assets/bus-lane.png")}
            style={{ width: 40, height: 40 }}
          />
        </Marker>
      ))}
    </MapView>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

