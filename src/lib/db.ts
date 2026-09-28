// Copyright (c) 2026 Saija Joronen
// Licensed under the MIT License.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import i18n from "./i18n/i18n";
import ingredientsSeed from "./raaka_aineet_seed.json";
import { supabase } from './supabase';

let db: SQLite.SQLiteDatabase | null = null;

if (Platform.OS !== "web") {
  db = SQLite.openDatabaseSync("glazes.db");
}

export const initDB = async () => {

  //Don't need this anymore because tables have been created at supabase's controlpanel


//   if (!db) return;

//   await db.execAsync(`
//             CREATE TABLE IF NOT EXISTS glazes (
//                 id INTEGER PRIMARY KEY AUTOINCREMENT,
//                 name TEXT NOT NULL,
//                 date TEXT NOT NULL,
//                 temperature INTEGER NOT NULL,
//                 archived INTEGER DEFAULT 0
//                 );
//             `);

//   await db.execAsync(`
//             CREATE TABLE IF NOT EXISTS ingredients (
//                 id INTEGER PRIMARY KEY AUTOINCREMENT,
//                 name TEXT NOT NULL,
//                 price REAL,
//                 g_mol REAL NOT NULL,
//                 li2o REAL DEFAULT 0,
//                 na2o REAL DEFAULT 0,
//                 k2o REAL DEFAULT 0,
//                 cao REAL DEFAULT 0,
//                 mgo REAL DEFAULT 0,
//                 bao REAL DEFAULT 0,
//                 sro REAL DEFAULT 0,
//                 zno REAL DEFAULT 0,
//                 pbo REAL DEFAULT 0,
//                 al2o3 REAL DEFAULT 0,
//                 fe2o3 REAL DEFAULT 0,
//                 b2o3 REAL DEFAULT 0,
//                 sio2 REAL DEFAULT 0,
//                 p2o5 REAL DEFAULT 0,
//                 tio2 REAL DEFAULT 0,
//                 mno2 REAL DEFAULT 0
//             );
//         `);
};


export const getDeviceId = async () => {
  let deviceId = await AsyncStorage.getItem('device_id');
  if (!deviceId) {
    // Luodaan satunnainen tunniste, esim. "guest-a1b2c3d4"
    deviceId = 'guest-' + Math.random().toString(36).substring(2, 15);
    await AsyncStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

export const seedIngredients = async () => {
  
  // checking if there is rows
  const { count, error } = await supabase
    .from('ingredients')
    .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(i18n.t("seedingError"), error);
      return;
    }

    if (count === 0) {
      console.log(i18n.t("seeding"));

      const dataToInsert = ingredientsSeed.map((item: any) => ({
          // Parsitaan id numeroksi (esim. "2" -> 2), jotta se mätsää Excelin riveihin
          id: parseInt(item.id, 10),
          name: item.nimi,
          price: item.hinta_kg || 0,
          g_mol: item.g_mol || 0,
          li2o: item.Li2O || 0,
          na2o: item.Na2O || 0,
          k2o: item.K2O || 0,
          cao: item.CaO || 0,
          mgo: item.MgO || 0,
          bao: item.BaO || 0,
          sro: item.SrO || 0,
          zno: item.ZnO || 0,
          pbo: item.PbO || 0,
          al2o3: item.Al2O3 || 0, 
          fe2o3: item.Fe2O3 || 0,
          b2o3: item.B2O3 || 0,
          sio2: item.SiO2 || 0,
          p2o5: item.P2O5 || 0,
          tio2: item.TiO2 || 0,
          mno2: item.MnO2 || 0,
        }));


        const { error: insertError } = await supabase
          .from('ingredients')
          .insert(dataToInsert);

          if (insertError) {
            console.error(i18n.t("seedingError"), insertError);
          } else {
            console.log(i18n.t("seedingSuccess"));
          }
        } else {
          console.log(`${i18n.t("alreadyInDb")} ${count} ${i18n.t("skippingSeeds")}`);
    }
};

export const getGlazes = async () => {
  const deviceId = await getDeviceId();
  const { data, error } = await supabase
    .from('glazes')
    .select('*')
    .eq('device_id', deviceId);

    if (error) {
      console.error('Virhe haettaessa lasitteita:', error);
      return [];
    }
    return data || [];
};


export const deleteGlazes = async (id: number) => {
  const deviceId = await getDeviceId();
  await supabase
    .from('glazes')
    .delete()
    .eq('id', id)
    .eq('device_id', deviceId);
};



export const archiveGlazes = async (id: number) => {
  const deviceId = await getDeviceId();
  await supabase
  .from('glazes')
  .update({ archived: true })
  .eq('id', id)
  .eq('device_id', deviceId);
};

export const deleteMultipleGlazes = async (ids: number[]) => {
  if (ids.length === 0) return;
  const deviceId = await getDeviceId();
  await supabase
  .from('glazes')
  .delete()
  .in('id', ids)
  .eq('device_id', deviceId);
};

export const addGlazes = async (name: string, date: string, temperature: number) => {
  const deviceId = await getDeviceId();
  await supabase
  .from('glazes')
  .insert([{ name, date, temperature, archived: false, device_id: deviceId }]);
};

export const saveGlazeRecipe = async (
  name: string,
  date: string,
  temperature: number,
  recipeRows: { raw_material_id: number; amount_perc: number }[]
  ) => {
    const deviceId = await getDeviceId();
    const { data: glazeData, error: glazeError } = await supabase
      .from('glazes')
      .insert([{ name, date, temperature, archived: false, device_id: deviceId }])
      .select('id')
      .single()

      if (glazeError) {
        console.error("Virhe lasitteiden tallennuksessa:", glazeError);
        return { error: glazeError };
      }

      const rowsToInsert = recipeRows.map(row => ({
        glaze_id: glazeData.id,
        raw_material_id: row.raw_material_id,
        amount_perc: row.amount_perc
      }));

      const { error: rowsError } = await supabase
        .from('recipe_rows')
        .insert(rowsToInsert)

        if (rowsError) {
          console.error("Virhe reseptirivien tallennuksessa: ", rowsError);
          return { error: rowsError };
        }

        return { success: true, glazeId: glazeData.id };
  }

export { db };

