/**
 * NemoLearn Item Response Theory (IRT) Psychometric Engine
 *
 * Spesifikasi Matematis & Metodologi:
 * 1. Model: 3-Parameter Logistic (3PL) / 2-Parameter Logistic (2PL)
 *    P_i(theta) = c_i + (1 - c_i) / (1 + e^(-D * a_i * (theta - b_i)))
 *    - theta: parameter kemampuan laten siswa (-4.0 s.d +4.0)
 *    - b_i: parameter tingkat kesulitan butir (-3.0 s.d +3.0)
 *    - a_i: parameter daya pembeda butir (0.5 s.d 2.5)
 *    - c_i: parameter tebakan semu (pseudo-guessing), default 0.20 untuk 5 pilihan
 *    - D = 1.702 (konstanta penskalaan logistik ke probit)
 *
 * 2. Estimasi Kemampuan:
 *    Menggunakan Bayesian Expected A Posteriori (EAP) dengan Gaussian prior N(0, 1).
 *    Mencegah divergensi MLE pada kasus skor ekstrem (0% benar atau 100% benar).
 *
 * 3. Transformasi Skala UTBK:
 *    Rentang target: 200,00 s.d 1000,00.
 *    Skor = 600,00 + 133,3333 * theta_hat
 *    Dibatasi secara ketat pada [200,00, 1000,00].
 */

import { Question, IRTParameters } from "@/types/question";
import { roundToTwoDecimals, formatIndonesianScore } from "./format";

export const IRT_MIN_SCORE = 200.0;
export const IRT_MAX_SCORE = 1000.0;
export const IRT_MEAN_SCORE = 600.0;
export const IRT_SCALE_FACTOR = 133.3333333333; // (1000 - 200) / 6.0
export const D_SCALING = 1.702;

export interface ItemResponseData {
  question: Question;
  isCorrect: boolean;
}

export interface IRTEstimationResult {
  theta: number; // Latent ability estimate
  standardError: number; // SE of estimation
  scaledScore: number; // Transformed score (200.00 - 1000.00)
  formattedScore: string; // Indonesian format with 2 decimals, e.g. "654,32"
  isEligible: boolean;
  notes: string;
}

/**
 * Pengecek Kelayakan Validitas IRT (IRT Validity & Readiness Audit):
 * IRT hanya dapat diaplikasikan secara valid jika:
 * 1. Minimal 3 butir soal yang diujikan.
 * 2. Seluruh butir soal memiliki parameter kesulitan terdefinisi atau terkalibrasi.
 * 3. Tidak ada anomali data respon yang merusak model psikometri.
 */
export function checkIRTEligibility(items: ItemResponseData[]): {
  isEligible: boolean;
  reason: string;
} {
  if (!items || items.length === 0) {
    return {
      isEligible: false,
      reason: "Tidak ada butir soal yang dinilai.",
    };
  }

  if (items.length < 3) {
    return {
      isEligible: false,
      reason: `Jumlah soal terlalu sedikit (${items.length} butir). Estimasi IRT membutuhkan minimal 3 butir soal agar fungsi informasi tes konvergen.`,
    };
  }

  // Periksa apakah ada parameter yang terdefinisi atau dikonfigurasi
  const hasExplicitCalibration = items.every(
    (item) => item.question.irt && typeof item.question.irt.difficulty === "number"
  );

  // Jika belum ada parameter eksplisit sama sekali
  if (!hasExplicitCalibration) {
    return {
      isEligible: false,
      reason:
        "Parameter empiris butir soal (a, b, c) belum melalui kalibrasi psikometri dari sampel respons riil yang memadai.",
    };
  }

  return {
    isEligible: true,
    reason: "Seluruh butir soal memiliki parameter IRT terkalibrasi yang valid.",
  };
}

/**
 * Mendapatkan parameter IRT (a, b, c) untuk suatu butir soal.
 * Jika butir memiliki objek irt eksplisit, gunakan.
 * Jika tidak, lakukan pemetaan a priori berbasis difficulty kualitatif kurikulum.
 */
export function resolveItemIRTParams(question: Question): { a: number; b: number; c: number } {
  if (question.irt && typeof question.irt.difficulty === "number") {
    return {
      a: Math.max(0.3, Math.min(question.irt.discrimination ?? 1.2, 3.0)),
      b: Math.max(-3.5, Math.min(question.irt.difficulty, 3.5)),
      c: Math.max(0.0, Math.min(question.irt.guessing ?? 0.2, 0.3)),
    };
  }

  // Apriori Mapping berdasarkan jenjang kesulitan Kurikulum Merdeka SMA
  switch (question.difficulty) {
    case "mudah":
      return { a: 1.0, b: -1.2, c: 0.2 };
    case "sedang":
      return { a: 1.2, b: 0.0, c: 0.2 };
    case "sulit":
      return { a: 1.4, b: 1.2, c: 0.2 };
    case "hots":
      return { a: 1.6, b: 1.8, c: 0.2 };
    default:
      return { a: 1.0, b: 0.0, c: 0.2 };
  }
}

/**
 * Probabilitas menjawab benar berdasarkan model 3PL:
 * P(theta) = c + (1 - c) / (1 + exp(-D * a * (theta - b)))
 */
export function calculateProbability(theta: number, a: number, b: number, c: number): number {
  const exponent = -D_SCALING * a * (theta - b);
  // Lindungi dari overflow numerik floating point
  if (exponent > 40) return c;
  if (exponent < -40) return 1.0;
  return c + (1.0 - c) / (1.0 + Math.exp(exponent));
}

