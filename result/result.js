
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB0buA6cBJauJCGPoJIoQq93QvCNxip5ds",
  authDomain: "prep3-arabic.firebaseapp.com",
  databaseURL: "https://prep3-arabic-default-rtdb.firebaseio.com",
  projectId: "prep3-arabic",
  storageBucket: "prep3-arabic.firebasestorage.app",
  messagingSenderId: "1015444377566",
  appId: "1:1015444377566:web:3ec211c08df32384b5574f",
  measurementId: "G-8W1H5KR6MM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
/* ---------- DOM ---------- */
const examNameEl = document.getElementById("examName");
const studentNameDisplay = document.getElementById("studentNameDisplay");
const resultsContainer = document.getElementById("resultsContainer");
const summaryEl = document.getElementById("summary");

/* ---------- Data ---------- */
const answers = JSON.parse(localStorage.getItem("studentAnswers") || "{}");
const studentName = localStorage.getItem("studentName") || "غير معروف";
const examIdFromStorage = localStorage.getItem("examId");

const params = new URLSearchParams(window.location.search);
const examId = params.get("examId") || examIdFromStorage;

studentNameDisplay.textContent = studentName;

/* ---------- Apps Script ---------- */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwuI3jr90X_khH5yFwI0sIGto4YgFx0d8b3C4sgsenoC7XzOJIG0NwWvZM7Pc60Dm_C/exec";

/* ---------- تحميل وتصحيح ---------- */
async function loadAndGrade() {
  if (!examId) {
    examNameEl.textContent = "❌ examId غير موجود";
    return;
  }

  const examRef = ref(db, `exams/${examId}`);
  const snap = await get(examRef);

  if (!snap.exists()) {
    examNameEl.textContent = "❌ الامتحان غير موجود";
    return;
  }

  const exam = snap.val();
  examNameEl.textContent = exam.name || "امتحان";

  // تصحيح
  let correctCount = 0;
  const total = exam.questions.length;
  const details = [];

  exam.questions.forEach((q, idx) => {
    const key = `q${idx}`;
    const userAns = (answers[key] || "").toString();
    let isCorrect = false;
    let correctDisplay = "";

    if (q.type === "multiple") {
      const correctOp = Array.isArray(q.options) ? q.options.find(o => o.correct) : null;
      correctDisplay = correctOp ? correctOp.text : "";
      isCorrect = userAns === (correctOp ? correctOp.text : "");
    } else if (q.type === "truefalse") {
      correctDisplay = String(q.correct);
      isCorrect = userAns === String(q.correct);
    } else { 
      correctDisplay = q.correctAnswer || "";
      isCorrect = essayMatch(userAns, q.correctAnswer || "");
    }

    if (isCorrect) correctCount++;

    const div = document.createElement("div");
    div.className = `question-result ${isCorrect ? "correct" : "wrong"}`;
    div.innerHTML = `
      <p><strong>${idx + 1}.</strong> ${escapeHtml(q.text)}</p>
      <p><strong>إجابتك:</strong> ${escapeHtml(userAns || "لم يجب")}</p>
      ${ (q.type !== "essay") ? `<p><strong>الإجابة الصحيحة:</strong> ${escapeHtml(correctDisplay)}</p>` : `<p><strong>الإجابة النموذجية:</strong> ${escapeHtml(correctDisplay)}</p>`}
    `;
    resultsContainer.appendChild(div);

    details.push({
      index: idx,
      question: q.text,
      userAnswer: userAns,
      correctAnswer: correctDisplay,
      isCorrect
    });
  });

  const percent = Math.round((correctCount / total) * 100);
  summaryEl.innerHTML = `<h3>الدرجة: ${correctCount} / ${total} — (${percent}%)</h3>`;

  const resultObj = {
    examId,
    examName: exam.name || "",
    studentName,
    score: correctCount,
    total,
    percent,
    timestamp: Date.now(),
    details
  };

  try {
    await push(ref(db, `results/${examId}`), resultObj);
    console.log("✅ تم حفظ النتيجة في Firebase");
  } catch (err) {
    console.error("❌ خطأ في حفظ النتيجة:", err);
  }

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultObj)
    });
    const txt = await res.text();
    console.log("✅ Apps Script response:", txt);
  } catch (err) {
    console.error("❌ خطأ في إرسال للـ Google Sheet:", err);
  }
}

function escapeHtml(s) {
  if (!s) return "";
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function essayMatch(user, correct) {
  if (!user || !correct) return false;

  const clean = str => str
    .toLowerCase()
    .replace(/[^ء-يa-z0-9\s']/g, '')
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bdon't\b/g, 'do not')
    .trim();

  const normalize = word => {
    const synonyms = {
      fine: ["good", "well", "ok", "okay"],
      yes: ["yeah", "yep", "sure", "of course"],
      no: ["nope", "nah"],
      happy: ["glad", "pleased"],
      sad: ["unhappy", "upset"],
      thank: ["thanks", "thankyou", "thank you"],
    };
    for (const [base, list] of Object.entries(synonyms)) {
      if (list.includes(word)) return base;
    }
    return word;
  };

  const userWords = clean(user).split(/\s+/).map(normalize);
  const correctWords = clean(correct).split(/\s+/).map(normalize);

  if (userWords.length === 0 || correctWords.length === 0) return false;

  let matches = 0;
  correctWords.forEach(cw => {
    if (userWords.includes(cw)) matches++;
  });

  const matchRatio = matches / correctWords.length;
  return matchRatio >= 0.15; // تم تخفيض الحد من 30% إلى 15%
}

loadAndGrade();

