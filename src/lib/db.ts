import * as SQLite from 'expo-sqlite';

import ingredientsSeed from './raaka_aineet_seed.json';

const db = SQLite.openDatabaseSync('glazes.db');

export const initDB = async () => {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS glazes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            temperature INTEGER NOT NULL,
            archived INTEGER DEFAULT 0
            );
        `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL,
            g_mol REAL NOT NULL,
            li2o REAL DEFAULT 0,
            na2o REAL DEFAULT 0,
            k2o REAL DEFAULT 0,
            cao REAL DEFAULT 0,
            mgo REAL DEFAULT 0,
            bao REAL DEFAULT 0,
            sro REAL DEFAULT 0,
            zno REAL DEFAULT 0,
            pbo REAL DEFAULT 0,
            al2o3 REAL DEFAULT 0,
            fe2o3 REAL DEFAULT 0,
            b2o3 REAL DEFAULT 0,
            sio2 REAL DEFAULT 0,
            p2o5 REAL DEFAULT 0,
            tio2 REAL DEFAULT 0,
            mno2 REAL DEFAULT 0
        );
    `);
};


export const seedIngredients = async () => {
    const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM ingredients'
    );
    console.log(result?.count)

    if (result && result.count === 0) {
        console.log('Seeding ingredients...');

        const statement = await db.prepareAsync(`
        INSERT INTO ingredients (
            id, name, price, g_mol, li2o, na2o, k2o, cao, mgo, bao, sro, zno, pbo, al2o3, fe2o3, b2o3, sio2, p2o5, tio2, mno2
        ) VALUES (
            $id, $name, $price, $g_mol, $li2o, $na2o, $k2o, $cao, $mgo, $bao, $sro, $zno, $pbo, $al2o3, $fe2o3, $b2o3, $sio2, $p2o5, $tio2, $mno2
        )
    `);
            
        try {
            await db.execAsync('BEGIN TRANSACTION');

            for (const item of ingredientsSeed) {
                await statement.executeAsync({
            // Parsitaan id numeroksi (esim. "2" -> 2), jotta se mätsää Excelin riveihin
                $id: parseInt(item.id, 10), 
                $name: item.nimi,
                $price: item.hinta_kg || 0,
                $g_mol: item.g_mol || 0,
                // Mapattaan isot ja pienet kirjaimet oikein (JSON avain -> SQL muuttuja)
                $li2o: item.Li2O || 0,
                $na2o: item.Na2O || 0,
                $k2o: item.K2O || 0,
                $cao: item.CaO || 0,
                $mgo: item.MgO || 0,
                $bao: item.BaO || 0,
                $sro: item.SrO || 0,
                $zno: item.ZnO || 0,
                $pbo: item.PbO || 0,
                $al2o3: item.Al2O3 || 0,
                $fe2o3: item.Fe2O3 || 0,
                $b2o3: item.B2O3 || 0,
                $sio2: item.SiO2 || 0,
                $p2o5: item.P2O5 || 0,
                $tio2: item.TiO2 || 0,
                $mno2: item.MnO2 || 0
                });
            }
        
            await db.execAsync('COMMIT');
            console.log("Ingredients seeded successfully.")
        } catch (error) {
            await db.execAsync('ROLLBACK');
            console.log("Error seeding ingredients:", error);

        } finally {
            await statement.finalizeAsync();
        }
    } else {
        console.log(`In database already has ${result?.count} ingredients. Skipping seeds.`);
    }
};


export const getGlazes = async () => {
    const allRows = await db.getAllAsync('SELECT * FROM glazes');
    return allRows;
};

export const deleteGlazes = async (id: number) => {
    await db.runAsync('DELETE FROM glazes WHERE id = ?', [id]);
};

export const archiveGlazes = async (id: number) => {
    await db.runAsync('UPDATE glazes SET archived = 1 WHERE id = ?', [id]);
};

export const deleteMultipleGlazes = async (ids: number[]) => {
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(`DELETE FROM glazes WHERE id IN (${placeholders})`, ids);
};

export const addGlazes = async (name: string, date: string, temperature: number) => {
    await db.runAsync(
        'INSERT INTO glazes (name, date, temperature) VALUES (?, ?, ?)',
        [name, date, temperature]
    );
};
