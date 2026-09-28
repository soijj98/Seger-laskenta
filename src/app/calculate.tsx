import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, } from "react-native";
import { Button as PaperButton, TextInput } from "react-native-paper";
import { RawMaterial, useGlazeDb } from "../hooks/use-glaze-db";
import { buildRawMaterialMap } from "../lib/glaze-engine";
import i18n from "../lib/i18n/i18n";

import ForwardMode from "@/components/forward-mode";
import ReverseMode from "@/components/reverse-mode";

import * as Sentry from '@sentry/react-native';



type Mode = "forward" | "reverse";

export default function CalculationScreen() {
  const { getRawMaterials } = useGlazeDb();
  // raw materials from database
  const [materialsDb, setMaterialsDb] = useState<RawMaterial[]>([]);
  // active mode: normal or reverse
  const [mode, setMode] = useState<Mode>("forward");
  
  //palaute textinput
  const [ palaute, setPalaute ] = useState<string>("");
  const [ naytaLomake, setNaytaLomake ] = useState<boolean>(false);

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

  // --- Bug function --- //

  const handleBugReport = () => {
    Sentry.captureMessage(`Käyttäjän ilmoitus: ${palaute}`, {
      level: 'warning', // Voit luokitella viestin (info, warning, error)
    });
  
    alert("Kiitos palautteesta! Bugi on kirjattu.");
    setPalaute('');
    setNaytaLomake(false);
  };
  
  const peruuta = () => {
    setPalaute('');
    setNaytaLomake(false);
  };

  return (
    <View style={styles.container}>
      {/* State option: two buttons at top */}

      <View style={styles.bugReportSection}>
        {!naytaLomake ? (
          // Tila A: Näytetään vain avausnappi
          <PaperButton mode="outlined" onPress={() => setNaytaLomake(true)}>
            Huomasitko bugin?
          </PaperButton>
        ) : (
          // Tila B: Näytetään tekstikenttä ja napit
          <View>
            <Text style={styles.bugTitle}>Mitä tapahtui ja miten sen voi toistaa?</Text>
            <TextInput

              placeholder="Kirjoita tähän..."
              multiline={true}
              numberOfLines={4}
              value={palaute}
              onChangeText={setPalaute}
              style={styles.input}
            />
            
            <View style={styles.buttonRow}>
              <PaperButton onPress={peruuta}>Peruuta</PaperButton>
              <PaperButton 
                mode="contained" 
                onPress={handleBugReport} 
                disabled={palaute.trim().length === 0}
              >
                Lähetä
              </PaperButton>
            </View>
        </View>
        )}
      </View>

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

      {mode === "forward" ? (
        <ForwardMode materialsDb={materialsDb} rawMaterialMap={rawMaterialMap} />
      ) : (
        <ReverseMode materialsDb={materialsDb} rawMaterialMap={rawMaterialMap} />
      )}
    </View>
  );
}  


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 15, 
    backgroundColor: "#fff" 
  },
  
  bugReportSection: {
    marginTop: 40,
    paddingTop: 20,

  },

  bugTitle: {
    marginBottom: 10,
    color: '#020101',
  },

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

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },

  // status buttons
  modeRow: {
    flexDirection: "row",
    marginTop: 30,
    marginBottom: 15,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgb(2, 8, 0)",

  },
  modeBtn: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modeBtnActive: { backgroundColor: "rgb(65, 114, 69)" },
  modeBtnText: { fontWeight: "bold", color: "rgb(65, 114, 69)" },
  modeBtnTextActive: { color: "#fff" },

  
  paperButton: 
  {
    margin: 10,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 15
  },

  searchInput:
  {
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

// muistiin tämä
// const shadowStyle = {
//   shadowColor: "#000",
//   shadowOffset: { width: 0, height: 2 },
//   shadowOpacity: 0.1,
//   shadowRadius: 3,
//   elevation: 3,
// };

// const styles = StyleSheet.create({
//   card: {
//     ...shadowStyle,
//     backgroundColor: "#fff",
//     // muut tyylit...
//   },
//   modeBtn: {
//     ...shadowStyle,
//     // muut tyylit...
//   }
// });