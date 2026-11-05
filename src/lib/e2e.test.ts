import { describe, it, before } from "node:test";
import assert from "node:assert";
import { UserRepository, SubjectRepository, SessionRepository, QuestionRepository, ResponseRepository, AISettingsRepository } from "./db";
import { getAIProvider } from "./ai";
import { evaluatePracticeSession } from "./scoring/calculator";
import { PracticeSession } from "@/types/session";

describe("NemoQUIZ Core Flow (P0 MVP Learner Journey) - End-to-End", () => {
  const userId = "usr_pelajar_01";

  before(() => {
    // Reset any temporary DB AI overrides to run predictable offline e2e suite
    AISettingsRepository.reset();
    // Ensure user exists
    const user = UserRepository.getById(userId);
    assert.ok(user, "Default learner user exists");
  });

  it("Step 1: selects subject (Fisika) and topic (Dinamika Gerak) from repository", () => {
    const subject = SubjectRepository.getById("fisika");
    assert.ok(subject, "Subject Fisika exists");
    assert.strictEqual(subject.name, "Fisika");

    const topic = subject.topics.find((t) => t.id === "dinamika");
    assert.ok(topic, "Topic Dinamika exists");
    assert.strictEqual(topic.name, "Dinamika Gerak & Hukum Newton");
  });

  it("Step 2 & 3: generates 10 questions via AI Provider and creates practice session", async () => {
    const provider = getAIProvider();
    const questions = await provider.generateQuestions({
      subjectId: "fisika",
      subjectName: "Fisika",
      topicId: "dinamika",
      topicName: "Dinamika Gerak & Hukum Newton",
      questionCount: 10,
      mode: "reguler",
      level: "SMA",
    });

    assert.strictEqual(questions.length, 10, "Generates exactly 10 questions");
    questions.forEach((q) => {
      assert.ok(q.stem.length > 5, "Question stem is populated");
      assert.strictEqual(q.options.length, 5, "Has 5 options (A..E)");
      assert.ok(["A", "B", "C", "D", "E"].includes(q.correctAnswer), "Has valid correct answer");
      assert.ok(q.explanation.length > 5, "Has explanation");
    });

    // Save questions in db
    QuestionRepository.saveBatch(questions);

    // Create session
    const sessionId = `sess_e2e_${Date.now()}`;
    const session: PracticeSession = {
      id: sessionId,
      userId,
      config: {
        subjectId: "fisika",
        topicId: "dinamika",
        questionCount: 10,
        mode: "reguler",
      },
      status: "active",
      questionIds: questions.map((q) => q.id),
      score: null,
      correctCount: null,
      wrongCount: null,
      emptyCount: null,
      startedAt: new Date().toISOString(),
    };

    SessionRepository.create(session);

    const savedSession = SessionRepository.getById(sessionId);
    assert.ok(savedSession, "Session is persisted in database");
    assert.strictEqual(savedSession.status, "active");
  });

  it("Step 4: records and updates answers during practice session reliably", () => {
    const sessionId = "sess_e2e_answering";
    const session: PracticeSession = {
      id: sessionId,
      userId,
      config: {
        subjectId: "fisika",
        topicId: "dinamika",
        questionCount: 2,
        mode: "reguler",
      },
      status: "active",
      questionIds: ["q_test_1", "q_test_2"],
      score: null,
      correctCount: null,
      wrongCount: null,
      emptyCount: null,
      startedAt: new Date().toISOString(),
    };
    SessionRepository.create(session);

    // Initial answer
    ResponseRepository.saveAnswer(sessionId, "q_test_1", "A");
    let resp = ResponseRepository.getBySessionId(sessionId);
    assert.strictEqual(resp["q_test_1"].selectedAnswer, "A");

    // Change answer before submit (FR-05)
    ResponseRepository.saveAnswer(sessionId, "q_test_1", "B");
    resp = ResponseRepository.getBySessionId(sessionId);
    assert.strictEqual(resp["q_test_1"].selectedAnswer, "B", "User can change answer before submission");
  });

  it("Step 5 & 6: submits quiz, calculates score, reveals explanations, and launches remedial", () => {
    const sessionId = "sess_e2e_scoring";
    const questions = [
      {
        id: "q_sc_1",
        subjectId: "fisika",
        topicId: "dinamika",
        level: "SMA" as const,
        type: "pilihan_ganda" as const,
        stem: "Soal 1",
        options: [{ key: "A" as const, text: "A" }],
        correctAnswer: "A" as const,
        explanation: "Penjelasan 1",
        isAiGenerated: true,
        difficulty: "sedang" as const,
        sourceType: "curated_bank" as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: "q_sc_2",
        subjectId: "fisika",
        topicId: "dinamika",
        level: "SMA" as const,
        type: "pilihan_ganda" as const,
        stem: "Soal 2",
        options: [{ key: "B" as const, text: "B" }],
        correctAnswer: "B" as const,
        explanation: "Penjelasan 2",
        isAiGenerated: true,
        difficulty: "sedang" as const,
        sourceType: "curated_bank" as const,
        createdAt: new Date().toISOString(),
      },
    ];
    QuestionRepository.saveBatch(questions);

    const session: PracticeSession = {
      id: sessionId,
      userId,
      config: {
        subjectId: "fisika",
        topicId: "dinamika",
        questionCount: 2,
        mode: "reguler",
      },
      status: "active",
      questionIds: ["q_sc_1", "q_sc_2"],
      score: null,
      correctCount: null,
      wrongCount: null,
      emptyCount: null,
      startedAt: new Date().toISOString(),
    };
    SessionRepository.create(session);

    // Answer 1 correct (A), 1 wrong (C)
    ResponseRepository.saveAnswer(sessionId, "q_sc_1", "A");
    ResponseRepository.saveAnswer(sessionId, "q_sc_2", "C" as any);

    const responses = ResponseRepository.getBySessionId(sessionId);
    const evaluation = evaluatePracticeSession({
      session,
      questions,
      responses,
    });

    // Score: 1 correct out of 2 = 50%
    assert.strictEqual(evaluation.correctCount, 1);
    assert.strictEqual(evaluation.wrongCount, 1);
    assert.strictEqual(evaluation.scorePercentage, 50.0);

    SessionRepository.update(sessionId, {
      status: "completed",
      score: evaluation.scorePercentage,
      correctCount: evaluation.correctCount,
      wrongCount: evaluation.wrongCount,
      emptyCount: evaluation.emptyCount,
    });

    const completedSession = SessionRepository.getById(sessionId);
    assert.strictEqual(completedSession?.status, "completed");
    assert.strictEqual(completedSession?.score, 50.0);

    // Remedial creation (US-04): wrong question q_sc_2 selected
    const failedQuestions = evaluation.items.filter((item) => !item.isCorrect);
    assert.strictEqual(failedQuestions.length, 1);
    assert.strictEqual(failedQuestions[0].question.id, "q_sc_2");

    const remedialSessionId = "sess_e2e_remedial";
    const remedialSession: PracticeSession = {
      id: remedialSessionId,
      userId,
      config: {
        ...session.config,
        isRemedial: true,
        parentSessionId: session.id,
        questionCount: failedQuestions.length,
      },
      status: "active",
      questionIds: failedQuestions.map((f) => f.question.id),
      score: null,
      correctCount: null,
      wrongCount: null,
      emptyCount: null,
      startedAt: new Date().toISOString(),
    };
    SessionRepository.create(remedialSession);

    // Assert initial session score has NOT changed (FR-10)
    const initialSessionAfterRemedial = SessionRepository.getById(sessionId);
    assert.strictEqual(initialSessionAfterRemedial?.score, 50.0, "Initial score remains untouched");
  });
});
