import { useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { Card, IconButton, List, Button as PaperButton, TextInput as PaperTextInput, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RawMaterial } from "../hooks/use-glaze-db";
import { ALL_OXIDES, calcRecipe, R2O3, RecipeRow, RO2, RO_R2O, SegerFormula } from "../lib/glaze-engine";
import i18n from "../lib/i18n/i18n";
import SegerGrid from "./seger-table";

interface ReverseModeProps {
  materialsDb: RawMaterial[];
  rawMaterialMap: Record<number, RawMaterial>;
}


export default function ReverseMode({ materialsDb, rawMaterialMap }: ReverseModeProps) {
    const insets = useSafeAreaInsets();
    // ── reverse direction: Seger → Recipe ──
    // used seger values (text input because decimals)
    const [targetSeger, setTargetSeger] = useState<Record<string, string>>({});
  
    // raw materials which user have chosen to be used in the reverse calculation
    const [selectedMaterials, setSelectedMaterials] = useState<RawMaterial[]>([]);
  
    // The result of reverse calculation
    const [reverseResult, setReverseResult] = useState<RecipeRow[] | null>(null);
    const [reverseSeger, setReverseSeger] = useState<Record<string,number> | null>(null);
    const [reverseError, setReverseError] = useState<string | null>(null);
  
    // Modals
    const [isReverseModalVisible, setReverseModalVisible] = useState(false);
  
    //
    const [ searchQuery, setSearchQuery ] = useState("");
  
    const filteredMaterials = useMemo(() => {
        if (!searchQuery) return materialsDb;
        return materialsDb.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [materialsDb, searchQuery]);

    const updateTargetSeger = (oxide: string, text: string) => {
        setTargetSeger((prev) => ({ ...prev, [oxide]: text }));
    };

    const toggleReverseMaterial = (material: RawMaterial) => {
        // Choosing or removing raw material in reverse calculation
        setSelectedMaterials((prev) =>
        prev.find((m) => m.id === material.id)
            ? prev.filter((m) => m.id !== material.id)
            : [...prev, material],
        );
    };

    const runReverseCalculation = () => {
        // Building Seger formula object from users inputs
        const wantedSeger: SegerFormula = {};
        for (const oxide of ALL_OXIDES) {
            const val = parseFloat((targetSeger[oxide] ?? "").replace(",", "."));
            wantedSeger[oxide] = isNaN(val) ? 0 : val;
        }

        const selectedIds = selectedMaterials.map((m) => m.id);

        if (selectedIds.length === 0) {
            setReverseError(i18n.t("chooseMatToUse"));
        return;
        }

        const roSum = RO_R2O.reduce((s, o) => s + (wantedSeger[o] ?? 0), 0);
            if (roSum === 0) {
              setReverseError(i18n.t("atLeastOneRO"));
            return;
        }

        const result = calcRecipe(wantedSeger, selectedIds, rawMaterialMap);

        if (result.error || !result.rows) {
            setReverseError(result.error ?? i18n.t("calcErr"));
            setReverseResult(null);
            setReverseSeger(null);
            return;
        }

        setReverseResult(result.rows);
        setReverseSeger(result.calculatedSeger ?? null);
        setReverseError(null);
    };

    return (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
          {/* 1. Wanted Seger formula — entered into the formula one oxide at a time*/}
            <Text variant="titleMedium" style={styles.subHeader}>{i18n.t("targetSeger")}</Text>
            <Text variant="bodyMedium" style={styles.hintText}>{i18n.t("instructionsSeger")}</Text>

            <Card style={styles.card}>
                <Card.Content>
                {/* RO / R2O group */}
                <Text variant="labelLarge" style={styles.segerGroupLabel}>
                    {i18n.t("segerGroupSmelter")}
                </Text>
                <View style={styles.grid}>
                    {[...RO_R2O].map((oxide) => (
                    <View key={oxide} style={styles.oxideInputItem}>
                        <Text variant="labelMedium" style={styles.oxideName}>{oxide.toUpperCase()}</Text>
                        <PaperTextInput
                        mode="outlined"
                        dense={true}
                        style={{ width: "100%", backgroundColor: "#fff" }}
                        keyboardType="numeric"
                        placeholder="0"
                        textColor="black"
                        placeholderTextColor="#a1a1aa"
                        theme={{
                            colors: {
                            onSurfaceVariant: '#a1a1aa',
                            primary: '#2a7'
                        }
                        }}
                        value={targetSeger[oxide] ?? ""}
                        onChangeText={(text) => updateTargetSeger(oxide, text)}
                        />
                    </View>
                    ))}
                </View>

                {/* R2O3 group */}
                <Text variant="labelLarge" style={[styles.segerGroupLabel, { marginTop: 15 }]}>
                    {i18n.t("segerGroupStab")}
                </Text>
                <View style={styles.grid}>
                    {[...R2O3].map((oxide) => (
                    <View key={oxide} style={styles.oxideInputItem}>
                        <Text variant="labelMedium" style={styles.oxideName}>{oxide.toUpperCase()}</Text>
                        <PaperTextInput
                        mode="outlined"
                        dense={true}
                        style={{ width: "100%", backgroundColor: "#fff" }}
                        keyboardType="numeric"
                        placeholder="0"
                        textColor="black"
                        placeholderTextColor="#a1a1aa"
                        theme={{
                            colors: {
                            onSurfaceVariant: '#a1a1aa',
                            primary: '#2a7'
                        }
                        }}
                        value={targetSeger[oxide] ?? ""}
                        onChangeText={(text) => updateTargetSeger(oxide, text)}
                        />
                    </View>
                    ))}
                </View>

                {/* RO2 group */}
                <Text variant="labelLarge" style={[styles.segerGroupLabel, { marginTop: 15 }]}>
                    {i18n.t("segerGroupGlass")}
                </Text>
                <View style={styles.grid}>
                    {[...RO2].map((oxide) => (
                    <View key={oxide} style={styles.oxideInputItem}>
                        <Text variant="labelMedium" style={styles.oxideName}>{oxide.toUpperCase()}</Text>
                        <PaperTextInput
                        mode="outlined"
                        dense={true}
                        style={{ width: "100%", backgroundColor: "#fff" }}
                        keyboardType="numeric"
                        placeholder="0"
                        textColor="black"
                        placeholderTextColor="#a1a1aa"
                        theme={{
                            colors: {
                            onSurfaceVariant: '#a1a1aa',
                            primary: '#2a7'
                        }
                        }}
                        value={targetSeger[oxide] ?? ""}
                        onChangeText={(text) => updateTargetSeger(oxide, text)}
                        />
                    </View>
                    ))}
                </View>
                </Card.Content>
            </Card>

            {/* 2. Choosing materials */}
            <Text variant="titleMedium" style={styles.subHeader}>{i18n.t("chosenMats")}</Text>
            <Text variant="bodyMedium" style={styles.hintText}>{i18n.t("chosenMatsInstr")}</Text>

            <Card style={styles.card}>
                <Card.Content>
                {selectedMaterials.length === 0 ? (
                    <Text style={styles.emptyText}>{i18n.t("matsNotChosen")}</Text>
                ) : (
                    selectedMaterials.map((m) => (
                    <View key={m.id} style={styles.row}>
                        <Text variant="bodyLarge" style={styles.materialName}>{m.name}</Text>
                        <IconButton
                        icon="close"
                        iconColor="#0f0d0d"
                        containerColor="#ff4444"
                        size={20}
                        onPress={() => toggleReverseMaterial(m)}
                        />
                    </View>
                    ))
                )}
                <PaperButton
                    mode="contained"
                    style={styles.paperButton}
                    onPress={() => setReverseModalVisible(true)}
                >
                    {i18n.t("chooseMats")}
                </PaperButton>
                </Card.Content>
            </Card>

            {/* 3. Calc button */}
            <View style={{ marginVertical: 15 }}>
                <PaperButton
                mode="contained"
                buttonColor="#2a7"
                onPress={runReverseCalculation}
                >
                {i18n.t("calcRecipe")}
                </PaperButton>
            </View>

            {/* 4. outcome */}
            {reverseError && <Text style={styles.errorText}>{reverseError}</Text>}

            {reverseResult && (
                <>
                <Text variant="titleMedium" style={styles.subHeader}>{i18n.t("calcRecipe")}</Text>
                <Card style={styles.card}>
                    <Card.Content>
                    {reverseResult.map((row, i) => {
                        const m = rawMaterialMap[row.raw_material_id];
                        return (
                        <View key={i} style={styles.resultRow}>
                            <Text variant="bodyLarge" style={styles.materialName}>
                            {m?.name ?? i18n.t("unknown")}
                            </Text>
                            <Text variant="titleMedium" style={styles.resultPerc}>
                            {row.amount_perc.toFixed(1)} %
                            </Text>
                        </View>
                        );
                    })}
                    </Card.Content>
                </Card>

                {reverseSeger && (
                    <>
                    <Text variant="titleMedium" style={styles.subHeader}>{i18n.t("realizedForm")}</Text>
                    <Card style={styles.card}>
                        <Card.Content>
                        <SegerGrid seger={reverseSeger} />
                        </Card.Content>
                    </Card>
                    </>
                )}
            </>
          )}
         <Modal visible={isReverseModalVisible} animationType="slide">
            <View style={styles.modalContainer}>
                <Text variant="headlineSmall" style={styles.header}>{i18n.t("chooseMatsToUse")}</Text>
                    <Text variant="bodyMedium" style={styles.hintText}>{i18n.t("canChooseMany")}</Text>
                    
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
                        buttonColor="green"
                        onPress={() => {
                        setReverseModalVisible(false);
                        setSearchQuery("");
                        }}
                        style={{ marginBottom: 15 }}
                    >
                        {i18n.t("done")}
                    </PaperButton>

                    <FlatList
                        data={filteredMaterials}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => {
                        const isSelected = !!selectedMaterials.find(
                            (m) => m.id === item.id,
                        );
                        return (
                            <List.Item
                            title={item.name}
                            titleStyle={{ color: "black"}}
                            onPress={() => toggleReverseMaterial(item)}
                            style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                            right={props => isSelected ? <List.Icon {...props} icon="check" color="green" /> : null}
                            />
                        );
                        }}
                    />
                 </View>
            </Modal>   
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    header: { 
        fontSize: 22, 
        fontWeight: "bold", 
        marginBottom: 15, 
        marginTop: 30, 
        color:"#050303" 
    },
 
    subHeader: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
        marginTop: 12,
        color:"black"
    },

    hintText: {
        fontSize: 13,
        color: "#180d0d",
        marginBottom: 8,
        fontStyle: "italic",
    },
    emptyText: { fontStyle: "italic", color: "#000000", marginBottom: 8 },
    errorText: { color: "red", marginBottom: 8, backgroundColor: "white", borderColor: "black", borderRadius: 5, padding: 20 },

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
    // Reciperow 
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

    // Seger table
    segerGroup: { marginBottom: 10 },
    segerGroupLabel: {
        fontSize: 13,
        color: "#050202",
        fontWeight: "600",
        marginBottom: 6,
    },

    grid: { 
        flexDirection: "row", 
        flexWrap: "wrap", 
        gap: 8 
    },

    gridItem: {
        width: "30%",
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ddd",
    },

    oxideName: { 
        fontWeight: "bold", 
        fontSize: 13, 
        color: "#000000" 
    },

    oxideValue: { 
        fontSize: 15, 
        color: "#007bff" 
    },

    // Seger input fields (reverse direction)
    oxideInputItem: {
        width: "30%",
        backgroundColor: "#fff",
        padding: 8,
        borderRadius: 5,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ddd",
        marginBottom: 8,
    },
    oxideInput: {
        borderBottomWidth: 1,
        borderColor: "#aaa",
        width: "100%",
        textAlign: "center",
        fontSize: 15,
        padding: 2,
    },

    // reverse direction result line
    resultRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderColor: "#eee",
    },
    resultPerc: { 
        fontSize: 15, 
        fontWeight: "bold", 
        color: "#2a7" 
    },

    // Modal
    modalContainer: { 
        flex: 1, 
        padding: 20, 
        marginTop: 40, 
        color:"black"},
    
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
    
    modalItemSelected: {  },
    
    modalItemText: { 
        fontSize: 17, 
        color: "black" 
    },
});