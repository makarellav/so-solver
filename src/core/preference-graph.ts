import type { AdjMatrix, AdjMatrixValue, Relation } from "./types";

//test

export class PreferenceGraph {
  private prefAdj = new Map<number, Set<number>>();
  private eqAdj = new Map<number, Set<number>>();
  adjMatrices = new Map<number, AdjMatrix>();
  relationalConvolution: AdjMatrix = [];
  strictConvolution: AdjMatrix = [];
  q1ParetoOptimalSet: AdjMatrixValue[] = [];
  q2AdditiveRelationalConvolution: number[][] = [];
  q2StrictConvolution: number[][] = [];
  q2ParetoOptimalSet: number[] = [];
  result: number[] = [];
  answer: { value: number; index: number } = { value: -1, index: -1 };
  generatedWeightsByCriterion: Record<number, number> = {};
  generatedRelationsByCriterion: Record<number, Relation[]> = {};

  addPreference(x: number, y: number): void {
    console.log(`Adding preference (${x}, ${y})`);

    if (!this.prefAdj.has(x)) {
      this.prefAdj.set(x, new Set());
    }
    this.prefAdj.get(x)!.add(y);
  }

  addEq(x: number, y: number): void {
    if (!this.eqAdj.has(x)) {
      this.eqAdj.set(x, new Set());
    }
    if (!this.eqAdj.has(y)) {
      this.eqAdj.set(y, new Set());
    }
    this.eqAdj.get(x)!.add(y);
    this.eqAdj.get(y)!.add(x);
  }

  isPreferred(x: number, y: number) {
    const seen = new Set<number>();
    const queue = [x];

    while (queue.length > 0) {
      const u = queue.shift()!;

      if (seen.has(u)) {
        continue;
      }

      if (u === y) {
        return true;
      }

      seen.add(u);

      for (const v of this.prefAdj.get(u) ?? []) {
        if (!seen.has(v)) {
          queue.push(v);

          if (x === 3 && y === 2) {
            console.log("queue", queue);
          }
        }
      }

      for (const v of this.eqAdj.get(u) ?? []) {
        if (!seen.has(v)) {
          queue.push(v);
        }
      }
    }

    return false;
  }

  reset() {
    this.eqAdj = new Map();
    this.prefAdj = new Map();
  }

  buildAdjMatrix(criterion: number, alternativesCount: number) {
    const adjMatrix: AdjMatrix = Array.from({ length: alternativesCount }, () =>
      Array.from({ length: alternativesCount }, () => 0),
    );

    for (let i = 1; i <= alternativesCount; i++) {
      for (let j = 1; j <= alternativesCount; j++) {
        adjMatrix[i - 1][j - 1] = this.isPreferred(i, j) ? 1 : 0;
      }
    }

    this.adjMatrices.set(criterion, adjMatrix);
  }

  buildRelationalConvolution(alternativesCount: number) {
    const adjMatrix: AdjMatrix = Array.from({ length: alternativesCount }, () =>
      Array.from({ length: alternativesCount }, () => 0),
    );

    for (let i = 1; i <= alternativesCount; i++) {
      for (let j = 1; j <= alternativesCount; j++) {
        const values = [...this.adjMatrices.values()].map(
          (m) => m[i - 1][j - 1],
        );

        adjMatrix[i - 1][j - 1] = values.length
          ? (Math.min(...values) as AdjMatrixValue)
          : 0;
      }
    }

    this.relationalConvolution = adjMatrix;
  }

