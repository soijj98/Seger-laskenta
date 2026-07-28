// Copyright (c) 2026 Saija Joronen
// Licensed under the MIT License.

import { StyleSheet, Text, View } from "react-native";
import { R2O3, RO2, RO_R2O } from "../lib/glaze-engine";
import i18n from "../lib/i18n/i18n";

interface Props {
  seger: Record<string, number>;
}

function SegerGrid({ seger }: { seger: Record<string, number> }) {
  // grouping oxides to the seger formulas traditional order
  const groups = [
    { label: i18n.t("segerGroupSmelter"), oxides: [...RO_R2O] },
    { label: i18n.t("SegerGroupStab"), oxides: [...R2O3] },
    { label: i18n.t("segerGroupGlass"), oxides: [...RO2] },
  ];

  return (
    <View>
      {groups.map((group) => (
        <View key={group.label} style={styles.segerGroup}>
          <Text style={styles.segerGroupLabel}>{group.label}</Text>
          <View style={styles.grid}>
            {group.oxides.map((oxide) => {
              const val = seger[oxide];
              if (!val || val < 0.0001) return null;
              return (
                <View key={oxide} style={styles.gridItem}>
                  <Text style={styles.oxideName}>{oxide.toUpperCase()}</Text>
                  <Text style={styles.oxideValue}>{val.toFixed(3)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Seger-table
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
});

export default SegerGrid;
