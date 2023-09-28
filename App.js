// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SearchScreen from "./SearchScreen";
import MapScreen from "./MapScreen";

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AnaSayfa">
        <Stack.Screen name="Hat Arama" component={SearchScreen} />
        <Stack.Screen name="Harita" component={MapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;