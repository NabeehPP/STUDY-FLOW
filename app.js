/* StudyFlow — Engineering Entrance Prep */

const STORAGE_KEY = "studyflow_data";
const LEGACY_KEY = "preptrack_data";

const QUOTES = [
  "Small steps today build your rank tomorrow.",
  "Consistency beats intensity. Show up every day.",
  "One chapter closer than yesterday — keep going.",
  "Your future self will thank you for this hour.",
  "Focus on progress, not perfection.",
  "Every problem solved is practice for exam day.",
  "Stay in flow. Trust the process.",
];

const PHASES = [
  {
    id: "foundation",
    name: "Foundation",
    hint: "Current phase",
    desc: "Master NCERT fundamentals across all three subjects. Focus on clarity over speed.",
    milestones: [
      "Complete Physics NCERT theory",
      "Complete Chemistry NCERT theory",
      "Complete Maths basics & formulas",
      "Solve 50 concept-level problems per subject",
    ],
  },
  {
    id: "practice",
    name: "Practice",
    hint: "Current phase",
    desc: "Move to reference books and chapter-wise problem sets. Build accuracy.",
    milestones: [
      "Finish 3 chapters per subject (advanced)",
      "Maintain 80%+ accuracy on easy sets",
      "Create formula & reaction sheets",
      "Weekly subject-wise tests",
    ],
  },
  {
    id: "revision",
    name: "Revision",
    hint: "Current phase",
    desc: "Revise all topics using short notes. Focus on weak areas.",
    milestones: [
      "First full syllabus revision done",
      "Weak topics re-studied",
      "Flashcards for all formulas",
      "Speed drills — 30 min sprints",
    ],
  },
  {
    id: "mocks",
    name: "Mock Tests",
    hint: "Current phase",
    desc: "Full-length mocks under timed conditions. Analyze every mistake.",
    milestones: [
      "10+ full mock tests completed",
      "Error log maintained",
      "Time management strategy set",
      "Score improving week over week",
    ],
  },
  {
    id: "sprint",
    name: "Final Sprint",
    hint: "Current phase",
    desc: "Light revision, formula refresh, and confidence building before exam day.",
    milestones: [
      "Quick revision of all weak points",
      "2 final mock tests",
      "Exam day strategy finalized",
      "Mind calm, body rested",
    ],
  },
];

const DEFAULT_SUBJECTS = {
  physics: {
    name: "Physics",
    color: "#1e40af",
    topics: [
      { name: "Mechanics", progress: 0 },
      { name: "Thermodynamics", progress: 0 },
      { name: "Electrostatics & Current", progress: 0 },
      { name: "Magnetism & EMI", progress: 0 },
      { name: "Optics", progress: 0 },
      { name: "Modern Physics", progress: 0 },
    ],
  },
  chemistry: {
    name: "Chemistry",
    color: "#2563eb",
    topics: [
      { name: "Physical Chemistry", progress: 0 },
      { name: "Inorganic Chemistry", progress: 0 },
      { name: "Organic Chemistry", progress: 0 },
      { name: "Coordination Compounds", progress: 0 },
      { name: "Biomolecules & Polymers", progress: 0 },
    ],
  },
  mathematics: {
    name: "Mathematics",
    color: "#3b82f6",
    topics: [
      { name: "Algebra", progress: 0 },
      { name: "Trigonometry", progress: 0 },
      { name: "Coordinate Geometry", progress: 0 },
      { name: "Calculus", progress: 0 },
      { name: "Vectors & 3D", progress: 0 },
      { name: "Probability & Statistics", progress: 0 },
    ],
  },
};

const SLOTS = ["morning", "afternoon", "evening", "night"];
const SLOT_LABELS = { morning: "Morning", afternoon: "Afternoon", evening: "Evening", night: "Night" };

let state = loadState();
let modalContext = null;
let backlogFilter = "all";

function loadState() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) raw = localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const parsed = mergeDefaults(JSON.parse(raw));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }
  } catch (_) {}
  return getDefaultState();
}

