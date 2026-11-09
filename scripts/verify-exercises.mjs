/**
 * Independent numerical spot checks for selected worked exercises.
 * These re-compute outcomes from payoff definitions, recurrences, and
 * enumerations; they do not parse the prose as a mathematical proof.
 *
 * Usage: node scripts/verify-exercises.mjs
 */

import assert from "node:assert/strict";

const EPS = 1e-9;
const results = [];

function close(actual, expected, description) {
  assert.ok(
    Number.isFinite(actual) && Math.abs(actual - expected) < EPS,
    description + ": expected " + expected + ", got " + actual
  );
}

function check(name, fn) {
  fn();
  results.push(name);
}

// Lecture 01, Exercise 13: enumerate all 2^5 pure profiles, then independently
// test whether any single player can improve by switching contribution.
check("L01 Q13: threshold public good, pure NE and welfare", () => {
  const n = 5, k = 3, value = 10, cost = 2;
  function payoff(mask, player) {
    const contributes = Boolean(mask & (1 << player));
    const count = mask.toString(2).replaceAll("0", "").length;
    return (count >= k ? value : 0) - (contributes ? cost : 0);
  }
  const equilibria = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    if (Array.from({ length: n }, (_, i) => i).every(
      i => payoff(mask, i) > payoff(mask ^ (1 << i), i)
    )) equilibria.push(mask);
  }
  assert.equal(equilibria.length, 11);
  assert.equal(equilibria.filter(mask => mask === 0).length, 1);
  assert.equal(equilibria.filter(mask =>
    mask.toString(2).replaceAll("0", "").length === 3).length, 10);
  close(n * value - k * cost, 44, "social welfare at threshold");
});

// Lecture 02, Exercise 03: solve a simultaneous best-response system
// iteratively instead of substituting the closed-form Cournot formula.
check("L02 Q03: Cournot quantities, price, profits", () => {
  let q1 = 0, q2 = 0;
  for (let i = 0; i < 100; i++) {
    const next1 = Math.max(0, (80 - q2) / 2);
    const next2 = Math.max(0, (80 - q1) / 2);
    q1 = next1;
    q2 = next2;
  }
  const price = 100 - q1 - q2;
  close(q1, 80 / 3, "firm 1 quantity");
  close(q2, 80 / 3, "firm 2 quantity");
  close(price, 140 / 3, "price");
  close((price - 20) * q1, 6400 / 9, "firm 1 profit");
});

// Lecture 03, Exercise 02: each player mixes to make the OTHER player
// indifferent; check total probability of coordination independently.
check("L03 Q02: battle of the sexes mixed NE", () => {
  const q = 1 / 3; // 2q = 1-q, row player's indifference
  const p = 2 / 3; // p = 2(1-p), column player's indifference
  close(2 * q, 1 - q, "row player indifference");
  close(p, 2 * (1 - p), "column player indifference");
  close(p * q + (1 - p) * (1 - q), 4 / 9, "coordination probability");
  close(2 * p * q + (1 - p) * (1 - q), 2 / 3, "player 1 payoff");
  close(p * q + 2 * (1 - p) * (1 - q), 2 / 3, "player 2 payoff");
});

// Lecture 04, Exercise 02: enumerate pure Nash profiles in the
// normal form, then separately apply the continuation best response.
check("L04 Q02: market entry pure NE versus SPNE", () => {
  const matrix = [
    [[0, 0], [2, 1]], // Enter / Fight, Enter / Accommodate
    [[1, 2], [1, 2]], // Out / Fight, Out / Accommodate
  ];
  const ne = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
    const player1Best = [0, 1].every(i => matrix[row][col][0] >= matrix[i][col][0]);
    const player2Best = [0, 1].every(j => matrix[row][col][1] >= matrix[row][j][1]);
    if (player1Best && player2Best) ne.push([row, col]);
  }
  assert.deepEqual(ne, [[0, 1], [1, 0]]);
  // On entering, Accommodate gives incumbent 1 instead of 0.
  assert.ok(matrix[0][1][1] > matrix[0][0][1]);
  // Anticipating Accommodate, entrant prefers entering to staying out.
  assert.ok(matrix[0][1][0] > matrix[1][1][0]);
});

// Lecture 05, Exercises 17-18: compute discount loss of fixed K punishment
// directly; do not evaluate K by copying the logarithm expression.
check("L05 Q17-18: Grim and finite-punishment thresholds", () => {
  close((5 - 3) / (5 - 1), 0.5, "Grim threshold");
  function shortestK(delta) {
    if (delta <= 0.5) return null;
    let loss = 0;
    for (let k = 1; k <= 10000; k++) {
      loss += delta ** k;
      if (loss >= 1 - EPS) return k;
    }
    return null;
  }
  assert.equal(shortestK(0.6), 3);
  assert.equal(shortestK(0.9 * 0.6), 4);
  assert.equal(shortestK(0.9 * 0.55), null);
  close((Math.sqrt(5) - 1) / 2, 0.6180339887498949, "two-period threshold");
});

