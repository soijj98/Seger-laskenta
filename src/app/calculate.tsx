import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useGlazeDb, RawMaterial } from '../hooks/use-glaze-db';
import { calcSeger, RecipeRow, ALL_OXIDES, RO_R2O } from '../lib/glaze-engine';


export default function CalculationScreen() {
    
}