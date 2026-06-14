import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useGlazeDb, RawMaterial } from '../hooks/use-glaze-db';
import { calculateSeger, calcRecipe, ALL_OXIDES, RO_R2O, R2O3, RO2, RecipeRow, SegerFormula, buildRawMaterialMap } from '../lib/glaze-engine';


type Mode = 'forward' | 'reverse';

// apufunktio
// näytetään sekä normaali- että käänteissuunan tuloksessa

function SegerGrid({ seger }: { seger: Record<string, number> }) {
  // ryhmitellään oksidit Seger-kaavan perinteiseen järjestykseen
    const groups = [
    { label: 'RO / R₂O  (sulattajat, summa = 1)', oxides: [...RO_R2O] },
    { label: 'R₂O₃  (stabilisaattorit)', oxides: [...R2O3] },
    { label: 'RO₂  (lasiglaasit)', oxides: [...RO2] },
  ];

  return (
    <View>
      {groups.map(group => (
        <View key={group.label} style={styles.segerGroup}>
          <Text style={styles.segerGroupLabel}>{group.label}</Text>
          <View style={styles.grid}>
            {group.oxides.map(oxide => {
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


export default function CalculationScreen() {
    const { getRawMaterials } = useGlazeDb();

    // raaka-aineet tietokannasta
    const [materialsDb, setMaterialsDb] = useState<RawMaterial[]>([]);

    // aktiivinen tila: normaali- vai käänteissuunta
    const [mode, setMode] = useState<Mode>('forward');

    // ── Normaalisuunta: Resepti → Seger ──
    const [recipeRows, setRecipeRows] = useState<RecipeRow[]>([]);
    const [segerResult, setSegerResult] = useState<Record<string, number> | null>(null);
    const [forwardError, setForwardError] = useState<string | null>(null);

    // ── Käänteissuunta: Seger → Resepti ──
    // käytettävien Seger-arvot (tekstikenttinä, koska desimaalit)
    const [targetSeger, setTargetSeger] = useState<Record<string, string>>({});
    // raaka-aineet jotka käyttäjä on valinnut käytettäviksi käänteislaskussa 
    const [selectedMaterials, setSelectedMaterials] = useState<RawMaterial[]>([]);
    // käänteislaskennan tulos
    const [reverseResult, setReverseResult] = useState<RecipeRow[] | null>(null);
    const [reverseSeger, setReverseSeger] = useState<Record<string, number> | null>(null);
    const [reverseError, setReverseError] = useState<string | null>(null);

    // Modalit  
    const [isForwardModalVisible, setForwardModalVisible] = useState(false);
    const [isReverseModalVisible, setReverseModalVisible] = useState(false);
    
    // Raaka-ainelista mapiksi moottoria varten
    // useMemo estää uudelleen rakentamisen jokaisella renderöinnillä
    const rawMaterialMap = useMemo(() => buildRawMaterialMap(materialsDb), [materialsDb]);
    
    useEffect(() => {
      const load = async () => {
        const { data, error } = await getRawMaterials();
        if (data) setMaterialsDb(data);
        if (error) console.error("Error downloading materials: ", error);
      };
      load();
    }, []);


    // ---- normaalisuunta: lasketaan automaattisesti kun reseptirivit muuttuvat -----
  useEffect(() => {
    if (recipeRows.length === 0 && Object.keys(rawMaterialMap).length === 0) {
//      const materialMap: Record<number, RawMaterial> = {};
      setSegerResult(null);
      setForwardError(null);
      return;
    }
    const result = calculateSeger(recipeRows, rawMaterialMap);
    // Tallennetaan tulos vain, jos siinä ei ole virhettä (esim. liian vähän aineita)
    if (!result.error && result.seger) {
      setSegerResult(result.seger);
      setForwardError(null);
    } else {
      setSegerResult(null);
      setForwardError(result.error ?? null);
    }
  }, [recipeRows, rawMaterialMap]);



  // ------ Normaakisuunnan funktiot ----
  const addForwardMaterial = (material: RawMaterial) => {
    // raaka-aine reseptiin 0%:lla, käyttäjä syöttää määrän
    setRecipeRows(prev => [...prev, { raw_material_id: material.id, amount_perc: 0 }]);
    setForwardModalVisible(false);
  };

  const removeForwardRow = (index: number) => {
    setRecipeRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateForwardAmount = (text: string, index: number) => {

    // vaihdetaan pilkku pisteeksi (suomalainen näppäimistö)
    const amount_perc = parseFloat(text.replace(',', '.')) || 0; 
    setRecipeRows(prev => 
      prev.map((row, i) => i === index ? {...row, amount_perc} : row)
    );
  };

  // ─── Käänteissuunnan funktiot ───────────────────────────────────────────

  const updateTargetSeger = (oxide: string, text: string) => {
    setTargetSeger(prev => ({ ...prev, [oxide]: text }));
  };

  const toggleReverseMaterial = (material: RawMaterial) => {
    // Valitaan tai poistetaan raaka-aine käänteislaskun käytettävistä
    setSelectedMaterials(prev =>
      prev.find(m => m.id === material.id)
        ? prev.filter(m => m.id !== material.id)
        : [...prev, material]
    );
  };

  const runReverseCalculation = () => {
    // Rakennetaan SegerFormula-objekti käyttäjän syöttämistä arvoista
    const wantedSeger: SegerFormula = {};
    for (const oxide of ALL_OXIDES) {
      const val = parseFloat((targetSeger[oxide] ?? '').replace(',', '.'));
      wantedSeger[oxide] = isNaN(val) ? 0 : val;
    }

    const selectedIds = selectedMaterials.map(m => m.id);

    if (selectedIds.length === 0) {
      setReverseError('Valitse ensin raaka-aineet joita voidaan käyttää.');
      return;
    }

    const roSum = RO_R2O.reduce((s, o) => s + (wantedSeger[o] ?? 0), 0);
    if (roSum === 0) {
      setReverseError('Syötä ainakin yksi RO/R₂O-arvo (Ca, Na, K jne.).');
      return;
    }

    const result = calcRecipe(wantedSeger, selectedIds, rawMaterialMap);

    if (result.error || !result.rows) {
      setReverseError(result.error ?? 'Laskenta epäonnistui.');
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


      {/* TILA-VALINTA: kaksi nappia ylhäällä */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'forward' && styles.modeBtnActive]}
          onPress={() => setMode('forward')}
        >
          <Text style={[styles.modeBtnText, mode === 'forward' && styles.modeBtnTextActive]}>
            Resepti → Seger
          </Text>
        </TouchableOpacity>
      <TouchableOpacity
          style={[styles.modeBtn, mode === 'reverse' && styles.modeBtnActive]}
          onPress={() => setMode('reverse')}
        >
          <Text style={[styles.modeBtnText, mode === 'reverse' && styles.modeBtnTextActive]}>
            Seger → Resepti
          </Text>
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════
          NORMAALISUUNTA: Resepti → Seger */}
      
      {mode === 'forward' && (
        <ScrollView>
          <Text style={styles.subHeader}>Resepti</Text>

          <View style={styles.card}>
            {recipeRows.length === 0 ? (
              <Text style={styles.emptyText}>Resepti on tyhjä. Lisää raaka-aineita.</Text>
            ) : (
              recipeRows.map((row, index) => {
                const material = rawMaterialMap[row.raw_material_id];
                return (
                  <View key={index} style={styles.row}>
                    <Text style={styles.materialName}>
                      {material ? material.name : 'Tuntematon'}
                    </Text>
                    <TextInput 
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="Määrä %" 
                      onChangeText={text => updateForwardAmount(text, index)}
                    />
                    <TouchableOpacity onPress={() => removeForwardRow(index)} style={styles.deleteBtn}>
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
            <Button title="+ Lisää raaka-aine" onPress={() => setForwardModalVisible(true)} />
          </View>

          <Text style={styles.subHeader}>Laskettu Seger-kaava</Text>
          <View style={styles.card}>
            {forwardError ? (
              <Text style={styles.errorText}>{forwardError}</Text>
            ) : segerResult ? (
              <SegerGrid seger={segerResult} />
            ) : (
              <Text style={styles.emptyText}>
                Lisää raaka-aineita ja määrät nähdäksesi Seger-kaavan.
              </Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════
          KÄÄNTEISSUUNTA: Seger → Resepti */}
      {mode === 'reverse' && (
        <ScrollView>

          {/* 1. Haluttu Seger-kaava — syötetään oksidi kerrallaan */}
          <Text style={styles.subHeader}>Haluttu Seger-kaava</Text>
          <Text style={styles.hintText}>
            RO+R₂O summa normitetaan automaattisesti → 1. Syötä suhteet (esim. Ca=0.5, Na=0.3, K=0.2).
          </Text>

          <View style={styles.card}>
            {/* RO / R2O ryhmä */}
            <Text style={styles.segerGroupLabel}>RO / R₂O  (sulattajat)</Text>
            <View style={styles.grid}>
              {[...RO_R2O].map(oxide => (
                <View key={oxide} style={styles.oxideInputItem}>
                  <Text style={styles.oxideName}>{oxide.toUpperCase()}</Text>
                  <TextInput
                    style={styles.oxideInput}
                    keyboardType="numeric"
                    placeholder="0"
                    value={targetSeger[oxide] ?? ''}
                    onChangeText={text => updateTargetSeger(oxide, text)}
                  />
                </View>
              ))}
            </View>

                          {/* R2O3 ryhmä */}
            <Text style={styles.segerGroupLabel}>R₂O₃  (stabilisaattorit)</Text>
            <View style={styles.grid}>
              {[...R2O3].map(oxide => (
                <View key={oxide} style={styles.oxideInputItem}>
                  <Text style={styles.oxideName}>{oxide.toUpperCase()}</Text>
                  <TextInput
                    style={styles.oxideInput}
                    keyboardType="numeric"
                    placeholder="0"
                    value={targetSeger[oxide] ?? ''}
                    onChangeText={text => updateTargetSeger(oxide, text)}
                  />
                </View>
              ))}
            </View>

            {/* RO2 ryhmä */}
            <Text style={styles.segerGroupLabel}>RO₂  (lasiglaasit)</Text>
            <View style={styles.grid}>
              {[...RO2].map(oxide => (
                <View key={oxide} style={styles.oxideInputItem}>
                  <Text style={styles.oxideName}>{oxide.toUpperCase()}</Text>
                  <TextInput
                    style={styles.oxideInput}
                    keyboardType="numeric"
                    placeholder="0"
                    value={targetSeger[oxide] ?? ''}
                    onChangeText={text => updateTargetSeger(oxide, text)}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* 2. Valitaan käytettävät raaka-aineet */}
          <Text style={styles.subHeader}>Käytettävät raaka-aineet</Text>
          <Text style={styles.hintText}>
            Valitse mitkä raaka-aineet laskuri saa käyttää. Mitä enemmän valitset, sitä parempi tulos.
          </Text>

          <View style={styles.card}>
            {selectedMaterials.length === 0 ? (
              <Text style={styles.emptyText}>Ei raaka-aineita valittu.</Text>
            ) : (
              selectedMaterials.map(m => (
                <View key={m.id} style={styles.row}>
                  <Text style={styles.materialName}>{m.name}</Text>
                  <TouchableOpacity onPress={() => toggleReverseMaterial(m)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <Button title="+ Valitse raaka-aineet" onPress={() => setReverseModalVisible(true)} />
          </View>

          {/* 3. Laske-nappi */}
          <View style={{ marginVertical: 10 }}>
            <Button title="Laske resepti" color="#2a7" onPress={runReverseCalculation} />
          </View>

          {/* 4. Tulokset */}
          {reverseError && (
            <Text style={styles.errorText}>{reverseError}</Text>
          )}

          {reverseResult && (
            <>
              <Text style={styles.subHeader}>Laskettu resepti</Text>
              <View style={styles.card}>
                {reverseResult.map((row, i) => {
                  const m = rawMaterialMap[row.raw_material_id];
                  return (
                    <View key={i} style={styles.resultRow}>
                      <Text style={styles.materialName}>{m?.name ?? 'Tuntematon'}</Text>
                      <Text style={styles.resultPerc}>{row.amount_perc.toFixed(1)} %</Text>
                    </View>
                  );
                })}
              </View>

              {reverseSeger && (
                <>
                  <Text style={styles.subHeader}>Toteutunut Seger-kaava</Text>
                  <View style={styles.card}>
                    <SegerGrid seger={reverseSeger} />
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* ── MODAL: Raaka-aineen valinta (normaalisuunta) ── */}
      <Modal visible={isForwardModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.header}>Valitse raaka-aine</Text>
          <Button title="Peruuta" color="red" onPress={() => setForwardModalVisible(false)} />
          <FlatList
            data={materialsDb}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => addForwardMaterial(item)}>
                <Text style={styles.modalItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* ── MODAL: Raaka-aineen valinta (käänteissuunta, monivalinta) ── */}
      <Modal visible={isReverseModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.header}>Valitse käytettävät raaka-aineet</Text>
          <Text style={styles.hintText}>Voit valita useita.</Text>
          <Button title="Valmis" color="green" onPress={() => setReverseModalVisible(false)} />
          <FlatList
            data={materialsDb}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => {
              const isSelected = !!selectedMaterials.find(m => m.id === item.id);
              return (
                <TouchableOpacity
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => toggleReverseMaterial(item)}
                >
                  <Text style={styles.modalItemText}>
                    {isSelected ? '✓ ' : '   '}{item.name}
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
   container: { flex: 1, padding: 15, backgroundColor: '#fff' },

  // Tila-valintanapit ylhäällä
  modeRow: { flexDirection: 'row', marginTop: 30, marginBottom: 15, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#2a7' },
  modeBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#fff' },
  modeBtnActive: { backgroundColor: '#2a7' },
  modeBtnText: { fontWeight: 'bold', color: '#2a7' },
  modeBtnTextActive: { color: '#fff' },

  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, marginTop: 30 },
  subHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, marginTop: 12 },
  hintText: { fontSize: 13, color: '#666', marginBottom: 8, fontStyle: 'italic' },
  emptyText: { fontStyle: 'italic', color: '#888', marginBottom: 8 },
  errorText: { color: 'red', marginBottom: 8 },

  // Kortti-pohja osioille
  card: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#e0e0e0' },

  // Reseptirivi (normaalisuunta)
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  materialName: { flex: 2, fontSize: 15 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5, backgroundColor: '#fff', marginRight: 8 },
  deleteBtn: { backgroundColor: '#ff4444', padding: 10, borderRadius: 5 },
  deleteBtnText: { color: '#fff', fontWeight: 'bold' },

  // Seger-taulukko
  segerGroup: { marginBottom: 10 },
  segerGroupLabel: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '30%', backgroundColor: '#fff', padding: 10, borderRadius: 5, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  oxideName: { fontWeight: 'bold', fontSize: 13, color: '#333' },
  oxideValue: { fontSize: 15, color: '#007bff' },

  // Seger-syöttökentät (käänteissuunta)
  oxideInputItem: { width: '30%', backgroundColor: '#fff', padding: 8, borderRadius: 5, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', marginBottom: 8 },
  oxideInput: { borderBottomWidth: 1, borderColor: '#aaa', width: '100%', textAlign: 'center', fontSize: 15, padding: 2 },

  // Käänteissuunnan tulosrivi
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#eee' },
  resultPerc: { fontSize: 15, fontWeight: 'bold', color: '#2a7' },

  // Modal
  modalContainer: { flex: 1, padding: 20, marginTop: 40 },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemSelected: { backgroundColor: '#e8f5e9' },
  modalItemText: { fontSize: 17 },

})