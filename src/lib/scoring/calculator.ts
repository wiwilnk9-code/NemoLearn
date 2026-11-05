import { Question } from "@/types/question";
import { PracticeSession, PracticeSessionResult, QuestionResultItem, ScoringDetail, ScoringMethod, ScoringScale } from "@/types/session";
import { SessionResponseRecord } from "@/types/response";
import { SMA_SUBJECTS } from "@/lib/data/subjects";
import { roundToTwoDecimals, formatIndonesianScore } from "./format";
import {
  ItemResponseData,
  checkIRTEligibility,
  computeIRTScore,
  estimateAbilityEAP,
  scaleThetaToScore,
  IRT_MIN_SCORE,
  IRT_MAX_SCORE,
} from "./irt";

export interface EvaluationInput {
  session: PracticeSession;
  questions: Question[];
  responses: Record<string, SessionResponseRecord>;
  forceMethod?: ScoringMethod; // Opsi untuk pengujian atau mode evaluasi tertentu
}

/**
 * Evaluasi Sesi Latihan & Kuis NemoLearn
 *
 * Menerapkan Hirarki Penilaian Psikometri:
 * 1. Prioritas Utama: Item Response Theory (IRT) model 3PL Bayesian EAP skala 200,00–1.000,00
 *    jika butir soal memiliki kalibrasi empiris dan memenuhi prasyarat validitas.
 * 2. Fallback Transparan: Skor Latihan Persentase skala 0,00–100,00
 *    jika kalibrasi parameter belum memadai, diberi label transparan tanpa mengklaim IRT palsu.
 */
