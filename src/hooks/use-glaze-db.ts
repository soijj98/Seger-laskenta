// Copyright (c) 2026 Saija Joronen
// Licensed under the MIT License.

import { db, initDB, seedIngredients } from "../lib/db";

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
