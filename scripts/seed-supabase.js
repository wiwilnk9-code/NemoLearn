const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://epbepzjheexkeqivcoql.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwYmVwempoZWV4a2VxaXZjb3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3OTk2MDYsImV4cCI6MjEwOTM3NTYwNn0.OgUw0HkTKD6RWCYjqy0N78vtG9xFHIjaoPff6euaUE4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log("=== SEEDING NEMOLEARN TO SUPABASE ===");

  // Read backup or memory state
  const backupFile = path.resolve(__dirname, "../data/nemoquiz_backup_pre_migration.json");
  const raw = fs.readFileSync(backupFile, "utf-8");
  const dbData = JSON.parse(raw);

  // 1. Seed Users
  console.log("1. Seeding Users...");
  const usersList = Object.values(dbData.users || {});
  for (const u of usersList) {
    const { error } = await supabase.from("users").upsert({
      id: u.id,
      email: u.email,
      display_name: u.displayName,
      role: u.role,
      school: u.school || null,
      gender: u.gender || "rahasia",
      avatar_url: u.avatarUrl || null,
      status: u.status || "active",
      verification_status: u.verificationStatus || "unverified",
      nuptk: u.nuptk || null,
      subject: u.subject || null,
      portfolio_url: u.portfolioUrl || null,
      verification_note: u.verificationNote || null,
      permissions: u.permissions || [],
      created_at: u.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: u.lastActiveAt || new Date().toISOString(),
    });
    if (error) console.error(`Failed to upsert user ${u.id}:`, error.message);
  }
  console.log(`✓ Seeded ${usersList.length} users.`);

  // 2. Seed Subjects and Topics
  console.log("2. Seeding Subjects & Topics...");
  const subjectsList = Object.values(dbData.subjects || {});
  for (const s of subjectsList) {
    const { error: subErr } = await supabase.from("subjects").upsert({
      id: s.id,
      name: s.name,
      category: s.category,
      icon: s.icon || "BookOpen",
      created_at: new Date().toISOString(),
    });
    if (subErr) console.error(`Failed to upsert subject ${s.id}:`, subErr.message);

    if (Array.isArray(s.topics)) {
      for (const t of s.topics) {
        const { error: topErr } = await supabase.from("topics").upsert({
          id: t.id,
          subject_id: s.id,
          name: t.name,
          description: t.description || null,
          subtopics_json: t.subtopics || [],
          created_at: new Date().toISOString(),
        });
        if (topErr) console.error(`Failed to upsert topic ${t.id}:`, topErr.message);
      }
    }
  }
  console.log(`✓ Seeded ${subjectsList.length} subjects and topics.`);

  // 3. Seed Questions
  console.log("3. Seeding Questions...");
  const questionsList = Object.values(dbData.questions || {});
  const BATCH_SIZE = 25;
  for (let i = 0; i < questionsList.length; i += BATCH_SIZE) {
    const chunk = questionsList.slice(i, i + BATCH_SIZE).map((q) => ({
      id: q.id,
      subject_id: q.subjectId,
      topic_id: q.topicId,
      subtopic: q.subtopic || null,
      level: q.level || "SMA",
      type: q.type || "pilihan_ganda",
      stem: q.stem,
      options_json: q.options || [],
      correct_answer: q.correctAnswer,
      explanation: q.explanation || "",
      is_ai_generated: Boolean(q.isAiGenerated),
      difficulty: q.difficulty || "sedang",
      source_type: q.sourceType || "curated_bank",
      source_id: q.sourceId || null,
      status: q.status || "published",
      version: q.version || 1,
      hint: q.hint || null,
      created_at: q.createdAt || new Date().toISOString(),
    }));

    const { error: qErr } = await supabase.from("questions").upsert(chunk);
    if (qErr) console.error(`Failed to upsert question chunk ${i}:`, qErr.message);
  }
  console.log(`✓ Seeded ${questionsList.length} questions.`);

  // 4. Seed Website Settings
  console.log("4. Seeding Website Settings...");
  const { error: wsErr } = await supabase.from("website_settings").upsert({
    id: "global",
    site_name: "NemoLearn",
    tagline: "Platform Latihan Soal Adaptif SMA & AI Generator",
    description: "Sistem latihan soal cerdas kurikulum SMA dengan evaluasi IRT 3-PL dan generator AI berbasis standar Kemendikbudristek.",
    curriculum: "Kurikulum Merdeka SMA",
    logo_url: "/logo.png",
    enable_ai_generator: true,
    enable_irt_scoring: true,
    enable_pdf_export: true,
    maintenance_mode: false,
    allow_public_registration: true,
    app_info_json: {
      version: "v2.4.0-stable",
      buildNumber: "04.92.11",
      clusterId: "Cluster-Jakarta",
      region: "ap-southeast-3 (Jakarta)",
      environment: "production",
      nodeVersion: "v20.12.0",
    },
    maintenance_json: {
      enabled: false,
      scheduledStart: null,
      scheduledEnd: null,
      reason: "Pemeliharaan rutin server",
      allowedRoles: ["owner", "admin"],
      publicMessage: "Sistem sedang dalam peningkatan performa.",
    },
    broadcast_json: {
      active: true,
      message: "Selamat datang di NemoLearn — Platform Latihan Mandiri & Evaluasi Soal SMA Berbasis AI",
      type: "info",
      dismissible: true,
      expiresAt: null,
    },
    rate_limits_json: {
      freeTier: { dailyPromptLimit: 25, cooldownSeconds: 30, maxQuestionsPerPrompt: 10 },
      proTier: { burstLimitPerMinute: 60, autoBurstQueueing: true, maxQuestionsPerPrompt: 25 },
      enterpriseTier: { batchQuizLimit: 50, maxUploadMb: 250, dedicatedThroughput: true },
    },
    ai_routing_json: {
      primaryModel: "gemini-1.5-flash",
      primaryProvider: "gemini",
      fallbackAutoSwitch: true,
      fallbackModel: "gpt-4o-mini",
      tutorTemperature: 0.7,
      examTemperature: 0.2,
      timeoutMs: 20000,
    },
    security_json: {
      sessionLifetimeDays: 7,
      superadminMfaEnforced: false,
      wafShieldActive: true,
      dataRetentionDays: 90,
      hardwareTokenAllowed: true,
    },
    updated_at: new Date().toISOString(),
    updated_by: "system_migration",
  });
  if (wsErr) console.error("Failed to upsert website settings:", wsErr.message);
  else console.log("✓ Seeded website settings.");

  // 5. Seed System Logs
  console.log("5. Seeding System Logs...");
  const logsList = dbData.systemLogs || [];
  if (logsList.length > 0) {
    const logChunks = logsList.map((l) => ({
      id: l.id,
      level: l.level || "info",
      action: l.action,
      actor_id: l.actorId || null,
      actor_email: l.actorEmail || null,
      actor_name: l.actorName || null,
      actor_role: l.actorRole || null,
      target_type: l.targetType || null,
      target_id: l.targetId || null,
      ip_address: l.ipAddress || null,
      user_agent: l.userAgent || null,
      details: l.details || "",
      status: l.status || "SUCCESS",
      category: l.category || "system",
      payload: l.payload || {},
      created_at: l.timestamp || l.createdAt || new Date().toISOString(),
    }));
    const { error: logErr } = await supabase.from("system_logs").upsert(logChunks);
    if (logErr) console.error("Failed to seed system logs:", logErr.message);
    else console.log(`✓ Seeded ${logsList.length} system logs.`);
  }

  console.log("=== SEEDING COMPLETE ===");
}

runSeed().catch(console.error);
