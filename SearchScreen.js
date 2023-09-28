import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import Icon from 'react-native-vector-icons/FontAwesome';
const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const api = axios.create({
    baseURL: "http://188.119.41.56:3009",
  });

  const searchApi = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/station/?line_code=${query.toUpperCase()}`
      );
      setResults(response.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleItemPress = (item) => {
    const xCoordinate = item.station_lon;
    const yCoordinate = item.station_lat;
    const stationName = item.station_name;
    const lineCode = item.line_code;

    navigation.navigate("Harita", {
      xCoordinate,
      yCoordinate,
      stationName,
      lineCode,
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Arama yapın..."
        onChangeText={(text) => setQuery(text)}
        value={query}
      />
      <Button title="Ara" onPress={searchApi} style={{ marginBottom: 20 }} />

      <View style={styles.nameContainer}>
        <View  style={styles.nameCard}><Text style={{color:'black'}}>Şişli</Text></View>
        <Icon.Button name="refresh" style={{flexDirection:'row',justifyContent:'center',marginLeft:10,padding:14}} >
    
  </Icon.Button>
        <View  style={styles.nameCard}><Text style={{color:'black'}}>Vezneciler</Text></View>
      </View>
      {loading ? (
        <Text style={{ marginTop: 20 }}>Arama yapılıyor...</Text>
      ) : (
        <View style={{marginTop: 16,
            backgroundColor: "white",
            padding: 16,
            borderRadius: 8,
            elevation: 3,}}>
            <FlatList
          data={results}
          style={{ marginTop: 20 }}
          r
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <>
            <TouchableOpacity
              onPress={() => handleItemPress(item)}
              style={styles.TouchableOpacity}
            >
              <View style={{flexDirection:'row',alignItems:'center',marginBottom: 3,}}>
                <View style={styles.circle}>
                    <Icon name='bus' style={{marginLeft:4}}  color="#900"></Icon>
                </View>
                
                <Text style={styles.title}>{item.station_name}</Text>
              </View>
            </TouchableOpacity>
            <Text style={{backgroundColor:'black',width:1,marginBottom:3,height:10,marginLeft:9 }}></Text>
            <Text style={{backgroundColor:'black',width:1,marginBottom:3,height:10,marginLeft:9 }}></Text>
            <Text style={{backgroundColor:'black',width:1,marginBottom:3,height:10 ,marginLeft:9}}></Text>
            </>
            
          )}
        />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: "black",
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    color: "black",
  },
  circle: { 
    height: 20,
    width: 20,
    borderRadius: 20,
    borderColor: 'red',
    borderWidth: 1,
    
   
    justifyContent: 'center',
    marginRight: 10,
    

    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        },
  card: {
    marginBottom: 16,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    elevation: 3,
  },
  nameCard: {
    fontWeight: "bold",
    fontSize: 16,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    elevation: 3,
    width: 150,
    height: 50,
    color: "black",
    flexDirection: 'row',
    justifyContent: 'center',

   
  },
  title: {
    fontWeight: "bold",
    color: "black",
    fontSize: 10,
  },
  description: {
    fontSize: 14,
    color: "black",
  },
  touchableItem: {
    // TouchableOpacity için stil
    backgroundColor: "#d5a6bd", // Dokunduğunuzda arka plan rengi değiştirilebilir
    borderRadius: 20,
  },
});

export default SearchScreen;