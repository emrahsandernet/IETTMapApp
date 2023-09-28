import React, { useState } from "react";
import {
  View,
  Image,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Marker, Callout } from "react-native-maps";

const CustomMarker = ({ coordinate, title, description, customIcon }) => {
  const [modalVisible, setModalVisible] = useState(true);

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  return (
    <Marker coordinate={coordinate} title={title}>
      <Image source={customIcon} style={{ width: 30, height: 30 }} />
    </Marker>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  touchableContainer: {
    width: 100, // Set the width and height for your desired touchable area
    height: 100,
  },
});

export default CustomMarker;