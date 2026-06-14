import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useGlazeDb, RawMaterial } from '../hooks/use-glaze-db';
import { calculateSeger, ALL_OXIDES, RO_R2O, RecipeRow, buildRawMaterialMap } from '../lib/glaze-engine';


export default function CalculationScreen() {
    const { getRawMaterials } = useGlazeDb();

    const [materialsDb, setMaterialsDb] = useState<RawMaterial[]>([]);
    const [recipeRows, setRecipeRows] = useState<RecipeRow[]>([]);
    const [segerResult, setSegerResult] = useState<Record<string, number> | null>(null);
    const [errorMessage, setErrorMessage] = useState<String | null>(null);

    const [isModalVisible, setModalVisible] = useState(false);

    // Raaka-ainelista mapiksi moottoria varten
    // useMemo estää uudelleen rakentamisen jokaisella renderöinnillä

    const rawMaterialMap = useMemo(() => buildRawMaterialMap(materialsDb), [materialsDb]);
    
    useEffect(() => {
      const loadMaterials = async () => {
        const { data, error } = await getRawMaterials();
        if (data) setMaterialsDb(data);
        if (error) console.error("Error downloading materials: ", error);
      };
      loadMaterials();
    }, []);

  useEffect(() => {
    if (recipeRows.length > 0 && Object.keys(rawMaterialMap).length > 0) {
      const materialMap: Record<number, RawMaterial> = {};

      const result = calculateSeger(recipeRows, rawMaterialMap);
      // Tallennetaan tulos vain, jos siinä ei ole virhettä (esim. liian vähän aineita)
      if (!result.error && result.seger) {
        setSegerResult(result.seger);
        setErrorMessage(null);
      } else {
        setSegerResult(null);
        setErrorMessage(result.error || null);
      }
    } else {
      setSegerResult(null);
      setErrorMessage(null);
    }
  }, [recipeRows, rawMaterialMap]);


  const addMaterialToRecipe = (material: RawMaterial) => {
    setRecipeRows([...recipeRows, { raw_material_id: material.id, amount_perc: 0 }]);
    setModalVisible(false);
  };

  const removeRow = (indexToRemove: number) => {
    setRecipeRows(recipeRows.filter((_, index) => index !== indexToRemove));
  };

  const updateAmount = (text: string, indexToUpdate: number) => {
    const amount_perc = parseFloat(text.replace(',', '.')) || 0; 
  
    const updatedRows = recipeRows.map((row, index) => {
      if (index === indexToUpdate) 
        return {
          ...row,
          amount_perc
        }; return row;
      
      });
      setRecipeRows(updatedRows);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lasitelaskuri (Resepti → Seger)</Text>

      {/* RAAKA-AINEIDEN LISTAUS */}
      <View style={styles.recipeContainer}>
        {recipeRows.length === 0 ? (
          <Text style={styles.emptyText}>Resepti on tyhjä. Lisää raaka-aineita.</Text>
        ) : (
          recipeRows.map((row, index) => {
            const material = rawMaterialMap[row.raw_material_id];

            return (

            <View key={index} style={styles.row}>
              <Text style={styles.materialName}>{material ? material.name : 'Tuntematon'}</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Määrä %"
                onChangeText={(text) => updateAmount(text, index)}
              />
              <TouchableOpacity onPress={() => removeRow(index)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>X</Text>
              </TouchableOpacity>
            </View>
          );
        })  
      )}
        <Button title="+ Lisää raaka-aine" onPress={() => setModalVisible(true)} />
      </View>

      {/* SEGER-KAAVAN TULOSTUS */}
      <View style={styles.resultContainer}>
        <Text style={styles.subHeader}>Laskettu Seger-kaava:</Text>
        
        {errorMessage ? (
          <Text style={styles.emptyText}>{errorMessage}</Text>
        ) : segerResult ? ( 
          <View style={styles.grid}>
            {ALL_OXIDES.map(oxide => {
              if (segerResult[oxide] > 0) {
                return (
                  <View key={oxide} style={styles.gridItem}>
                    <Text style={styles.oxideName}>{oxide.toUpperCase()}</Text>
                    <Text style={styles.oxideValue}>{segerResult[oxide].toFixed(3)}</Text>
                  </View>
                );
              }
              return null;
            })}
          </View>
        ) : (
            <Text style={styles.emptyText}>Lisää sulattajia (RO/R2O) nähdäksesi tuloksen.</Text>
          )}          
       
      </View>

      {/* RAAKA-AINEEN VALINTAIKKUNA (MODAL) */}
      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.header}>Valitse raaka-aine</Text>
          <Button title="Peruuta" color="red" onPress={() => setModalVisible(false)} />
          <FlatList
            data={materialsDb}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => addMaterialToRecipe(item)}>
                <Text style={styles.modalItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 15, 
    backgroundColor: '#fff' 
  },

  header: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    marginTop: 30 
  },

  subHeader: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  
  emptyText: { fontStyle: 'italic', color: '#666', marginBottom: 10 },
  
  recipeContainer: { marginBottom: 20, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  materialName: { flex: 2, fontSize: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5, backgroundColor: '#fff', marginRight: 10 },
  deleteBtn: { backgroundColor: '#ff4444', padding: 10, borderRadius: 5 },
  deleteBtnText: { color: '#fff', fontWeight: 'bold' },

  resultContainer: { flex: 1, padding: 10, backgroundColor: '#eef2f5', borderRadius: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '30%', backgroundColor: '#fff', padding: 10, marginBottom: 10, borderRadius: 5, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  oxideName: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  oxideValue: { fontSize: 16, color: '#007bff' },

  modalContainer: { flex: 1, padding: 20, marginTop: 40 },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemText: { fontSize: 18 },


})