export function evaluatePracticeSession(input: EvaluationInput): PracticeSessionResult {
  const { session, questions, responses, forceMethod } = input;

  // Filter butir soal yang valid (memiliki id dan kunci jawaban)
  const validQuestions = (questions || []).filter(
    (q) => q && q.id && q.correctAnswer && ["A", "B", "C", "D", "E"].includes(q.correctAnswer)
  );

  let correctCount = 0;
  let wrongCount = 0;
  let emptyCount = 0;

  const items: QuestionResultItem[] = [];
  const wrongTopicTally: Record<string, { topicId: string; subtopic?: string; wrongCount: number }> = {};
  const itemResponses: ItemResponseData[] = [];

  validQuestions.forEach((q, idx) => {
    const resp = responses ? responses[q.id] : undefined;
    const selectedAnswer = resp?.selectedAnswer || null;

    // Jawaban kosong (unanswered): TIDAK PERNAH dianggap benar
    const isAnswerEmpty = !selectedAnswer || selectedAnswer.trim() === "";
    const isCorrect = !isAnswerEmpty && selectedAnswer === q.correctAnswer;

    let itemStatus: "correct" | "wrong" | "empty";
    if (isAnswerEmpty) {
      emptyCount++;
      itemStatus = "empty";
    } else if (isCorrect) {
      correctCount++;
      itemStatus = "correct";
    } else {
      wrongCount++;
      itemStatus = "wrong";
    }

    if (!isCorrect) {
      const tallyKey = `${q.topicId}:${q.subtopic || ""}`;
      if (!wrongTopicTally[tallyKey]) {
        wrongTopicTally[tallyKey] = {
          topicId: q.topicId,
          subtopic: q.subtopic,
          wrongCount: 0,
        };
      }
      wrongTopicTally[tallyKey].wrongCount++;
    }

    items.push({
      questionNumber: idx + 1,
      question: q,
      selectedAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      status: itemStatus,
      explanation: q.explanation || "Pembahasan belum tersedia.",
    });

    itemResponses.push({
      question: q,
      isCorrect,
    });
  });

  const totalQuestions = validQuestions.length;

  // 1. Hitung Skor Persentase Dasar (Raw Percentage): 0.00 s.d 100.00
  const rawPercentage = totalQuestions > 0
    ? roundToTwoDecimals((correctCount / totalQuestions) * 100)
    : 0.0;

  // 2. Audit Kesiapan & Kelayakan Penilaian IRT
  const irtAudit = checkIRTEligibility(itemResponses);

  // Tentukan metode penilaian yang digunakan
  const shouldUseIRT = forceMethod === "irt" || (forceMethod !== "percentage" && irtAudit.isEligible);

  let scoringDetail: ScoringDetail;

  if (shouldUseIRT) {
    // Mode IRT (Item Response Theory)
    let theta = 0;
    let standardError = 0;
    let irtScaled = IRT_MIN_SCORE;

    if (totalQuestions > 0) {
      const eap = estimateAbilityEAP(itemResponses);
      theta = eap.theta;
      standardError = eap.standardError;
      irtScaled = scaleThetaToScore(theta, correctCount, totalQuestions);
    }

    const formattedScore = formatIndonesianScore(irtScaled);

    scoringDetail = {
      method: "irt",
      scale: "200-1000",
      version: "v2.0-irt-3pl",
      label: "Skor IRT",
      rawPercentage,
      scoreValue: irtScaled,
      formattedScore,
      theta: roundToTwoDecimals(theta),
      standardError: roundToTwoDecimals(standardError),
      isIrtEligible: true,
      scoringNotes: `Penilaian menggunakan model Item Response Theory (IRT 3PL Bayesian EAP). Skor kemampuan distandarisasi pada skala 200,00–1.000,00 dengan estimasi θ = ${theta >= 0 ? "+" : ""}${theta.toFixed(
        2
      )} (SE = ${standardError.toFixed(2)}).`,
      notes: `Penilaian menggunakan model Item Response Theory (IRT 3PL Bayesian EAP). Skor kemampuan distandarisasi pada skala 200,00–1.000,00 dengan estimasi θ = ${theta >= 0 ? "+" : ""}${theta.toFixed(
        2
      )} (SE = ${standardError.toFixed(2)}).`,
    };
  } else {
    // Fallback Transparan: Skor Latihan Persentase
    const formattedScore = formatIndonesianScore(rawPercentage);

    scoringDetail = {
      method: "percentage",
      scale: "0-100",
      version: "v1.0-percentage",
      label: "Skor Latihan (Persentase)",
      rawPercentage,
      scoreValue: rawPercentage,
      formattedScore,
      isIrtEligible: false,
      scoringNotes:
        totalQuestions === 0
          ? "Tidak ada butir soal valid yang dapat dinilai."
          : `Penilaian menggunakan metode Skor Latihan (Persentase 0,00–100,00) sebagai fallback transparan karena ${irtAudit.reason.toLowerCase()} Skor merefleksikan persentase butir yang dijawab benar.`,
      notes:
        totalQuestions === 0
          ? "Tidak ada butir soal valid yang dapat dinilai."
          : `Penilaian menggunakan metode Skor Latihan (Persentase 0,00–100,00) sebagai fallback transparan karena ${irtAudit.reason.toLowerCase()} Skor merefleksikan persentase butir yang dijawab benar.`,
    };
  }

  // Identifikasi materi lemah untuk remedial
  const subject = SMA_SUBJECTS.find((s) => s.id === session.config.subjectId);
  const weakTopics = Object.values(wrongTopicTally).map((item) => {
    const topicObj = subject?.topics.find((t) => t.id === item.topicId);
    return {
      topicId: item.topicId,
      topicName: topicObj ? topicObj.name : item.topicId,
      subtopic: item.subtopic,
      wrongCount: item.wrongCount,
    };
  });

  // Snapshot representasi sesi yang diperbarui (tidak mengubah skor lama diam-diam)
  const updatedSession: PracticeSession = {
    ...session,
    status: "completed",
    score: scoringDetail.scoreValue,
    scoreFormatted: scoringDetail.formattedScore,
    scoringMethod: scoringDetail.method,
    scoringScale: scoringDetail.scale,
    scoringVersion: scoringDetail.version,
    scoreLabel: scoringDetail.label,
    theta: scoringDetail.theta ?? null,
    standardError: scoringDetail.standardError ?? null,
    correctCount,
    wrongCount,
    emptyCount,
    completedAt: session.completedAt || new Date().toISOString(),
  };

  return {
    session: updatedSession,
    totalQuestions,
    correctCount,
    wrongCount,
    emptyCount,
    scorePercentage: rawPercentage,
    scoreDetail: scoringDetail,
    items,
    weakTopics,
  };
}
