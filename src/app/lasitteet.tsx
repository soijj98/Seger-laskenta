import { ThemedView } from "@/components/themed-view";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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
import { supabase } from "../lib/supabase";

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

  // Uudet tilat reseptin katseluikkunaa varten
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [selectedGlaze, setSelectedGlaze] = useState<Glazes | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<any[]>([]);

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

  const handleSwipeDelete = async (id: number) => {
    await deleteGlazes(id);
    loadData();
  };

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

  // Hakee lasitteen reseptin Supabasesta ja avaa ikkunan
  const openRecipe = async (glaze: Glazes) => {
    setSelectedGlaze(glaze);
    setRecipeModalVisible(true);
    setRecipeDetails([]); // Tyhjennetään vanha latauksen ajaksi

    // 1. Hae reseptirivit
    const { data: rows } = await supabase
      .from('recipe_rows')
      .select('*')
      .eq('glaze_id', glaze.id);

    if (rows && rows.length > 0) {
      // 2. Hae raaka-aineiden nimet
      const { data: mats } = await supabase.from('ingredients').select('id, name');
      const matMap: Record<number, string> = {};
      mats?.forEach(m => matMap[m.id] = m.name);

      // 3. Yhdistä tiedot
      const enriched = rows.map(row => ({
        ...row,
        materialName: matMap[row.raw_material_id] || "Tuntematon raaka-aine"
      }));
      setRecipeDetails(enriched);
    }
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
          onPress={() => openRecipe(item)} // KLIKKAUS AVAA RESEPTIN
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
            <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
            <Text>{item.date} | Lämpötila: {item.temperature}°C</Text>    
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
        <Button title={i18n.t("glazeDate")} onPress={() => sortData('date')} />
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

      {/* MODAL: RESEPTIN KATSELU */}
      <Modal visible={recipeModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.recipeModalContainer}>
            <Text style={styles.modalTitle}>{selectedGlaze?.name}</Text>
            <Text style={{ marginBottom: 15, fontStyle: 'italic' }}>
              {selectedGlaze?.date} | {selectedGlaze?.temperature}°C
            </Text>

            {recipeDetails.length > 0 ? (
              recipeDetails.map((r, i) => (
                <View key={i} style={styles.recipeRow}>
                  <Text style={{ flex: 1, fontSize: 16 }}>{r.materialName}</Text>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{r.amount_perc} %</Text>
                </View>
              ))
            ) : (
              <Text style={{ marginBottom: 15 }}>Tälle lasitteelle ei ole tallennettu reseptiä.</Text>
            )}
            
            <View style={{ marginTop: 20 }}>
              <Button title="Sulje" onPress={() => setRecipeModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
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
  // Uudet tyylit modaalia varten
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  recipeModalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  recipeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 10,
  }
});