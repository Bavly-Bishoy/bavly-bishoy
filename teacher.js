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

const examsListContainer = document.getElementById("examsList");
const createExamBtn = document.getElementById("createExamBtn");

/* ---------- تحميل الامتحانات ---------- */
async function loadExams() {
  const examsRef = ref(db, "exams");
  const snapshot = await get(examsRef);

  if (!snapshot.exists()) {
    examsListContainer.innerHTML = "❌ لا توجد امتحانات حالياً.";
    return;
  }

  const exams = Object.entries(snapshot.val());
  examsListContainer.innerHTML = "";

  exams.forEach(([id, exam]) => {
    const examItem = document.createElement("div");
    examItem.className = "exam-item";
    examItem.innerHTML = `
      <span><strong>${exam.name}</strong> (ID: ${id})</span>
      <div class="btn-group">
        <button class="editBtn" data-id="${id}">✏️ تعديل</button>
        <button class="deleteBtn" data-id="${id}">🗑️ حذف</button>
        <button class="copyLinkBtn" data-id="${id}">🔗 نسخ الرابط</button>
        <button class="viewBtn" data-id="${id}">👁️ فتح كطالب</button>
      </div>
    `;
    examsListContainer.appendChild(examItem);
  });
}

/* ---------- حذف امتحان ---------- */
async function deleteExam(examId) {
  if (!confirm("هل أنت متأكد أنك تريد حذف هذا الامتحان نهائياً؟")) return;

  const examRef = ref(db, `exams/${examId}`);
  await remove(examRef);
  alert("✅ تم حذف الامتحان بنجاح!");
  loadExams();
}

/* ---------- تعديل امتحان ---------- */
function editExam(examId) {
  // بيروح لصفحة إنشاء امتحان ويفتح نفس الامتحان للتعديل
  window.location.href = `make_new_quiz/make_new_quiz.html?edit=${examId}`;
}

/* ---------- نسخ رابط الطالب ---------- */
function copyExamLink(examId) {
  const examUrl = `https://bavly-bishoy.github.io/Mr.Abanob-exams/student/student.html?examId=${examId}`;
  navigator.clipboard.writeText(examUrl).then(() => {
    alert("✅ تم نسخ الرابط:\n" + examUrl);
  });
}

function openAsStudent(examId) {
  const url = `https://bavly-bishoy.github.io/Mr.Abanob-exams/student/student.html?examId=${examId}`;
  window.open(url, "_blank");
}

/* ---------- أحداث الأزرار ---------- */
examsListContainer.addEventListener("click", (event) => {
  const examId = event.target.dataset.id;

  if (event.target.classList.contains("deleteBtn")) deleteExam(examId);
  if (event.target.classList.contains("editBtn")) editExam(examId);
  if (event.target.classList.contains("copyLinkBtn")) copyExamLink(examId);
  if (event.target.classList.contains("viewBtn")) openAsStudent(examId);
});

/* ---------- زر إنشاء امتحان جديد ---------- */
createExamBtn.addEventListener("click", () => {
  window.location.href = "make_new_quiz/make_new_quiz.html";
});

/* ---------- تحميل الامتحانات عند الفتح ---------- */
loadExams();