function getDefaultState() {
  return {
    examDate: null,
    examName: "",
    prepTotalDays: 500,
    streak: 0,
    lastActiveDate: null,
    currentPhase: "foundation",
    phaseProgress: Object.fromEntries(PHASES.map((p) => [p.id, { milestones: p.milestones.map(() => false) }])),
    subjects: JSON.parse(JSON.stringify(DEFAULT_SUBJECTS)),
    dailyTasks: {},
    backlogs: [],
  };
}

function mergeDefaults(parsed) {
  const base = getDefaultState();
  return {
    ...base,
    ...parsed,
    subjects: { ...base.subjects, ...parsed.subjects },
    phaseProgress: { ...base.phaseProgress, ...parsed.phaseProgress },
    dailyTasks: parsed.dailyTasks || {},
    backlogs: parsed.backlogs || [],
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getTodayTasks() {
  return state.dailyTasks[todayKey()] || [];
}

function updateStreak() {
  const today = todayKey();
  if (state.lastActiveDate === today) return;

  const yesterday = yesterdayKey();
  if (state.lastActiveDate === yesterday) {
    state.streak += 1;
  } else {
    state.streak = state.lastActiveDate ? 1 : 1;
  }
  state.lastActiveDate = today;
  saveState();
}

function subjectOverall(subject) {
  const topics = state.subjects[subject]?.topics || [];
  if (!topics.length) return 0;
  return Math.round(topics.reduce((s, t) => s + t.progress, 0) / topics.length);
}

function overallReadiness() {
  const vals = Object.keys(state.subjects).map(subjectOverall);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function todayProgress() {
  const tasks = getTodayTasks();
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);
}

function activeBacklogs() {
  return state.backlogs.filter((b) => !b.resolved);
}

function isOverdue(dateStr) {
  return dateStr && dateStr < todayKey();
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function goToView(view) {
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.querySelector(`[data-view="${view}"]`)?.classList.add("active");
  document.getElementById("view-" + view)?.classList.add("active");
}

/* ── Render ── */

function setGreeting() {
  const h = new Date().getHours();
  const text = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  document.getElementById("greeting").textContent = text;
}

function setQuote() {
  const day = new Date().getDate();
  document.getElementById("motivation-quote").textContent = QUOTES[day % QUOTES.length];
}

function setExamCountdown() {
  const nameEl = document.getElementById("exam-name");
  const daysEl = document.getElementById("exam-days");
  const barEl = document.getElementById("exam-bar");

  if (!state.examDate) {
    nameEl.textContent = "Set your exam date";
    daysEl.textContent = "—";
    barEl.style.width = "0%";
    return;
  }

  const diff = Math.ceil((new Date(state.examDate) - new Date()) / 86400000);
  nameEl.textContent = state.examName || "Target exam";

  if (diff < 0) {
    daysEl.textContent = "Exam passed";
    barEl.style.width = "100%";
  } else if (diff === 0) {
    daysEl.textContent = "Exam today";
    barEl.style.width = "100%";
  } else {
    daysEl.textContent = `${diff} Days Left`;
    const total = state.prepTotalDays || 500;
    const done = Math.max(0, total - diff);
    barEl.style.width = Math.min(100, Math.round((done / total) * 100)) + "%";
  }
}

function renderDashboard() {
  const tasks = getTodayTasks();
  const tp = todayProgress();

  document.getElementById("today-progress").textContent = tp + "%";
  document.getElementById("today-bar").style.width = tp + "%";
  document.getElementById("overall-progress").textContent = overallReadiness() + "%";
  document.getElementById("overall-bar").style.width = overallReadiness() + "%";

  const bl = activeBacklogs().length;
  document.getElementById("backlog-count").textContent = bl;
  document.getElementById("backlog-badge").textContent = bl;
  document.getElementById("backlog-badge").classList.toggle("zero", bl === 0);

  const phase = PHASES.find((p) => p.id === state.currentPhase) || PHASES[0];
  document.getElementById("current-phase").textContent = phase.name;
  document.getElementById("phase-hint").textContent = phase.hint;

  const streakEl = document.getElementById("streak-pill");
  streakEl.textContent = `${state.streak} day streak`;

  const dashTasks = document.getElementById("dashboard-tasks");
  if (!tasks.length) {
    dashTasks.innerHTML = '<li class="muted">No tasks yet — open Today to add some.</li>';
  } else {
    dashTasks.innerHTML = tasks
      .slice(0, 5)
      .map(
        (t) => `
      <li>
        <span class="dot ${t.done ? "done" : ""}"></span>
        <span class="${t.done ? "done-text" : ""}">${escapeHtml(t.title)}</span>
      </li>`
      )
      .join("");
  }

  document.getElementById("dashboard-subjects").innerHTML = Object.entries(state.subjects)
    .map(([key, sub]) => {
      const pct = subjectOverall(key);
      return `
      <div class="subject-line">
        <span>${sub.name}</span>
        <div class="bar"><div class="bar-fill" style="width:${pct}%;background:${sub.color}"></div></div>
        <span>${pct}%</span>
      </div>`;
    })
    .join("");
}

function renderDaily() {
  const tasks = getTodayTasks();
  const done = tasks.filter((t) => t.done).length;

  document.getElementById("daily-date").textContent = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  document.getElementById("daily-summary").textContent = `${done} / ${tasks.length} done`;

  document.getElementById("time-blocks").innerHTML = SLOTS.map((slot) => {
    const slotTasks = tasks.filter((t) => t.slot === slot);
    const slotDone = slotTasks.filter((t) => t.done).length;
    const complete = slotTasks.length && slotDone === slotTasks.length;
    return `
    <div class="slot">
      <div class="slot-label">${SLOT_LABELS[slot]}</div>
      <div class="slot-count ${complete ? "complete" : ""}">${slotDone}/${slotTasks.length}</div>
    </div>`;
  }).join("");

  const list = document.getElementById("daily-task-list");
  if (!tasks.length) {
    list.innerHTML = '<li class="muted" style="padding:0.5rem 0">Add your first task to start the day.</li>';
    return;
  }

  list.innerHTML = tasks
    .map(
      (t) => `
    <li class="task-item ${t.done ? "done" : ""}">
      <button class="task-check ${t.done ? "checked" : ""}" data-action="toggle-task" data-id="${t.id}">${t.done ? "✓" : ""}</button>
      <div class="task-body">
        <div class="task-title">${escapeHtml(t.title)}</div>
        <div class="task-meta">
          <span class="tag tag-${t.slot}">${SLOT_LABELS[t.slot]}</span>
          ${t.subject ? `<span>${escapeHtml(t.subject)}</span>` : ""}
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn danger" data-action="delete-task" data-id="${t.id}">✕</button>
      </div>
    </li>`
    )
    .join("");
}

function renderBacklogs() {
  let items = activeBacklogs();
  if (backlogFilter === "high") items = items.filter((b) => b.priority === "high");
  if (backlogFilter === "overdue") items = items.filter((b) => isOverdue(b.dueDate));

  document.getElementById("backlog-empty").classList.toggle("hidden", items.length > 0);

  document.getElementById("backlog-list").innerHTML = items
    .map(
      (b) => `
    <li class="task-item backlog-item ${isOverdue(b.dueDate) ? "overdue" : ""}">
      <div class="task-body">
        <div class="task-title">${escapeHtml(b.title)}</div>
        <div class="task-meta">
          <span class="tag tag-priority-${b.priority}">${b.priority}</span>
          ${b.subject ? `<span>${escapeHtml(b.subject)}</span>` : ""}
          ${b.dueDate ? `<span>Due ${b.dueDate}</span>` : ""}
        </div>
        ${b.notes ? `<div class="task-meta">${escapeHtml(b.notes)}</div>` : ""}
      </div>
      <div class="task-actions">
        <button class="icon-btn" data-action="schedule-backlog" data-id="${b.id}" title="Add to today">+</button>
        <button class="icon-btn" data-action="resolve-backlog" data-id="${b.id}" title="Done">✓</button>
        <button class="icon-btn danger" data-action="delete-backlog" data-id="${b.id}">✕</button>
      </div>
    </li>`
    )
    .join("");
}

function phaseCompletion(phaseId) {
  const prog = state.phaseProgress[phaseId];
  if (!prog?.milestones?.length) return 0;
  return Math.round((prog.milestones.filter(Boolean).length / prog.milestones.length) * 100);
}

function renderPhases() {
  const currentIdx = PHASES.findIndex((p) => p.id === state.currentPhase);

  document.getElementById("phase-timeline").innerHTML = PHASES.map((p, i) => {
    const pct = phaseCompletion(p.id);
    const cls = [i < currentIdx ? "done" : "", p.id === state.currentPhase ? "active" : ""].filter(Boolean).join(" ");
    return `
    <div class="phase ${cls}" data-phase="${p.id}">
      <div class="phase-num">${i < currentIdx ? "✓" : i + 1}</div>
      <div class="phase-name">${p.name}</div>
      <div class="phase-pct">${pct}%</div>
    </div>`;
  }).join("");

  showPhaseDetail(state.currentPhase);
}

function showPhaseDetail(phaseId) {
  const phase = PHASES.find((p) => p.id === phaseId);
  if (!phase) return;

  document.getElementById("phase-detail-title").textContent = phase.name;
  document.getElementById("phase-detail-desc").textContent = phase.desc;

  const prog = state.phaseProgress[phaseId];
  document.getElementById("phase-milestones").innerHTML = phase.milestones
    .map(
      (m, i) => `
    <div class="check-item">
      <button class="milestone-check ${prog.milestones[i] ? "done" : ""}" data-action="toggle-milestone" data-phase="${phaseId}" data-index="${i}">
        ${prog.milestones[i] ? "✓" : ""}
      </button>
      <span class="${prog.milestones[i] ? "done-text" : ""}">${escapeHtml(m)}</span>
    </div>`
    )
    .join("");
}

function renderSubjects() {
  document.getElementById("subjects-grid").innerHTML = Object.entries(state.subjects)
    .map(([key, sub]) => {
      const overall = subjectOverall(key);
      const topicsHtml = sub.topics
        .map(
          (t, i) => `
        <div class="topic">
          <span>${escapeHtml(t.name)}</span>
          <input type="range" min="0" max="100" value="${t.progress}" data-action="topic-progress" data-subject="${key}" data-index="${i}" />
          <span class="topic-pct">${t.progress}%</span>
        </div>`
        )
        .join("");

      return `
      <div class="subject-card" data-subject="${key}">
        <h3>${sub.name}</h3>
        <div class="subject-pct">${overall}<span>%</span></div>
        <div class="bar"><div class="bar-fill" style="width:${overall}%;background:${sub.color}"></div></div>
        <div class="topics">${topicsHtml}</div>
        <button class="add-topic" data-action="add-topic" data-subject="${key}">+ Add topic</button>
      </div>`;
    })
    .join("");
}

function renderAll() {
  setGreeting();
  setQuote();
  setExamCountdown();
  renderDashboard();
  renderDaily();
  renderBacklogs();
  renderPhases();
  renderSubjects();
}

/* ── Navigation ── */

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => goToView(btn.dataset.view));
});

