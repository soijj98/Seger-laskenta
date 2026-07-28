// Copyright (c) 2026 Saija Joronen
// Licensed under the MIT License.

import { Platform } from "react-native";

import { db, initDB, seedIngredients } from "../lib/db";
import ingredientSeed from "../lib/raaka_aineet_seed.json";

export interface RawMaterial {
  id: number;
  name: string;
  price: number;
  g_mol: number;
  li2o: number;
  na2o: number;
  k2o: number;
  cao: number;
  mgo: number;
  bao: number;
  sro: number;
  zno: number;
  pbo: number;
  al2o3: number;
  fe2o3: number;
  b2o3: number;
  sio2: number;
  p2o5: number;
  tio2: number;
  mno2: number;
}

export function useGlazeDb() {
  const getRawMaterials = async (): Promise<{
    data: RawMaterial[] | null;
    error: Error | null;
  }> => {
    try {
      // JSON-data for debugging on Web
      if (Platform.OS === "web") {
        const webData = ingredientSeed.map((item: any) => ({
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
        return { data: webData as RawMaterial[], error: null };
      }

      // SQLite-data for mobile
      if (!db) {
        throw new Error("Database not initialized");
      }

      await initDB();
      await seedIngredients();

      const result = await db.getAllAsync(
        "SELECT * FROM ingredients ORDER BY name ASC",
      );

      return { data: result as RawMaterial[], error: null };
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      return { data: null, error: error as Error }; // jos kaatuu, palautetaan error ja data on null
    }
  };

  return { getRawMaterials };
}
