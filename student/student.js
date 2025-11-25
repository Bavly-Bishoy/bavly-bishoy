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

/* ---------- عناصر DOM ---------- */
const examTitle = document.getElementById("examTitle");
const examForm = document.getElementById("examForm");
const submitBtn = document.getElementById("submitBtn");
const studentNameInput = document.getElementById("studentName");

/* ---------- examId من URL (مثلاً: student.html?examId=ABC) ---------- */
const params = new URLSearchParams(window.location.search);
const examId = params.get("examId");

if (!examId) {
  examTitle.textContent =
    "❌ لا يوجد examId في الرابط. افتح الصفحة برابط الامتحان.";
}

// تحميل الامتحان من Firebase
async function loadExam() {
  if (!examId) return;
  const examRef = ref(db, `exams/${examId}`);
  const snap = await get(examRef);

  if (!snap.exists()) {
    examTitle.textContent = "❌ الامتحان غير موجود.";
    return;
  }

  const exam = snap.val();
  examTitle.textContent = exam.name || "امتحان";

  // render questions
  exam.questions.forEach((q, idx) => {
    const box = document.createElement("div");
    box.className = "question-box";
    box.dataset.qindex = idx;

    let inner = `<p><strong>${idx + 1}.</strong> ${q.text}</p>`;

    if (q.type === "multiple") {
      // q.options is array of {text, correct}
      q.options.forEach((opt, oi) => {
        inner += `
          <label>
            <input type="radio" name="q${idx}" value="${escapeHtml(opt.text)}">
            ${escapeHtml(opt.text)}
          </label>
        `;
      });
    } else if (q.type === "truefalse") {
      inner += `
        <label><input type="radio" name="q${idx}" value="true"> صح ✅</label>
        <label><input type="radio" name="q${idx}" value="false"> خطأ ❌</label>
      `;
    } else {
      // essay
      inner += `<textarea name="q${idx}" placeholder="اكتب إجابتك هنا..."></textarea>`;
    }

    box.innerHTML = inner;
    examForm.appendChild(box);
  });
}

function escapeHtml(s) {
  if (!s) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// جمع الإجابات وحفظها ثم تحويل لصفحة النتيجة
submitBtn.addEventListener("click", () => {
  const studentName = studentNameInput.value.trim();
  if (!studentName) return alert("من فضلك اكتب اسمك");

  // اجمع الإجابات
  const answers = {};
  const boxes = document.querySelectorAll(".question-box");
  boxes.forEach((box, idx) => {
    const qname = `q${idx}`;
    const radio = box.querySelector(`input[name="${qname}"]:checked`);
    const textarea = box.querySelector(`textarea[name="${qname}"]`);
    if (radio) answers[qname] = radio.value;
    else if (textarea) answers[qname] = textarea.value.trim();
    else answers[qname] = "";
  });

  // خزن في localStorage (بنقله للصفحة التانية)
  localStorage.setItem("studentAnswers", JSON.stringify(answers));
  localStorage.setItem("studentName", studentName);
  localStorage.setItem("examId", examId);

  // روح لصفحة النتيجة — ملاحظة: المسار النسبي يفترض result/ في نفس المستوى
  window.location.href =
    "../result/result.html?examId=" + encodeURIComponent(examId);
});

loadExam();