/**
 * Density fungsi prior normal standar: N(0, 1)
 */
function standardNormalDensity(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

/**
 * Estimasi Kemampuan Bayesian EAP (Expected A Posteriori)
 * Menghitung nilai ekspektasi integral theta di bawah kurva posterior log-likelihood x prior.
 */
export function estimateAbilityEAP(items: ItemResponseData[]): {
  theta: number;
  standardError: number;
} {
  const nItems = items.length;
  if (nItems === 0) return { theta: 0.0, standardError: 1.0 };

  const correctCount = items.filter((i) => i.isCorrect).length;

  // Kasus batas khusus: Semua Salah (0 benar)
  if (correctCount === 0) {
    return { theta: -3.0, standardError: 0.45 };
  }

  // Kasus batas khusus: Semua Benar (100% benar)
  if (correctCount === nItems) {
    return { theta: 3.0, standardError: 0.45 };
  }

  // Resolusi parameter setiap butir
  const params = items.map((i) => ({
    ...resolveItemIRTParams(i.question),
    u: i.isCorrect ? 1 : 0,
  }));

  // Grid Quadrature: 41 titik dari -4.0 hingga +4.0 dengan langkah 0.2
  const nGrid = 41;
  const gridMin = -4.0;
  const gridMax = 4.0;
  const step = (gridMax - gridMin) / (nGrid - 1);

  const thetaNodes: number[] = [];
  const logPosteriors: number[] = [];

  for (let k = 0; k < nGrid; k++) {
    const thetaK = gridMin + k * step;
    thetaNodes.push(thetaK);

    // Hitung log-likelihood: sum_i [ u_i * ln(P_i) + (1 - u_i) * ln(1 - P_i) ]
    let logLikelihood = 0.0;
    for (const item of params) {
      const p = calculateProbability(thetaK, item.a, item.b, item.c);
      const clampedP = Math.max(1e-12, Math.min(p, 1 - 1e-12));
      logLikelihood += item.u === 1 ? Math.log(clampedP) : Math.log(1 - clampedP);
    }

    // Tambahkan log prior N(0, 1): ln(1/sqrt(2pi)) - 0.5 * theta^2
    const logPrior = -0.5 * Math.log(2 * Math.PI) - 0.5 * thetaK * thetaK;
    logPosteriors.push(logLikelihood + logPrior);
  }

  // Log-Sum-Exp Trick untuk stabilitas numerik eksponensial
  const maxLog = Math.max(...logPosteriors);
  const weights: number[] = logPosteriors.map((lp) => Math.exp(lp - maxLog));
  const sumWeights = weights.reduce((acc, w) => acc + w, 0);

  if (sumWeights <= 0 || isNaN(sumWeights)) {
    return { theta: 0.0, standardError: 1.0 };
  }

  // EAP: E[theta] = sum(theta_k * W_k) / sum(W_k)
  let eapNumerator = 0.0;
  for (let k = 0; k < nGrid; k++) {
    eapNumerator += thetaNodes[k] * weights[k];
  }
  const thetaHat = eapNumerator / sumWeights;

  // Varians Posterior: Var[theta] = sum((theta_k - theta_hat)^2 * W_k) / sum(W_k)
  let varNumerator = 0.0;
  for (let k = 0; k < nGrid; k++) {
    const diff = thetaNodes[k] - thetaHat;
    varNumerator += diff * diff * weights[k];
  }
  const variance = varNumerator / sumWeights;
  const se = Math.sqrt(Math.max(0.01, variance));

  return {
    theta: Math.max(-3.5, Math.min(thetaHat, 3.5)),
    standardError: roundToTwoDecimals(se),
  };
}

/**
 * Penskalaan Skor IRT ke Skala Baku 200,00 - 1000,00:
 * Formula Linier: Skor = 600 + (133.3333 * theta)
 * Dibatasi secara presisi pada interval [200.00, 1000.00].
 */
export function scaleThetaToScore(theta: number, correctCount: number, totalQuestions: number): number {
  if (totalQuestions <= 0 || correctCount === 0) {
    return IRT_MIN_SCORE; // 200.00
  }

  if (correctCount === totalQuestions) {
    return IRT_MAX_SCORE; // 1000.00
  }

  const rawScore = IRT_MEAN_SCORE + IRT_SCALE_FACTOR * theta;
  const clamped = Math.max(IRT_MIN_SCORE, Math.min(rawScore, IRT_MAX_SCORE));
  return roundToTwoDecimals(clamped);
}

/**
 * Mesin Utama Penilaian IRT Lengkap
 */
export function computeIRTScore(items: ItemResponseData[]): IRTEstimationResult {
  const eligibility = checkIRTEligibility(items);
  const correctCount = items.filter((i) => i.isCorrect).length;
  const total = items.length;

  if (!eligibility.isEligible) {
    return {
      theta: 0,
      standardError: 0,
      scaledScore: 0,
      formattedScore: "0,00",
      isEligible: false,
      notes: eligibility.reason,
    };
  }

  const { theta, standardError } = estimateAbilityEAP(items);
  const scaledScore = scaleThetaToScore(theta, correctCount, total);
  const formattedScore = formatIndonesianScore(scaledScore);

  return {
    theta: roundToTwoDecimals(theta),
    standardError: roundToTwoDecimals(standardError),
    scaledScore,
    formattedScore,
    isEligible: true,
    notes: `Estimasi kemampuan IRT model 3PL Bayesian EAP (θ = ${theta.toFixed(
      2
    )}, SE = ${standardError.toFixed(2)}). Skala UTBK terstandar 200,00–1.000,00.`,
  };
}