  buildStrictConvolution() {
    const n = this.relationalConvolution.length;

    const strictConvolution: AdjMatrix = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => 0),
    );

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        strictConvolution[i][j] = Math.max(
          this.relationalConvolution[i][j] - this.relationalConvolution[j][i],
          0,
        ) as AdjMatrixValue;
      }
    }

    this.strictConvolution = strictConvolution;
  }

  buildQ1ParetoOptimalSet() {
    const n = this.strictConvolution.length;

    const set: AdjMatrixValue[] = Array.from({ length: n }, () => 0);

    for (let i = 0; i < n; i++) {
      const colValues = this.strictConvolution.map((row) => row[i]);

      set[i] = (1 - Math.max(...colValues)) as AdjMatrixValue;
    }

    this.q1ParetoOptimalSet = set;
  }

  buildQ2AdditiveRelationalConvolution(
    weightByCriterion: Record<number, number>,
  ) {
    const firstKey = Object.keys(weightByCriterion)[0];
    const firstAdj = this.adjMatrices.get(Number(firstKey));
    if (!firstAdj) throw new Error("no adj matrix");
    const n = firstAdj.length;

    const q2: number[][] = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => 0),
    );

    for (const [critStr, weight] of Object.entries(weightByCriterion)) {
      const k = Number(critStr);
      const adj = this.adjMatrices.get(k);
      if (!adj) throw new Error(`no adj for criterion ${k}`);

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          q2[i][j] += adj[i][j] * weight;
        }
      }
    }

    this.q2AdditiveRelationalConvolution = q2;
  }

  buildQ2StrictConvoluton() {
    const n = this.q2AdditiveRelationalConvolution.length;

    const q2StrictConvolution: AdjMatrix = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => 0),
    );

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        q2StrictConvolution[i][j] = Math.max(
          this.q2AdditiveRelationalConvolution[i][j] -
            this.q2AdditiveRelationalConvolution[j][i],
          0,
        ) as AdjMatrixValue;
      }
    }

    this.q2StrictConvolution = q2StrictConvolution;
  }

  buildQ2ParetoOptimalSet() {
    const n = this.q2StrictConvolution.length;

    const set: number[] = Array.from({ length: n }, () => 0);

    for (let i = 0; i < n; i++) {
      const colValues = this.q2StrictConvolution.map((row) => row[i]);

      set[i] = (1 - Math.max(...colValues)) as AdjMatrixValue;
    }

    this.q2ParetoOptimalSet = set;
  }

  buildResult() {
    this.result = this.q1ParetoOptimalSet.map((value, i) =>
      Math.min(value, this.q2ParetoOptimalSet[i]),
    );
  }

  findAnswer() {
    if (this.result.length === 0) {
      return this.answer;
    }

    let maxIndex = 0;
    let maxValue = this.result[maxIndex];

    for (let i = 1; i < this.result.length; i++) {
      if (this.result[i] > maxValue) {
        maxValue = this.result[i];
        maxIndex = i;
      }
    }

    this.answer = {
      index: maxIndex,
      value: maxValue,
    };
  }

  generate(alternativesCount: number, criterionCount: number) {
    this.generatedWeightsByCriterion = this.generateWeights(criterionCount);

    this.generatedRelationsByCriterion = this.generateRelationsByCriterion(
      criterionCount,
      alternativesCount,
    );
  }

  private generateWeights(criterionCount: number): Record<number, number> {
    const raw = Array.from({ length: criterionCount }, () => Math.random());
    const sum = raw.reduce((acc, el) => acc + el, 0);
    const result: Record<number, number> = {};

    for (let i = 0; i < criterionCount; i++) {
      result[i + 1] = +(raw[i] / sum).toFixed(2);
    }

    return result;
  }

  private shuffleAlternatives(alternativesCount: number): number[] {
    const shuffled = Array.from({ length: alternativesCount }, (_, i) => i + 1);

    for (let i = shuffled.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  private generateRelationsByCriterion(
    criterionCount: number,
    alternativesCount: number,
  ): Record<number, Relation[]> {
    const result: Record<number, Relation[]> = {};

    for (let i = 0; i < criterionCount; i++) {
      const shuffledAlternatives = this.shuffleAlternatives(alternativesCount);

      const relations: Relation[] = [];

      for (let j = 0; j < shuffledAlternatives.length - 1; j++) {
        const a = shuffledAlternatives[j];
        const b = shuffledAlternatives[j + 1];

        if (Math.random() > 0.3) {
          relations.push({ left: a, op: ">", right: b });
        } else {
          relations.push({ left: a, op: "=", right: b });
        }
      }

      result[i + 1] = relations;
    }

    return result;
  }
}
