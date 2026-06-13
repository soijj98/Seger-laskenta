import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Button, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { FlatList, Swipeable } from 'react-native-gesture-handler';
 
import { getGlazes, deleteGlazes, archiveGlazes, deleteMultipleGlazes, initDB, addGlazes, seedIngredients } from '../lib/db';

interface Glazes {
    id: number;
    name: string;
    date: string;
    temperature: number;
    archived: number
}


export default function GlazesScreen() {

    const [glazes, setGlazes] = useState<Glazes[]>([]);
    const [selectedId, setSelectedId] = useState<number[]>([]);

    const [newGlaze, setNewGlaze] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newTemperature, setNewTemperature] = useState('');

    const handleAddGlaze = async () => {

        if (!newGlaze) {
            Alert.alert('Error', 'Set name of glaze');
            return;
        }
        
        const dateToSave = newDate || '';
        const tempToSave = newTemperature ? parseInt(newTemperature, 10) : 0;

        await addGlazes(newGlaze, dateToSave, tempToSave);
        
        setNewGlaze('');
        setNewDate('');
        setNewTemperature('');
        loadData();
    };

    const loadData = async () => {

        try {
            await initDB();
            await seedIngredients();
        
            const data = await getGlazes() as Glazes[];
            setGlazes(data);
        } catch (error) {
            console.error("Database error:", error);
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
            'Hallitse lasitetta',                     //tee helposti kielen muutettavaksi
            'Haluatko poistaa lasitteen?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Archive', onPress: async () => {
                    await archiveGlazes(id);
                    loadData();
                    }
                },
                { text: 'Ok', onPress: async () => {
                    await deleteGlazes(id);
                    loadData();
                    }
                }
            ]
        );
    };

    const toggleSelection = (id: number) => {
        if (selectedId.includes(id)) {
            setSelectedId(selectedId.filter(selectedId => selectedId !== id));
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

    const sortData = (way: 'name' | 'date' | 'temperature') => {
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
            <TouchableOpacity style={styles.deleteSwipe} onPress={() => handleSwipeDelete(item.id)}>
                <Text style={{ color: 'white' }}>Delete</Text>
            </TouchableOpacity>
        );
    

        return (

            <Swipeable renderRightActions={renderRightActions}>
                <TouchableOpacity
                    style={[styles.row, isSelected && styles.selectedRow]}
                    onLongPress={() => handleLongPress(item.id)}
                    delayLongPress={500}
                >
                    <TouchableOpacity style={styles.checkbox} onPress={() => 
                        toggleSelection(item.id)}>
                            <Text>{isSelected ? '[X]' : '[ ]'}</Text>
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
                        placeholder="Glaze"
                        value={newGlaze}
                        onChangeText={setNewGlaze}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Date"
                        value={newDate}
                        onChangeText={setNewDate}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Temperature"
                        value={newTemperature}
                        onChangeText={setNewTemperature}
                        keyboardType="numeric"
                    />
                    <Button title="Add new glaze" onPress={handleAddGlaze} />   
                </ThemedView>



            <ThemedView style={styles.buttonRow}>
                <Button title="Name of glaze" onPress={() => sortData('name')} />
                {/*<Button title="Päivämäärä" onPress={() => sortData('date')} />*/}
                <Button title="Lämpötila" onPress={() => sortData('temperature')} />
            </ThemedView>

            {selectedId.length > 0 && (
                <Button title={`Poista valitut (${selectedId.length})`} color="red" onPress={handleDeleteSelected} />
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        height: 50
    },

    row: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        backgroundColor: '#fff',
        alignItems: 'center'
    },

    selectedRow: {
        backgroundColor: '#e0f7fa',

    },

    checkbox: {
        marginRight: 15,
        padding: 5
    },

    deleteSwipe: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: 20
    },

    formContainer: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderColor: '#ccc',
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 15
    },

    input: {
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10
    }

}); 