// Lecture 06, Exercise 19: calculate two proposer states by backward
// recursion; the finite numbers are not the infinite-horizon formula.
check("L06 Q19: heterogeneous-discount alternating offers", () => {
  const d1 = 0.8, d2 = 0.9;
  const a = [null, 1], b = [null, 1];
  for (let t = 2; t <= 6; t++) {
    a[t] = 1 - d2 * b[t - 1];
    b[t] = 1 - d1 * a[t - 1];
  }
  const expected = [null, 1, 0.1, 0.82, 0.172, 0.6904, 0.22384];
  for (let t = 1; t <= 6; t++) close(a[t], expected[t], "round " + t);
  close((1 - d2) / (1 - d1 * d2), 5 / 14, "Rubinstein limit");
  // A second check of the new worked example with different discount factors.
  const d2other = 0.5;
  const a2 = 1 - d2other, b2 = 1 - d1;
  close(1 - d2other * b2, 0.9, "3-round proposer 1");
  close(a2, 0.5, "2-round proposer 1");
});

// Lecture 07, Exercise 09: iterate all three best-response equations in
// parallel, including the two possible private-cost types.
check("L07 Q09: Bayesian Cournot quantities and profits", () => {
  let q1 = 0, qLow = 0, qHigh = 0;
  for (let i = 0; i < 100; i++) {
    const n1 = Math.max(0, (60 - 0.5 * qLow - 0.5 * qHigh) / 2);
    const nLow = Math.max(0, (70 - q1) / 2);
    const nHigh = Math.max(0, (50 - q1) / 2);
    q1 = n1; qLow = nLow; qHigh = nHigh;
  }
  close(q1, 20, "uninformed firm quantity");
  close(qLow, 25, "low-cost type quantity");
  close(qHigh, 15, "high-cost type quantity");
  const priceLow = 90 - q1 - qLow;
  const priceHigh = 90 - q1 - qHigh;
  close(priceLow, 45, "price given low-cost type");
  close(priceHigh, 55, "price given high-cost type");
  close(((priceLow - 30) + (priceHigh - 30)) * q1 / 2, 400, "expected firm 1 profit");
});

// Lecture 08, Exercise 04: independently check both receiver's decisions
// and type-by-type sender's incentive compatibility.
check("L08 Q04: separating PBE receiver and sender incentives", () => {
  const post1 = 1, post0 = 0;
  const investReturn = belief => 3 * belief - (1 - belief);
  assert.ok(investReturn(post1) > 0);
  assert.ok(investReturn(post0) < 0);
  assert.ok(2 - 0.5 > 0); // high type prefers costly signal and investment
  assert.ok(0 > 2 - 3);   // low type prefers no signal and no investment
});

// Lecture 08, Exercise 15: derive cheap-talk partitions from the length
// recurrence and check every cutoff sender's indifference.
check("L08 Q14-15: cheap-talk interval lengths and cutoffs", () => {
  function partition(k, bias) {
    const first = (1 - 2 * bias * k * (k - 1)) / k;
    const lengths = Array.from({ length: k }, (_, j) => first + 4 * bias * j);
    const cuts = [0];
    for (const len of lengths) cuts.push(cuts.at(-1) + len);
    const actions = lengths.map((_, j) => (cuts[j] + cuts[j + 1]) / 2);
    return { lengths, cuts, actions };
  }
  const two = partition(2, 0.1);
  close(two.cuts[1], 0.3, "two-message cutoff");
  close(two.actions[0], 0.15, "two-message lower action");
  close(two.actions[1], 0.65, "two-message upper action");
  const three = partition(3, 0.05);
  [2 / 15, 1 / 3, 8 / 15].forEach((v, i) => close(three.lengths[i], v, "interval length " + i));
  [2 / 15, 7 / 15].forEach((v, i) => close(three.cuts[i + 1], v, "cutoff " + i));
  [1 / 15, 3 / 10, 11 / 15].forEach((v, i) => close(three.actions[i], v, "action " + i));
  for (let i = 1; i < 3; i++) {
    close(three.cuts[i] + 0.05, (three.actions[i - 1] + three.actions[i]) / 2,
      "sender indifference at cutoff " + i);
  }
  assert.ok(partition(3, 0.1).lengths[0] < 0);
});

// Lecture 09, Exercises 08-09: enumerate all six player arrival orders.
check("L09 Q08-09: Shapley values and core checks", () => {
  const perms = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  function shapley(values) {
    const result = [0, 0, 0];
    for (const perm of perms) {
      let mask = 0;
      for (const player of perm) {
        const nextMask = mask | (1 << player);
        result[player] += (values[nextMask] - values[mask]) / perms.length;
        mask = nextMask;
      }
    }
    return result;
  }
  const first = [0,0,0,2,0,4,0,6];
  const phi1 = shapley(first);
  [3,1,2].forEach((v, i) => close(phi1[i], v, "L09 Q08 player " + (i + 1)));
  close(phi1.reduce((a,b) => a + b, 0), 6, "Shapley efficiency Q08");
  const second = [0,0,0,100,0,80,60,120];
  const phi2 = shapley(second);
  [50,40,30].forEach((v, i) => close(phi2[i], v, "L09 Q09 player " + (i + 1)));
  assert.ok(phi2[0] + phi2[1] < second[3]); // coalition {1,2} blocks
  const coreCandidate = [60,40,20];
  close(coreCandidate.reduce((a,b) => a + b, 0), second[7], "core efficiency");
  for (let subset = 1; subset < 8; subset++) {
    let paid = 0;
    for (let i = 0; i < 3; i++) if (subset & (1 << i)) paid += coreCandidate[i];
    assert.ok(paid + EPS >= second[subset], "coalition " + subset + " blocks core candidate");
  }
});

process.stdout.write("Independent numerical checks passed: " + results.length + " model groups.\n");
for (const result of results) process.stdout.write("- " + result + "\n");
