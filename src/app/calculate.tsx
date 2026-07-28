import { useEffect, useMemo, useState } from "react";
import {
  Button,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RawMaterial, useGlazeDb } from "../hooks/use-glaze-db";
import {
  ALL_OXIDES,
  R2O3,
  RO2,
  RO_R2O,
  RecipeRow,
  SegerFormula,
  buildRawMaterialMap,
  calcRecipe,
  calculateSeger,
} from "../lib/glaze-engine";
import i18n from "../lib/i18n/i18n";

import SegerGrid from "../components/seger-table";

type Mode = "forward" | "reverse";

// apufunktio
// näytetään sekä normaali- että käänteissuunan tuloksessa

// segerGrid siirretty

export default function CalculationScreen() {
  const { getRawMaterials } = useGlazeDb();

  // raw materials from database
  const [materialsDb, setMaterialsDb] = useState<RawMaterial[]>([]);

  // active mode: normal or reverse
  const [mode, setMode] = useState<Mode>("forward");

  // ── Normal mode: Recipe → Seger ──
  const [recipeRows, setRecipeRows] = useState<RecipeRow[]>([]);
  const [segerResult, setSegerResult] = useState<Record<string, number> | null>(
    null,
  );
  const [forwardError, setForwardError] = useState<string | null>(null);

  // ── reverse direction: Seger → Recipe ──
  // used seger values (text input because decimals)
  const [targetSeger, setTargetSeger] = useState<Record<string, string>>({});

  // raw materials which user have chosen to be used in the reverse calculation
  const [selectedMaterials, setSelectedMaterials] = useState<RawMaterial[]>([]);

  // The result of reverse calculation
  const [reverseResult, setReverseResult] = useState<RecipeRow[] | null>(null);
  const [reverseSeger, setReverseSeger] = useState<Record<
    string,
    number
  > | null>(null);

  const [reverseError, setReverseError] = useState<string | null>(null);

  // Modals
  const [isForwardModalVisible, setForwardModalVisible] = useState(false);
  const [isReverseModalVisible, setReverseModalVisible] = useState(false);

  // Raw material list for the engine
  // useMemo prevents recalculation on every render
  const rawMaterialMap = useMemo(
    () => buildRawMaterialMap(materialsDb),
    [materialsDb],
  );

  useEffect(() => {
    const load = async () => {
      const { data, error } = await getRawMaterials();
      if (data) setMaterialsDb(data);
      if (error) console.error("Error downloading materials: ", error);
    };
    load();
  }, []);

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

  // ─── Reverse direction functions  ───────────────────────────────────────────

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

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* State option: two buttons at top */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === "forward" && styles.modeBtnActive]}
          onPress={() => setMode("forward")}
        >
          <Text
            style={[
              styles.modeBtnText,
              mode === "forward" && styles.modeBtnTextActive,
            ]}
          >
            {i18n.t("RecToSeg")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === "reverse" && styles.modeBtnActive]}
          onPress={() => setMode("reverse")}
        >
          <Text
            style={[
              styles.modeBtnText,
              mode === "reverse" && styles.modeBtnTextActive,
            ]}
          >
            {i18n.t("SegToRec")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════
          Normal mode: Recipe → Seger */}

      {mode === "forward" && (
        <ScrollView>
          <Text style={styles.subHeader}>{i18n.t("Recipe")}</Text>

          <View style={styles.card}>
            {recipeRows.length === 0 ? (
              <Text style={styles.emptyText}>{i18n.t("addMat")}</Text>
            ) : (
              recipeRows.map((row, index) => {
                const material = rawMaterialMap[row.raw_material_id];
                return (
                  <View key={index} style={styles.row}>
                    <Text style={styles.materialName}>
                      {material ? material.name : i18n.t("unknown")}
                    </Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder={i18n.t("amount")}
                      onChangeText={(text) => updateForwardAmount(text, index)}
                    />
                    <TouchableOpacity
                      onPress={() => removeForwardRow(index)}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
            <Button
              title={i18n.t("plusMat")}
              onPress={() => setForwardModalVisible(true)}
            />
          </View>

          <Text style={styles.subHeader}>{i18n.t("calculatedSeger")}</Text>
          <View style={styles.card}>
            {forwardError ? (
              <Text style={styles.errorText}>{forwardError}</Text>
            ) : segerResult ? (
              <SegerGrid seger={segerResult} />
            ) : (
              <Text style={styles.emptyText}>{i18n.t("addMatForSeger")}</Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════
          Reverse direction: Seger → Recipe */}
      {mode === "reverse" && (
        <ScrollView>
          {/* 1. Wanted Seger formula — entered into the formula one oxide at a time*/}
          <Text style={styles.subHeader}>{i18n.t("targetSeger")}</Text>
          <Text style={styles.hintText}>{i18n.t("instructionsSeger")}</Text>

          <View style={styles.card}>
            {/* RO / R2O group */}
            <Text style={styles.segerGroupLabel}>
              {i18n.t("segerGroupSmelter")}
            </Text>
            <View style={styles.grid}>
              {[...RO_R2O].map((oxide) => (
                <View key={oxide} style={styles.oxideInputItem}>
                  <Text style={styles.oxideName}>{oxide.toUpperCase()}</Text>
                  <TextInput
                    style={styles.oxideInput}
                    keyboardType="numeric"
                    placeholder="0"
                    value={targetSeger[oxide] ?? ""}
                    onChangeText={(text) => updateTargetSeger(oxide, text)}
                  />
                </View>
              ))}
            </View>

            {/* R2O3 group */}
            <Text style={styles.segerGroupLabel}>
              {i18n.t("segerGroupStab")}
            </Text>
            <View style={styles.grid}>
              {[...R2O3].map((oxide) => (
                <View key={oxide} style={styles.oxideInputItem}>
                  <Text style={styles.oxideName}>{oxide.toUpperCase()}</Text>
                  <TextInput
                    style={styles.oxideInput}
                    keyboardType="numeric"
                    placeholder="0"
                    value={targetSeger[oxide] ?? ""}
                    onChangeText={(text) => updateTargetSeger(oxide, text)}
                  />
                </View>
              ))}
            </View>

            {/* RO2 group */}
            <Text style={styles.segerGroupLabel}>
              {i18n.t("segerGroupGlass")}
            </Text>
            <View style={styles.grid}>
              {[...RO2].map((oxide) => (
                <View key={oxide} style={styles.oxideInputItem}>
                  <Text style={styles.oxideName}>{oxide.toUpperCase()}</Text>
                  <TextInput
                    style={styles.oxideInput}
                    keyboardType="numeric"
                    placeholder="0"
                    value={targetSeger[oxide] ?? ""}
                    onChangeText={(text) => updateTargetSeger(oxide, text)}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* 2. Choosing materials */}
          <Text style={styles.subHeader}>{i18n.t("chosenMats")}</Text>
          <Text style={styles.hintText}>{i18n.t("chosenMatsInstr")}</Text>

          <View style={styles.card}>
            {selectedMaterials.length === 0 ? (
              <Text style={styles.emptyText}>{i18n.t("matsNotChosen")}</Text>
            ) : (
              selectedMaterials.map((m) => (
                <View key={m.id} style={styles.row}>
                  <Text style={styles.materialName}>{m.name}</Text>
                  <TouchableOpacity
                    onPress={() => toggleReverseMaterial(m)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <Button
              title={i18n.t("chooseMats")}
              onPress={() => setReverseModalVisible(true)}
            />
          </View>

          {/* 3. Calc button */}
          <View style={{ marginVertical: 10 }}>
            <Button
              title={i18n.t("calcRecipe")}
              color="#2a7"
              onPress={runReverseCalculation}
            />
          </View>

          {/* 4. outcome */}
          {reverseError && <Text style={styles.errorText}>{reverseError}</Text>}

          {reverseResult && (
            <>
              <Text style={styles.subHeader}>{i18n.t("calcRecipe")}</Text>
              <View style={styles.card}>
                {reverseResult.map((row, i) => {
                  const m = rawMaterialMap[row.raw_material_id];
                  return (
                    <View key={i} style={styles.resultRow}>
                      <Text style={styles.materialName}>
                        {m?.name ?? i18n.t("unknown")}
                      </Text>
                      <Text style={styles.resultPerc}>
                        {row.amount_perc.toFixed(1)} %
                      </Text>
                    </View>
                  );
                })}
              </View>

              {reverseSeger && (
                <>
                  <Text style={styles.subHeader}>{i18n.t("realizedForm")}</Text>
                  <View style={styles.card}>
                    <SegerGrid seger={reverseSeger} />
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* ── MODAL: Choosing materials (normal mode)── */}
      <Modal visible={isForwardModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.header}>{i18n.t("chooseMat")}</Text>
          <Button
            title={i18n.t("cancel")}
            color="red"
            onPress={() => setForwardModalVisible(false)}
          />
          <FlatList
            data={materialsDb}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => addForwardMaterial(item)}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* ── MODAL: choosing materials (reverse direction, multiple-choice) ── */}
      <Modal visible={isReverseModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.header}>{i18n.t("chooseMatsToUse")}</Text>
          <Text style={styles.hintText}>{i18n.t("canChooseMany")}</Text>
          <Button
            title={i18n.t("done")}
            color="green"
            onPress={() => setReverseModalVisible(false)}
          />
          <FlatList
            data={materialsDb}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const isSelected = !!selectedMaterials.find(
                (m) => m.id === item.id,
              );
              return (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    isSelected && styles.modalItemSelected,
                  ]}
                  onPress={() => toggleReverseMaterial(item)}
                >
                  <Text style={styles.modalItemText}>
                    {isSelected ? "✓ " : "   "}
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },

  // status buttons
  modeRow: {
    flexDirection: "row",
    marginTop: 30,
    marginBottom: 15,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2a7",
  },
  modeBtn: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modeBtnActive: { backgroundColor: "#2a7" },
  modeBtnText: { fontWeight: "bold", color: "#2a7" },
  modeBtnTextActive: { color: "#fff" },

  header: { fontSize: 22, fontWeight: "bold", marginBottom: 15, marginTop: 30 },
  subHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 12,
  },
  hintText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    fontStyle: "italic",
  },
  emptyText: { fontStyle: "italic", color: "#888", marginBottom: 8 },
  errorText: { color: "red", marginBottom: 8 },

  // Card base for sections
  card: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  // Reciperow (normal mode)
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  materialName: { flex: 2, fontSize: 15 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 5,
    backgroundColor: "#fff",
    marginRight: 8,
  },
  deleteBtn: { backgroundColor: "#ff4444", padding: 10, borderRadius: 5 },
  deleteBtnText: { color: "#fff", fontWeight: "bold" },

  // Seger table
  segerGroup: { marginBottom: 10 },
  segerGroupLabel: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
    marginBottom: 6,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gridItem: {
    width: "30%",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  oxideName: { fontWeight: "bold", fontSize: 13, color: "#333" },
  oxideValue: { fontSize: 15, color: "#007bff" },

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
  resultPerc: { fontSize: 15, fontWeight: "bold", color: "#2a7" },

  // Modal
  modalContainer: { flex: 1, padding: 20, marginTop: 40 },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  modalItemSelected: { backgroundColor: "#e8f5e9" },
  modalItemText: { fontSize: 17 },
});