document.getElementById("brand-home")?.addEventListener("click", (e) => {
  e.preventDefault();
  goToView("dashboard");
});

document.querySelectorAll("[data-goto]").forEach((btn) => {
  btn.addEventListener("click", () => goToView(btn.dataset.goto));
});

/* ── Modal ── */

function openModal(title, bodyHtml, onSave) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML = bodyHtml;
  document.getElementById("modal-overlay").classList.remove("hidden");
  modalContext = { onSave };
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  modalContext = null;
}

document.getElementById("modal-close").addEventListener("click", closeModal);
document.getElementById("modal-cancel").addEventListener("click", closeModal);
document.getElementById("modal-overlay").addEventListener("click", (e) => {
  if (e.target.id === "modal-overlay") closeModal();
});
document.getElementById("modal-save").addEventListener("click", () => {
  modalContext?.onSave?.();
});

function taskFormHtml(task = {}) {
  return `
    <div class="field">
      <label>Task</label>
      <input type="text" id="f-title" placeholder="e.g. Mechanics — 20 problems" value="${escapeHtml(task.title || "")}" />
    </div>
    <div class="field-row">
      <div class="field">
        <label>Time slot</label>
        <select id="f-slot">
          ${SLOTS.map((s) => `<option value="${s}" ${task.slot === s ? "selected" : ""}>${SLOT_LABELS[s]}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Subject</label>
        <select id="f-subject">
          <option value="">—</option>
          <option value="Physics" ${task.subject === "Physics" ? "selected" : ""}>Physics</option>
          <option value="Chemistry" ${task.subject === "Chemistry" ? "selected" : ""}>Chemistry</option>
          <option value="Mathematics" ${task.subject === "Mathematics" ? "selected" : ""}>Mathematics</option>
        </select>
      </div>
    </div>`;
}

function backlogFormHtml(item = {}) {
  return `
    <div class="field">
      <label>Topic / task</label>
      <input type="text" id="f-title" placeholder="e.g. Organic reactions" value="${escapeHtml(item.title || "")}" />
    </div>
    <div class="field-row">
      <div class="field">
        <label>Priority</label>
        <select id="f-priority">
          <option value="high" ${item.priority === "high" ? "selected" : ""}>High</option>
          <option value="medium" ${(!item.priority || item.priority === "medium") ? "selected" : ""}>Medium</option>
          <option value="low" ${item.priority === "low" ? "selected" : ""}>Low</option>
        </select>
      </div>
      <div class="field">
        <label>Due date</label>
        <input type="date" id="f-due" value="${item.dueDate || ""}" />
      </div>
    </div>
    <div class="field">
      <label>Subject</label>
      <select id="f-subject">
        <option value="">—</option>
        <option value="Physics" ${item.subject === "Physics" ? "selected" : ""}>Physics</option>
        <option value="Chemistry" ${item.subject === "Chemistry" ? "selected" : ""}>Chemistry</option>
        <option value="Mathematics" ${item.subject === "Mathematics" ? "selected" : ""}>Mathematics</option>
      </select>
    </div>
    <div class="field">
      <label>Notes</label>
      <textarea id="f-notes" placeholder="Optional">${escapeHtml(item.notes || "")}</textarea>
    </div>`;
}

/* ── Actions ── */

document.getElementById("add-daily-task").addEventListener("click", () => {
  openModal("Add task", taskFormHtml(), () => {
    const title = document.getElementById("f-title").value.trim();
    if (!title) return;
    const key = todayKey();
    if (!state.dailyTasks[key]) state.dailyTasks[key] = [];
    state.dailyTasks[key].push({
      id: uid(),
      title,
      slot: document.getElementById("f-slot").value,
      subject: document.getElementById("f-subject").value,
      done: false,
    });
    saveState();
    closeModal();
    renderAll();
  });
});

document.getElementById("copy-yesterday").addEventListener("click", () => {
  const yTasks = state.dailyTasks[yesterdayKey()] || [];
  if (!yTasks.length) return;
  const key = todayKey();
  if (!state.dailyTasks[key]) state.dailyTasks[key] = [];
  yTasks.forEach((t) => {
    state.dailyTasks[key].push({ ...t, id: uid(), done: false });
  });
  saveState();
  renderAll();
});

document.getElementById("add-backlog").addEventListener("click", () => {
  openModal("Add backlog", backlogFormHtml(), () => {
    const title = document.getElementById("f-title").value.trim();
    if (!title) return;
    state.backlogs.push({
      id: uid(),
      title,
      priority: document.getElementById("f-priority").value,
      dueDate: document.getElementById("f-due").value,
      subject: document.getElementById("f-subject").value,
      notes: document.getElementById("f-notes").value.trim(),
      resolved: false,
      createdAt: todayKey(),
    });
    saveState();
    closeModal();
    renderAll();
  });
});

document.getElementById("edit-exam-date").addEventListener("click", () => {
  openModal(
    "Exam countdown",
    `<div class="field"><label>Exam name</label><input type="text" id="f-exam-name" placeholder="e.g. JEE Main 2027" value="${escapeHtml(state.examName || "")}" /></div>
     <div class="field"><label>Exam date</label><input type="date" id="f-exam" value="${state.examDate || ""}" /></div>`,
    () => {
      state.examName = document.getElementById("f-exam-name").value.trim();
      state.examDate = document.getElementById("f-exam").value || null;
      saveState();
      closeModal();
      renderAll();
    }
  );
});

document.querySelectorAll(".chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    backlogFilter = btn.dataset.filter;
    renderBacklogs();
  });
});

document.getElementById("daily-task-list").addEventListener("click", handleAction);
document.getElementById("backlog-list").addEventListener("click", handleAction);
document.getElementById("phase-timeline").addEventListener("click", (e) => {
  const step = e.target.closest(".phase");
  if (!step) return;
  state.currentPhase = step.dataset.phase;
  saveState();
  renderPhases();
  renderDashboard();
});
document.getElementById("phase-milestones").addEventListener("click", handleAction);
document.getElementById("subjects-grid").addEventListener("click", handleAction);
document.getElementById("subjects-grid").addEventListener("input", handleAction);

function handleAction(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;

  if (action === "toggle-task") {
    const task = state.dailyTasks[todayKey()]?.find((t) => t.id === el.dataset.id);
    if (task) {
      task.done = !task.done;
      updateStreak();
      saveState();
      renderAll();
    }
  }

  if (action === "delete-task") {
    state.dailyTasks[todayKey()] = (state.dailyTasks[todayKey()] || []).filter((t) => t.id !== el.dataset.id);
    saveState();
    renderAll();
  }

  if (action === "resolve-backlog") {
    const item = state.backlogs.find((b) => b.id === el.dataset.id);
    if (item) {
      item.resolved = true;
      saveState();
      renderAll();
    }
  }

  if (action === "delete-backlog") {
    state.backlogs = state.backlogs.filter((b) => b.id !== el.dataset.id);
    saveState();
    renderAll();
  }

  if (action === "schedule-backlog") {
    const item = state.backlogs.find((b) => b.id === el.dataset.id);
    if (!item) return;
    const key = todayKey();
    if (!state.dailyTasks[key]) state.dailyTasks[key] = [];
    state.dailyTasks[key].push({
      id: uid(),
      title: item.title,
      slot: "afternoon",
      subject: item.subject,
      done: false,
    });
    item.resolved = true;
    saveState();
    renderAll();
    goToView("daily");
  }

  if (action === "toggle-milestone") {
    const idx = parseInt(el.dataset.index, 10);
    state.phaseProgress[el.dataset.phase].milestones[idx] = !state.phaseProgress[el.dataset.phase].milestones[idx];
    saveState();
    renderPhases();
    renderDashboard();
  }

  if (action === "topic-progress") {
    const idx = parseInt(el.dataset.index, 10);
    state.subjects[el.dataset.subject].topics[idx].progress = parseInt(el.value, 10);
    el.nextElementSibling.textContent = el.value + "%";
    const card = el.closest(".subject-card");
    const overall = subjectOverall(el.dataset.subject);
    card.querySelector(".subject-pct").innerHTML = `${overall}<span>%</span>`;
    card.querySelector(".bar-fill").style.width = overall + "%";
    saveState();
    renderDashboard();
  }

  if (action === "add-topic") {
    const subject = el.dataset.subject;
    openModal(
      "Add topic",
      `<div class="field"><label>Topic name</label><input type="text" id="f-topic" placeholder="e.g. Rotational Dynamics" /></div>`,
      () => {
        const name = document.getElementById("f-topic").value.trim();
        if (!name) return;
        state.subjects[subject].topics.push({ name, progress: 0 });
        saveState();
        closeModal();
        renderAll();
      }
    );
  }
}

updateStreak();
renderAll();
