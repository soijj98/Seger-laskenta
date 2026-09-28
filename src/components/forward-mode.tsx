import { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { Card, IconButton, List, Button as PaperButton, TextInput as PaperTextInput, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RawMaterial } from "../hooks/use-glaze-db";
import { saveGlazeRecipe } from "../lib/db";
import { RecipeRow, calculateSeger } from "../lib/glaze-engine";
import i18n from "../lib/i18n/i18n";
import SegerGrid from "./seger-table";

interface ForwardModeProps {
  materialsDb: RawMaterial[];
  rawMaterialMap: Record<number, RawMaterial>;
}

export default function ForwardMode({ materialsDb, rawMaterialMap }: ForwardModeProps) {
  const insets = useSafeAreaInsets();

   // ── Normal mode: Recipe → Seger ──
  const [recipeRows, setRecipeRows] = useState<RecipeRow[]>([]);
  const [segerResult, setSegerResult] = useState<Record<string, number> | null>(
    null,
  );
  const [forwardError, setForwardError] = useState<string | null>(null);

  //Modal
  const [isForwardModalVisible, setForwardModalVisible] = useState(false);

  const [ searchQuery, setSearchQuery ] = useState("");


  // Tallennuksen tilat
  const [isSaveModalVisible, setSaveModalVisible] = useState(false);
  const [glazeName, setGlazeName] = useState("");
  const [glazeDate, setGlazeDate] = useState("");
  const [glazeTemp, setGlazeTemp] = useState("");

  // filtered
    const filteredMaterials = useMemo(() => {
        if (!searchQuery) return materialsDb;
        return materialsDb.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [materialsDb, searchQuery]);

    // ---- normal way: Calculating when recipe rows are changed -----
  useEffect(() => {
    if (recipeRows.length === 0 && Object.keys(rawMaterialMap).length === 0) {
      //      const materialMap: Record<number, RawMaterial> = {};
      setSegerResult(null);
      setForwardError(null);
      return;
    }

    const result = calculateSeger(recipeRows, rawMaterialMap);

    // Saving the results if there is no error
    if (!result.error && result.seger) {
      setSegerResult(result.seger);
      setForwardError(null);
    } else {
      setSegerResult(null);
      setForwardError(result.error ?? null);
    }
  }, [recipeRows, rawMaterialMap]);


    // ------ Normal mode functions ----
    const addForwardMaterial = (material: RawMaterial) => {
      // to the raw material recipe 0%, user inputs the amount
      setRecipeRows((prev) => [
        ...prev,
        { raw_material_id: material.id, amount_perc: 0 },
      ]);
      setForwardModalVisible(false);
      setSearchQuery("");
    };
  
    const removeForwardRow = (index: number) => {
      setRecipeRows((prev) => prev.filter((_, i) => i !== index));
    };
  
    const updateForwardAmount = (text: string, index: number) => {
      const amount_perc = parseFloat(text.replace(",", ".")) || 0;
      setRecipeRows((prev) =>
        prev.map((row, i) => (i === index ? { ...row, amount_perc } : row)),
      );
    };

    const handleSaveRecipe = async () => {
    if (!glazeName) return alert("Anna lasitteelle vähintään nimi!");
    const tempToSave = parseInt(glazeTemp, 10) || 0;
    const result = await saveGlazeRecipe(glazeName, glazeDate, tempToSave, recipeRows);

    if (result.error) {
      alert("Virhe tallennettaessa: " + result.error.message);
    } else {
      alert("Resepti tallennettu!");
      setSaveModalVisible(false);
      setGlazeName(""); setGlazeDate(""); setGlazeTemp("");
    }
  };


return (
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        <Text variant= "titleLarge" style={styles.subHeader}>{i18n.t("Recipe")}</Text>

        <Card style={styles.card}>
        <Card.Content>
            {recipeRows.length === 0 ? (
            <Text style={styles.emptyText}>{i18n.t("addMat")}</Text>
            ) : (
            recipeRows.map((row, index) => {
            const material = rawMaterialMap[row.raw_material_id];
            return (
                <View key={index} style={styles.row}>
                <Text variant="bodyLarge" style={styles.materialName}>
                    {material ? material.name : i18n.t("unknown")}
                </Text>

                <PaperTextInput
                    mode="outlined"
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder={i18n.t("amount")}
                    value={row.amount_perc ? row.amount_perc.toString() : ""}
                    textColor="black"
                    placeholderTextColor="#a1a1aa"
                    theme={{
                    colors: {
                        onSurfaceVariant: '#a1a1aa',
                        primary: '#2a7'
                    }
                    }}
                    onChangeText={(text) => updateForwardAmount(text, index)}
                />
                <IconButton
                    icon="trash-can-outline"
                    iconColor="red"
                    size={18}
                    onPress={() => removeForwardRow(index)}
                />
                </View>
            );
            })
        )}
        <PaperButton
            mode="contained"
            icon="plus"
            style={styles.paperButton}
            onPress={() => setForwardModalVisible(true)}
        >
            {i18n.t("plusMat")}
        </PaperButton>
        </Card.Content>
    </Card>

    <Text variant="titleMedium"style={styles.subHeader}>{i18n.t("calculatedSeger")}</Text>
    <Card style={styles.card}>
        <Card.Content>
            {forwardError ? (
                <Text style={styles.errorText}>{forwardError}</Text>
            ) : segerResult ? (
                <SegerGrid seger={segerResult} />
            ) : (
                <Text style={styles.emptyText}>{i18n.t("addMatForSeger")}</Text>
            )}
        </Card.Content>
    </Card>
    
    {/* 3. Tallennusnappi */}
    {recipeRows.length > 0 && segerResult && (
    <PaperButton mode="contained" icon="content-save" buttonColor="#2a7" style={{ marginTop: 20 }} onPress={() => setSaveModalVisible(true)}>
        {i18n.t("saveGlaze")}
    </PaperButton>
    )}

    {/* ── MODAL: Choosing materials (normal mode)── */}
    <Modal visible={isForwardModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
            <Text variant="headlineSmall" style={styles.header}>{i18n.t("chooseMat")}</Text>
                <PaperTextInput
                    mode="outlined"
                    placeholder="Hae raaka-aineita..."
                    textColor="black"
                    placeholderTextColor={"#a1a1aa"}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    right={<PaperTextInput.Icon icon="magnify" />}
                    style={styles.searchInput}
                    />

                <PaperButton
                    mode="contained"
                    buttonColor="red"
                    onPress={() => {
                        setForwardModalVisible(false);
                        setSearchQuery("");
                    }}
                    style={{ marginBottom: 15 }}
                    >
                    {i18n.t("cancel")}
                </PaperButton>
                
                <FlatList
                    data={filteredMaterials}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <List.Item
                        title={item.name}
                        titleStyle={{color: 'black' }}
                        onPress={() => addForwardMaterial(item)}
                        style={styles.modalItem}
                        />
                    )}
                />

        </View>
    </Modal>

    {/* Modaali: Tallennus */}
      <Modal visible={isSaveModalVisible} animationType="slide" transparent={true}>
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="headlineSmall" style={{ marginBottom: 15 }}>Tallenna lasiteresepti</Text>
              <PaperTextInput mode="outlined" label="Lasitteen nimi" value={glazeName} onChangeText={setGlazeName} style={{ marginBottom: 10 }} />
              <PaperTextInput mode="outlined" label="Päivämäärä" value={glazeDate} onChangeText={setGlazeDate} style={{ marginBottom: 10 }} />
              <PaperTextInput mode="outlined" label="Polttolämpötila (°C)" keyboardType="numeric" value={glazeTemp} onChangeText={setGlazeTemp} style={{ marginBottom: 20 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <PaperButton onPress={() => setSaveModalVisible(false)} textColor="red">Peruuta</PaperButton>
                <PaperButton mode="contained" onPress={handleSaveRecipe} buttonColor="#2a7">Tallenna</PaperButton>
              </View>
            </Card.Content>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({


    header: { fontSize: 22, fontWeight: "bold", marginBottom: 15, marginTop: 30, color:"#050303" },
 
    subHeader: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
        marginTop: 12,
        color:"black"
    },

    emptyText: { 
        fontStyle: "italic", 
        color: "#000000", 
        marginBottom: 8 
    },

    errorText: { 
        color: "red", 
        marginBottom: 8, 
        backgroundColor: "white", 
        borderColor: "black", 
        borderRadius: 5, 
        padding: 20 
    },

    // Card base for sections
    card: {
        backgroundColor: "rgb(255, 255, 255)",
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 4,
        borderColor: "rgba(108, 136, 110, 0.79)",
        //elevation: 20,
        //shadowit ^^
    },

    // Reciperow (normal mode)
    //raaka-aineet
    row: { 
        flexDirection: "row", 
        alignItems: "center",
         marginBottom: 10 
    },
    materialName: { 
        flex: 2, 
        fontSize: 15, 
        color: "black" 
    },

    //valittu raaka-aine määrä
    input: {
        width: "35%",
        borderWidth: 1,
        borderColor: "#0c0c0c",
        padding: 2,
        borderRadius: 5,
        fontSize: 15,
        backgroundColor: "rgba(251, 255, 251, 0.66)",
        marginRight: 8,
    },

    // Modal
    modalContainer: { 
        flex: 1, 
        padding: 20, 
        marginTop: 40, 
        color:"black"
    },
    modalItem: { 
        padding: 15, 
        borderBottomWidth: 1, 
        borderBottomColor: "#eee", 
    },

    paperButton: {
        margin: 10,
        backgroundColor: "white",
        borderWidth: 2,
        borderColor: "black",
        borderRadius: 15
    },

    searchInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        fontSize: 16,
        backgroundColor: "#f1ecec",
        color: "black"
    },

});