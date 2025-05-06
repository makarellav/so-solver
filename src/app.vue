<script lang="ts" setup>
import { ref, watch } from "vue";
import {
  type AdjMatrixValue,
  type AdjMatrix,
  type Relation,
} from "./core/types";
import { PreferenceGraph } from "./core/preference-graph";

const solver = new PreferenceGraph();

const alternativesCount = ref(0);
const criterionCount = ref(0);

const relationsByCriterion = ref<Record<number, Relation[]>>({});
const weightByCriterion = ref<Record<number, number>>({});
const adjMatrices = ref<[number, AdjMatrix][]>([]);
const relationalConvolution = ref<AdjMatrix>([]);
const strictConvolution = ref<AdjMatrix>([]);
const q1ParetoOptimalSet = ref<AdjMatrixValue[]>([]);
const q2AdditiveRelationalConvolution = ref<number[][]>([]);
const q2StrictConvolution = ref<number[][]>([]);
const q2ParetoOptimalSet = ref<number[]>([]);
const resultMatrix = ref<number[]>([]);
const answer = ref<{ value: number; index: number }>({ value: -1, index: -1 });

watch(
  criterionCount,
  (newCount) => {
    for (let i = 1; i <= newCount; i++) {
      if (!relationsByCriterion.value[i]) {
        relationsByCriterion.value[i] = [];
      }
    }
  },
  { immediate: true },
);

function addRelation(criterion: number) {
  const newRelation: Relation = {
    left: 1,
    op: "=",
    right: 1,
  };

  relationsByCriterion.value[criterion].push(newRelation);
}

function solve() {
  for (let i = 1; i <= criterionCount.value; i++) {
    const relations = relationsByCriterion.value[i];

    for (const relation of relations) {
      if (relation.op === ">") {
        solver.addPreference(relation.left, relation.right);
      } else {
        solver.addEq(relation.left, relation.right);
      }
    }

    solver.buildAdjMatrix(i, alternativesCount.value);

    solver.reset();
  }

  adjMatrices.value = Array.from(solver.adjMatrices);

  solver.buildRelationalConvolution(alternativesCount.value);

  relationalConvolution.value = solver.relationalConvolution;

  solver.buildStrictConvolution();

  strictConvolution.value = solver.strictConvolution;

  solver.buildQ1ParetoOptimalSet();

  q1ParetoOptimalSet.value = solver.q1ParetoOptimalSet;

  solver.buildQ2AdditiveRelationalConvolution(weightByCriterion.value);

  q2AdditiveRelationalConvolution.value =
    solver.q2AdditiveRelationalConvolution;

  solver.buildQ2StrictConvoluton();

  q2StrictConvolution.value = solver.q2StrictConvolution;

  solver.buildQ2ParetoOptimalSet();

  q2ParetoOptimalSet.value = solver.q2ParetoOptimalSet;

  solver.buildResult();

  resultMatrix.value = solver.result;

  solver.findAnswer();

  answer.value = solver.answer;
}

function generate() {
  solver.generate(alternativesCount.value, criterionCount.value);
  weightByCriterion.value = solver.generatedWeightsByCriterion;
  relationsByCriterion.value = solver.generatedRelationsByCriterion;
}
</script>

