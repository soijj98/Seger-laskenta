import * as SQLite from 'expo-sqlite';

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
    const db = SQLite.openDatabaseSync('glazes.db');

    const getRawMaterials = async (): Promise<{ data: RawMaterial[] | null; error: Error | null }> => {
        try {  
            const result = await db.getAllAsync('SELECT * FROM ingredients BY name ASC');
        
            return { data: result as RawMaterial[], error: null };
        } catch (error) {
            console.error("Error fetching raw materials:", error)
            return { data: null, error: error as Error }; // jos kaatuu, palautetaan error ja data on null 
        }
    };
    
    return { getRawMaterials };
}
