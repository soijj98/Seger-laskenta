import { Matrix, pseudoInverse } from 'ml-matrix';
import { RawMaterial } from '@/hooks/use-glaze-db';

export const RO_R2O = ['li2o', 'na2o', 'k2o', 'cao', 'mgo', 'bao', 'sro', 'zno', 'pbo'] as const;
export const R2O3   = ['al2o3', 'fe2o3'] as const;
export const RO2    = ['b2o3', 'sio2', 'p2o5', 'tio2', 'mno2'] as const;
export const ALL_OXIDES = [...RO_R2O, ...R2O3, ...RO2] as const;

export type OxideType = typeof ALL_OXIDES[number];
export type SegerFormula = Record<string, number>;

export interface RecipeRow {
    raw_material_id: number;
    amount_perc: number;
}


// 1. normaalisuunta: Resepti -> Seger

export function calcSeger(rows: RecipeRow[], rawMaterialMap: Record<number, RawMaterial>) {
    const moles: Record<string, number> = {};
    ALL_OXIDES.forEach(oxide => moles[oxide] = 0);

    for (const row of rows) {
        const ra = rawMaterialMap[row.raw_material_id];
        if (!ra || !ra.g_mol) continue;
        
        for (const oxide of ALL_OXIDES) {
            const oxideValue = ra[oxide as keyof RawMaterial];
            if (typeof oxideValue === 'number') {
                moles[oxide] += (row.amount_perc / ra.g_mol) * oxideValue;
            }
        }
    }

    const RO_sum = RO_R2O.reduce((sum, oxide) => sum + moles[oxide], 0);

    if (RO_sum === 0) {
        return { error: 'RO/R2O sum is zero --- recipe does not contain base oxide', seger: null };
    }

    const seger: SegerFormula = {};
    for (const oxide of ALL_OXIDES) {
        seger[oxide] = parseFloat((moles[oxide] / RO_sum).toFixed(4));
    }

    return {
        seger,
        moles,
        RO_sum,
        Al_Si_ratio: seger.al2o3 > 0 ? parseFloat((seger.sio2 / seger.al2o3).toFixed(4)) : null,
    };
}

// 2. Käänteissuunta: seger -> resepti (NNLS)

// matriisiyhtälö A * x = b
// A = raaka-aineiden oksidimatriisi (normitettu g_mollilla)
// x = raaka-ainemäärät (haetaan)
// b = haluttu seger-kaava


export function calcRecipe(
    wSeger: SegerFormula,
    usIdArr: number[],
    rawMaterialMap: Record<number, RawMaterial>
) {
    const ids = usIdArr.filter((id => rawMaterialMap[id]));

    if (ids.length === 0) {
        return { error: "Not any raw materials selected", rows: [] };
    }

    const nOxide = ALL_OXIDES.length;
    const nRawMaterials = ids.length;

    const Adata: number[][] = [];
    for (let i = 0; i < nOxide; i++) {
        const row: number[] = [];
        for (let j = 0; j < nRawMaterials; j++) {
            const ra = rawMaterialMap[ids[j]];
            const oxide = ALL_OXIDES[i];
            const oxideValue = ra[oxide as keyof RawMaterial] as number;
            row.push((oxideValue || 0) / ra.g_mol);
        }
        Adata.push(row);
    }

    const bData = ALL_OXIDES.map(oxide => wSeger[oxide] || 0);

    const A = new Matrix(Adata);
    const b = Matrix.columnVector(bData);

    const Apinv = pseudoInverse(A);
    let x = Apinv.mmul(b);

    x = nnlsRep(A, b, x, ids);

    const xArr = x.getColumn(0);
    const total = xArr.reduce((sum, val) => sum + Math.max(0, val), 0);

    if (total === 0) {
        return { error: 'Cannot find any solution with given materials', rows: [] };
    }

    const rows: RecipeRow[] = ids.map((id, j) => ({
        raw_material_id: id,
        amount_perc: Math.max(0, xArr[j] / total) * 100,
    }))
    .filter((r) => r.amount_perc > 0.01);

    const calculated = calcSeger(rows, rawMaterialMap);
    const resError = calculated.seger ? calcResError(wSeger, calculated.seger) : null;

    return {
        rows,
        calculatedSeger: calculated.seger,
        resError,
        totalPerc: rows.reduce((sum, row) => sum + row.amount_perc, 0),
    };
}

function nnlsRep(A: Matrix, b: Matrix, xBegi: Matrix, ids: number[]) {
    const n = ids.length;
    let active = Array.from({ length: n }, (_, i) => i);
    let x = xBegi;

    for (let iteration = 0; iteration < 20; iteration++) {
        const xArr = x.getColumn(0);
        const removing = xArr.map((val, i) => (val < 0 ? i : -1)).filter((i) => i >= 0);

        if (removing.length === 0) break;

        active = active.filter((_, i) => !removing.includes(i));
        if (active.length === 0) break;

        const Asub = new Matrix(A.to2DArray().map((row) => active.map((j) => row[j])));
        const Apinv = pseudoInverse(Asub);
        const xSub = Apinv.mmul(b);

        const xFull = new Array(n).fill(0);
        active.forEach((origIdx, i) => {
            xFull[origIdx] = xSub.get(i, 0);
        });
        x = Matrix.columnVector(xFull);
    }

    return x;
}
    // lasekee seger-kaavojen välisen neliöllisen jäännösvirheen

function calcResError(wanted: SegerFormula, calculated: SegerFormula) {
    return ALL_OXIDES.reduce((sum, oxide) => {
        const diff = (wanted[oxide] || 0) - (calculated[oxide] || 0);
        return sum + diff * diff;
    }, 0);
}

// apufunktiot

export function buildRawMaterialMap(rawMaterialArr: RawMaterial[]): Record<number, RawMaterial> {
    return Object.fromEntries(rawMaterialArr.map((ra) => [ra.id, ra]));
}

export function calcPrice(rows: RecipeRow[], rawMaterialMap: Record<number, RawMaterial>) {
    return rows.reduce((sum, row) => {
        const ra = rawMaterialMap[row.raw_material_id];
        return sum + (row.amount_perc / 100) * ((ra?.price || 0) / 10);
    }, 0);
}
