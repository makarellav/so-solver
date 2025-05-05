export interface Relation {
  left: number;
  op: ">" | "=";
  right: number;
}

export type AdjMatrixValue = 0 | 1;

export type AdjMatrix = AdjMatrixValue[][];
