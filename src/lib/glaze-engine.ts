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