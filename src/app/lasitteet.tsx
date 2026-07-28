import { ThemedView } from "@/components/themed-view";
import { useEffect, useState } from "react";
import {
    Alert,
    Button,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { FlatList, Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    addGlazes,
    archiveGlazes,
    deleteGlazes,
    deleteMultipleGlazes,
    getGlazes,
} from "../lib/db";
import i18n from "../lib/i18n/i18n";

interface Glazes {
  id: number;
  name: string;
  date: string;
  temperature: number;
  archived: number;
}

export default function GlazesScreen() {
  const [glazes, setGlazes] = useState<Glazes[]>([]);
  const [selectedId, setSelectedId] = useState<number[]>([]);

  const [newGlaze, setNewGlaze] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTemperature, setNewTemperature] = useState("");

  const handleAddGlaze = async () => {
    if (!newGlaze) {
      Alert.alert(i18n.t("error"), i18n.t("glazeNamePlaceholder"));
      return;
    }

    const dateToSave = newDate || "";
    const tempToSave = newTemperature ? parseInt(newTemperature, 10) : 0;

    await addGlazes(newGlaze, dateToSave, tempToSave);

    setNewGlaze("");
    setNewDate("");
    setNewTemperature("");
    loadData();
  };

  const loadData = async () => {
    try {
      const data = (await getGlazes()) as Glazes[];
      setGlazes(data);
    } catch (error) {
      console.error(i18n.t("dbErr"), error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSwipeDelete = async (id: number) => {
    await deleteGlazes(id);
    loadData();
  };

  // archive

  const handleLongPress = (id: number) => {
    Alert.alert(
      `${i18n.t("manageGlazes")}`,
      `${i18n.t("doYouWantremoveGlaze")}`,
      [
        { text: i18n.t("cancel") },
        {
          text: i18n.t("archive"),
          onPress: async () => {
            await archiveGlazes(id);
            loadData();
          },
        },
        {
          text: i18n.t("ok"),
          onPress: async () => {
            await deleteGlazes(id);
            loadData();
          },
        },
      ],
    );
  };

  const toggleSelection = (id: number) => {
    if (selectedId.includes(id)) {
      setSelectedId(selectedId.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedId([...selectedId, id]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedId.length > 0) {
      await deleteMultipleGlazes(selectedId);
      setSelectedId([]);
      loadData();
    }
  };

  const sortData = (way: "name" | "date" | "temperature") => {
    const sorted = [...glazes].sort((a, b) => {
      if (a[way] < b[way]) return -1;
      if (a[way] > b[way]) return 1;
      return 0;
    });
    setGlazes(sorted);
  };

  const renderItem = ({ item }: { item: Glazes }) => {
    const isSelected = selectedId.includes(item.id);

    const renderRightActions = () => (
      <TouchableOpacity
        style={styles.deleteSwipe}
        onPress={() => handleSwipeDelete(item.id)}
      >
        <Text style={{ color: "white" }}>{i18n.t("delete")}</Text>
      </TouchableOpacity>
    );

    return (
      <Swipeable renderRightActions={renderRightActions}>
        <TouchableOpacity
          style={[styles.row, isSelected && styles.selectedRow]}
          onLongPress={() => handleLongPress(item.id)}
          delayLongPress={500}
        >
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleSelection(item.id)}
          >
            <Text>{isSelected ? "[X]" : "[ ]"}</Text>
          </TouchableOpacity>

          <View>
            <Text> {item.name}</Text>
            {/*<Text> {item.date} | Lämpötila: {item.temperature}</Text>    {tektiä kääntää*/}
            {/*<Text> {item.archived}</Text>*/}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView type="backgroundElement" style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder={i18n.t("glazeNamePlaceholder")}
          value={newGlaze}
          onChangeText={setNewGlaze}
        />
        <TextInput
          style={styles.input}
          placeholder={i18n.t("glazeDatePlaceholder")}
          value={newDate}
          onChangeText={setNewDate}
        />
        <TextInput
          style={styles.input}
          placeholder={i18n.t("glazeTempPlaceholder")}
          value={newTemperature}
          onChangeText={setNewTemperature}
          keyboardType="numeric"
        />
        <Button title={i18n.t("saveGlaze")} onPress={handleAddGlaze} />
      </ThemedView>

      <ThemedView style={styles.buttonRow}>
        <Button title={i18n.t("glaze")} onPress={() => sortData("name")} />
        {/*<Button title={i18n.t("glazeDate")} onPress={() => sortData('date')} />*/}
        <Button
          title={i18n.t("glazeTemp")}
          onPress={() => sortData("temperature")}
        />
      </ThemedView>

      {selectedId.length > 0 && (
        <Button
          title={`${i18n.t("removeSelected")} (${selectedId.length})`}
          color="red"
          onPress={handleDeleteSelected}
        />
      )}

      <FlatList
        data={glazes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    height: 50,
  },

  row: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    backgroundColor: "#fff",
    alignItems: "center",
  },

  selectedRow: {
    backgroundColor: "#e0f7fa",
  },

  checkbox: {
    marginRight: 15,
    padding: 5,
  },

  deleteSwipe: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "flex-end",
    padding: 20,
  },

  formContainer: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderColor: "#ccc",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
  },

  input: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
});
