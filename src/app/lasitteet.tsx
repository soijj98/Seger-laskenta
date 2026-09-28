import { useEffect, useState } from "react";
import { Alert, Modal, StyleSheet, View } from "react-native";
import { FlatList, Swipeable } from "react-native-gesture-handler";
import { Avatar, Card, IconButton, Button as PaperButton, TextInput as PaperTextInput, Text } from 'react-native-paper';
import { SafeAreaView } from "react-native-safe-area-context";

import { addGlazes, deleteGlazes, getGlazes, mergeGuestDataToUser } from "../lib/db";
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
  const [newGlaze, setNewGlaze] = useState("");


  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [selectedGlaze, setSelectedGlaze] = useState<Glazes | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<any[]>([]);


  const [user, setUser] = useState<any>(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
  }, [user]); 


  const handleAuth = async (isSignUp: boolean) => {
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        Alert.alert("Virhe rekisteröinnissä", error.message);
      } else if (data.user) {
        await mergeGuestDataToUser(data.user.id);
        Alert.alert("Tili luotu!", "Lasitteesi on tallennettu pilveen.");
        setAuthModalVisible(false);
        loadData();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert("Virhe kirjautumisessa", error.message);
      } else {
        setAuthModalVisible(false);
      }
    }
    setEmail("");
    setPassword("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthModalVisible(false);
  };

  // --- LASITTEIDEN HALLINTA ---
  const handleAddGlaze = async () => {
    if (!newGlaze) return Alert.alert(i18n.t("error"), i18n.t("glazeNamePlaceholder"));
    
    // Syötetään tyhjät arvot päivämäärälle ja lämpötilalle, jotta db.ts ei kaadu
    await addGlazes(newGlaze, "", 0);
    setNewGlaze("");
    loadData();
  };

  const handleSwipeDelete = async (id: number) => {
    await deleteGlazes(id);
    loadData();
  };

  const openRecipe = async (glaze: Glazes) => {
    setSelectedGlaze(glaze);
    setRecipeModalVisible(true);
    setRecipeDetails([]);

    const { data: rows } = await supabase.from('recipe_rows').select('*').eq('glaze_id', glaze.id);

    if (rows && rows.length > 0) {
      const { data: mats } = await supabase.from('ingredients').select('id, name');
      const matMap: Record<number, string> = {};
      mats?.forEach(m => matMap[m.id] = m.name);

      const enriched = rows.map(row => ({
        ...row,
        materialName: matMap[row.raw_material_id] || "Tuntematon raaka-aine"
      }));
      setRecipeDetails(enriched);
    }
  };

  const renderItem = ({ item }: { item: Glazes }) => {
    const renderRightActions = () => (
      <View style={styles.deleteSwipe}>
        <IconButton icon="trash-can" iconColor="#fff" onPress={() => handleSwipeDelete(item.id)} />
      </View>
    );

    return (
      <Swipeable renderRightActions={renderRightActions}>
        <Card style={styles.glazeCard} onPress={() => openRecipe(item)}>
          <Card.Title 
            title={item.name} 
            titleStyle={{ fontWeight: 'bold' }}
            right={(props) => <IconButton {...props} icon="chevron-right" />}
          />
        </Card>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.headerRow}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Omat Lasitteet</Text>
        <IconButton 
          icon="account-circle" 
          size={32} 
          iconColor={user ? "#2a7" : "#888"} 
          onPress={() => setAuthModalVisible(true)} 
        />
      </View>

      {/* PIKALISÄYS */}
      <Card style={styles.addCard}>
        <Card.Content style={styles.addRow}>
          <PaperTextInput
            mode="outlined"
            style={styles.addInput}
            placeholder={i18n.t("glazeNamePlaceholder")}
            value={newGlaze}
            onChangeText={setNewGlaze}
            dense
          />
          <PaperButton mode="contained" onPress={handleAddGlaze} buttonColor="#2a7" style={styles.addButton}>
            Lisää
          </PaperButton>
        </Card.Content>
      </Card>

      {/* LASITELISTA */}
      <FlatList
        data={glazes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <Modal visible={recipeModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.recipeModalContainer}>
            <Text variant="headlineSmall" style={styles.modalTitle}>{selectedGlaze?.name}</Text>
            
            {recipeDetails.length > 0 ? (
              recipeDetails.map((r, i) => (
                <View key={i} style={styles.recipeRow}>
                  <Text style={{ flex: 1, fontSize: 16 }}>{r.materialName}</Text>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{r.amount_perc} %</Text>
                </View>
              ))
            ) : (
              <Text style={{ marginBottom: 15, fontStyle: 'italic', color: '#666' }}>Tälle lasitteelle ei ole tallennettu reseptiä.</Text>
            )}
            
            <PaperButton mode="contained" style={{ marginTop: 20 }} onPress={() => setRecipeModalVisible(false)} buttonColor="#333">
              Sulje
            </PaperButton>
          </View>
        </View>
      </Modal>

      {/* MODAL: Signup / Login */}
      <Modal visible={authModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.recipeModalContainer}>
            {user ? (
              <View style={{ alignItems: 'center' }}>
                <Avatar.Icon size={64} icon="account" style={{ backgroundColor: '#2a7', marginBottom: 15 }} />
                <Text variant="titleMedium" style={{ marginBottom: 5 }}>Olet kirjautunut sisään</Text>
                <Text variant="bodyMedium" style={{ marginBottom: 20, color: '#666' }}>{user.email}</Text>
                <PaperButton mode="outlined" onPress={handleLogout} style={{ width: '100%', marginBottom: 10 }}>Kirjaudu ulos</PaperButton>
                <PaperButton mode="text" onPress={() => setAuthModalVisible(false)}>Sulje</PaperButton>
              </View>
            ) : (
              <View>
                <Text variant="headlineSmall" style={{ marginBottom: 15, color: 'black' }}>Pilvitallennus</Text>
                <Text variant="bodyMedium" style={{ marginBottom: 20, color: '#666' }}>
                  Kirjaudu sisään tai luo tili pitääksesi lasitteesi tallessa ja synkronoituna laitteiden välillä.
                </Text>
                <PaperTextInput mode="outlined" placeholder="Sähköposti" textColor="black" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={ styles.epInputs } />
                <PaperTextInput mode="outlined" placeholder="Salasana" textColor="black" value={password} onChangeText={setPassword} secureTextEntry style={ styles.epInputs} />
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                  <PaperButton mode="outlined" onPress={() => handleAuth(true)} style={{ flex: 1, marginRight: 5 }}>Luo tili</PaperButton>
                  <PaperButton mode="contained" onPress={() => handleAuth(false)} buttonColor="#2a7" style={{ flex: 1, marginLeft: 5 }}>Kirjaudu</PaperButton>
                </View>
                <PaperButton mode="text" onPress={() => setAuthModalVisible(false)} textColor="#888">Peruuta</PaperButton>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 15, 
    backgroundColor: "#f5f5f5" 
  },
  headerRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginTop: 10, 
    marginBottom: 15 
  },
  headerTitle: { 
    fontWeight: 'bold', 
    color: '#333' 
  },
  addCard: {
    marginBottom: 20, 
    backgroundColor: "#fff" 
  },
  addRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  epInputs:{
        padding: 2,
        borderRadius: 5,
        fontSize: 15,
        backgroundColor: "rgba(251, 255, 251, 0.66)",
        marginRight: 8,
        marginBottom: 10,
  },
  addInput: { 
    flex: 1, 
    marginRight: 10, 
    backgroundColor: '#fff' 
  },
  addButton: { 
    justifyContent: 'center' 
  },
  glazeCard: { 
    marginBottom: 10, 
    backgroundColor: '#fff' 
  },
  deleteSwipe: { 
    backgroundColor: "red", 
    justifyContent: "center", 
    alignItems: "flex-end", 
    marginBottom: 10, 
    borderRadius: 8, 
    paddingRight: 10 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 20 
  },
  recipeModalContainer: { 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 12, 
    elevation: 5 
  },
  modalTitle: { 
    fontWeight: 'bold', 
    marginBottom: 15, 
    color: 'black'
  },
  recipeRow: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    color: 'black', 
    borderColor: '#eee', 
    paddingVertical: 12 
  },

});