<template>
  <div class="container">
    <header>
      <small>Built by Vladyslav Makarenko | KI-21 SPECIAL &#127942;</small>
      <h1>Багатокритеріальний вибір альтернатив</h1>
    </header>
    <main>
      <form @submit.prevent="solve">
        <label>
          Кількість альтернатив
          <input type="number" v-model.number="alternativesCount" />
        </label>
        <label>
          Кількість критеріїв
          <input type="number" v-model.number="criterionCount" />
        </label>
        <button
          v-if="alternativesCount > 0 && criterionCount > 0"
          class="secondary generate"
          type="button"
          @click="generate"
        >
          Згенерувати умови задачі з кількості альтернатив та критеріїв
        </button>
        <fieldset v-if="criterionCount > 0" class="weights">
          <legend>Ваги критеріїв</legend>
          <label v-for="index in criterionCount">
            W<sub>{{ index }}</sub>
            <input
              type="number"
              step="0.01"
              v-model.number="weightByCriterion[index]"
            />
          </label>
        </fieldset>
        <div class="advantage-ratios" v-if="criterionCount > 0">
          <div
            class="advantage-ratio"
            v-for="index in criterionCount"
            :key="index"
          >
            <hr v-if="index === 1" />
            <p>
              R<sub>{{ index }}</sub>
            </p>
            <fieldset
              class="grid"
              v-for="relation in relationsByCriterion[index]"
            >
              <select
                name="{{ `relation-${index}-left` }}"
                id="{{ `relation-${index}-left` }}"
                v-model.number="relation.left"
              >
                <option
                  v-for="index in alternativesCount"
                  :value="index"
                  :key="index"
                >
                  x{{ index }}
                </option>
              </select>
              <select
                name="{{ `relation-${index}-op` }}"
                id="{{ `relation-${index}-op` }}"
                v-model="relation.op"
              >
                <option value=">">></option>
                <option value="=">=</option>
              </select>
              <select
                name="{{ `relation-${index}-right` }}"
                id="{{ `relation-${index}-right` }}"
                v-model.number="relation.right"
              >
                <option
                  v-for="index in alternativesCount"
                  :value="index"
                  :key="index"
                >
                  x{{ index }}
                </option>
              </select>
            </fieldset>
            <button type="button" @click="addRelation(index)" class="contrast">
              Додати відношення переваги
            </button>
            <hr />
          </div>
        </div>
        <button type="submit">Вирішити задачу</button>
      </form>
      <div class="tables" v-if="adjMatrices.length > 0">
        <table v-for="([criterion, matrix], index) in adjMatrices" :key="index">
          <caption>
            Матриця відношення R<sub>{{ criterion }}</sub>
          </caption>
          <thead>
            <tr>
              <td></td>
              <th v-for="index in alternativesCount" scope="col" :key="index">
                x<sub>{{ index }}</sub>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="index in alternativesCount" :key="index">
              <th scope="row">
                x<sub>{{ index }}</sub>
              </th>
              <td v-for="(relation, i) in matrix[index - 1]" :key="i">
                {{ relation }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        class="relational-convolution"
        v-if="relationalConvolution.length > 0"
      >
        <table>
          <caption>
            Згортка відношень Q<sub>1</sub>
          </caption>
          <thead>
            <tr>
              <td></td>
              <th v-for="index in alternativesCount" scope="col" :key="index">
                x<sub>{{ index }}</sub>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="i in alternativesCount" :key="i">
              <th scope="row">
                x<sub>{{ i }}</sub>
              </th>
              <td
                v-for="(value, index) in relationalConvolution[i - 1]"
                :key="index"
              >
                {{ value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="strict-convolution" v-if="strictConvolution.length > 0">
        <table>
          <caption>
            Відношення строгої переваги Q<sub>1</sub
            ><sup>S</sup>
          </caption>
          <thead>
            <tr>
              <td></td>
              <th v-for="index in alternativesCount" scope="col" :key="index">
                x<sub>{{ index }}</sub>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="i in alternativesCount" :key="i">
              <th scope="row">
                x<sub>{{ i }}</sub>
              </th>
              <td
                v-for="(value, index) in strictConvolution[i - 1]"
                :key="index"
              >
                {{ value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="q1-pareto-optimal" v-if="q1ParetoOptimalSet.length > 0">
        <table>
          <caption>
            Множина недомінованих альтерантив по згортці Q<sub>1</sub>
          </caption>
          <thead>
            <tr>
              <td></td>
              <th v-for="index in alternativesCount" scope="col" :key="index">
                x<sub>{{ index }}</sub>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <th scope="row">Q<sub>1</sub><sup>нд</sup></th>
              <td v-for="(value, index) in q1ParetoOptimalSet" :key="index">
                {{ value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        class="q2-additive"
        v-if="q2AdditiveRelationalConvolution.length > 0"
      >
        <table>
          <caption>
            Адитивна згортка відношень Q<sub>2</sub>
          </caption>
          <thead>
            <tr>
              <td></td>
              <th v-for="index in alternativesCount" scope="col" :key="index">
                x<sub>{{ index }}</sub>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="i in alternativesCount" :key="i">
              <th scope="row">
                x<sub>{{ i }}</sub>
              </th>
              <td
                v-for="(value, index) in q2AdditiveRelationalConvolution[i - 1]"
                :key="index"
              >
                {{ value.toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="q2-strict" v-if="q2StrictConvolution.length > 0">
        <table>
          <caption>
            Матриця строгого відношення Q<sub>2</sub
            ><sup>S</sup>
          </caption>
          <thead>
            <tr>
              <td></td>
              <th v-for="index in alternativesCount" scope="col" :key="index">
                x<sub>{{ index }}</sub>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="i in alternativesCount" :key="i">
              <th scope="row">
                x<sub>{{ i }}</sub>
              </th>
              <td
                v-for="(value, index) in q2StrictConvolution[i - 1]"
                :key="index"
              >
                {{ value.toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="q2-pareto-optimal" v-if="q2ParetoOptimalSet.length > 0">
        <table>
          <caption>
            Множина недомінованих альтерантив по згортці Q<sub>2</sub>
          </caption>
          <thead>
            <tr>
              <td></td>
              <th v-for="index in alternativesCount" scope="col" :key="index">
                x<sub>{{ index }}</sub>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <th scope="row">Q<sub>2</sub><sup>нд</sup></th>
              <td v-for="(value, index) in q2ParetoOptimalSet" :key="index">
                {{ value.toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        class="tables"
        v-if="q1ParetoOptimalSet.length > 0 && q2ParetoOptimalSet.length > 0"
      >
        <table>
          <caption>
            Перетин множин Q<sub>1</sub
            ><sup>нд</sup>
            і Q<sub>2</sub
            ><sup>нд</sup>
          </caption>
          <thead>
            <tr>
              <td></td>
              <th v-for="index in alternativesCount" scope="col" :key="index">
                x<sub>{{ index }}</sub>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <th scope="row">Q<sub>1</sub><sup>нд</sup></th>
              <td v-for="(value, index) in q1ParetoOptimalSet" :key="index">
                {{ value.toFixed(2) }}
              </td>
            </tr>
            <tr>
              <th scope="row">Q<sub>2</sub><sup>нд</sup></th>
              <td v-for="(value, index) in q2ParetoOptimalSet" :key="index">
                {{ value.toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>

        <table>
          <caption>
            Результуюча множина Q<sup>нд</sup>
          </caption>
          <thead>
            <tr>
              <td></td>
              <th v-for="index in alternativesCount" scope="col" :key="index">
                x<sub>{{ index }}</sub>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <th scope="row">Q<sup>нд</sup></th>
              <td v-for="(value, index) in resultMatrix" :key="index">
                {{ value.toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="answer.index >= 0 && answer.value >= 0">
        Відповідь: μ<sub>нд</sub>(x<sub>{{ answer.index + 1 }}</sub
        >) = {{ answer.value.toFixed(2) }}
      </p>
    </main>
  </div>
</template>

<style scoped>
header {
  margin-top: 50px;
}

main {
  max-width: 60%;
}

.advantage-ratios {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.generate {
  width: 100%;
}

.weights {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.advantage-ratio {
  display: flex;
  flex-direction: column;
}

.advantage-ratio button {
  align-self: flex-start;
}

.advantage-ratio p {
  font-weight: bold;
}

.tables {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.tables table {
  flex: 0 0 45%;
}

table {
  width: auto;
}
</style>
