import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6SpjIWYZcGm0M-nt2oG5vdklAdGyTvCA",
  authDomain: "hospitalschedule-d9267.firebaseapp.com",
  projectId: "hospitalschedule-d9267",
  storageBucket: "hospitalschedule-d9267.firebasestorage.app",
  messagingSenderId: "145941384801",
  appId: "1:145941384801:web:177a6ac848689225ce6420",
  measurementId: "G-BB1JCMYJJ3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const members = [
  "媽咪",
  "阿哥",
  "細路",
  "姑姐",
  "舅父"
];

function getFamily() {
  const m = location.hash.match(/family=([^&]+)/);
  return m ? m[1] : "default";
}

const family = getFamily();

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function label(d) {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const x = new Date(d);
  x.setHours(0, 0, 0, 0);

  const diff = (x - today) / 86400000;

  if (diff === 0) return "今日";
  if (diff === 1) return "聽日";

  return d.toLocaleDateString("zh-HK", {
    weekday: "short",
    month: "numeric",
    day: "numeric"
  });
}

const container = document.getElementById("schedule");

function checkboxList(group, selected = []) {

  const list = [...members, "其他"];

  return `
<div class="member-list">
${list.map(m => `
<label>
<input type="checkbox" value="${m}" data-group="${group}" ${selected.includes(m) ? "checked" : ""}>
${m === "其他" ? "其他(備注)" : m}
</label>
`).join("")}
</div>
`;
}

function createSlot(date, key, title, data) {

  const slot = document.createElement("div");
  slot.className = "slot";

  slot.innerHTML = `
<div class="slot-title">${title}</div>

<label>去醫院</label>
${checkboxList("visit", data?.visitor || [])}

<label>帶嘢食</label>
${checkboxList("food", data?.food || [])}

<label>備注</label>
<textarea placeholder="例如：粥、水果">${data?.remark || ""}</textarea>
`;

  const visitBoxes = [...slot.querySelectorAll('input[data-group="visit"]')];
  const foodBoxes = [...slot.querySelectorAll('input[data-group="food"]')];
  const remark = slot.querySelector("textarea");

  function getChecked(list) {
    return list.filter(i => i.checked).map(i => i.value);
  }

  // food → visit 自動勾
foodBoxes.forEach(foodBox => {

  foodBox.addEventListener("change", () => {

    const name = foodBox.value;

    const visitBox = slot.querySelector(
      `input[data-group="visit"][value="${name}"]`
    );

    if (visitBox) {
      visitBox.checked = foodBox.checked;
    }

    save();

  });

});

  visitBoxes.forEach(v => v.onchange = save)
  foodBoxes.forEach(f => f.onchange = save)

  remark.onblur = save

  let timer;

  function save() {

    clearTimeout(timer);

    timer = setTimeout(async () => {

      await setDoc(
        doc(db, "families", family, "days", date),
        {
          [key]: {
            visitor: getChecked(visitBoxes),
            food: getChecked(foodBoxes),
            remark: remark.value
          },
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

    }, 300);

  }

  return slot;
}

for (let i = 0; i < 7; i++) {

  const d = new Date();
  d.setDate(d.getDate() + i);

  const date = formatDate(d);

  const dayDiv = document.createElement("div");
  dayDiv.className = "day";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const check = new Date(d);
  check.setHours(0, 0, 0, 0);

  if (check.getTime() === today.getTime()) {
    dayDiv.classList.add("today");
  }

  const star = check.getTime() === today.getTime() ? "⭐" : "";

  dayDiv.innerHTML = `
<div class="day-title">
${label(d)} ${star} (${date})
</div>
`;

  container.appendChild(dayDiv);

  onSnapshot(
    doc(db, "families", family, "days", date),
    snap => {

      const data = snap.exists() ? snap.data() : {};

      dayDiv.innerHTML = `
<div class="day-title">
${label(d)} ${star} (${date})
</div>
`;

      dayDiv.appendChild(createSlot(date, "noon", "下午", data.noon));
      dayDiv.appendChild(createSlot(date, "night", "晚上", data.night));

    }
  );

}

document.getElementById("copyYesterday").onclick = async () => {

  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const t = formatDate(today);
  const y = formatDate(yesterday);

  const snap = await getDoc(doc(db, "families", family, "days", y));

  if (!snap.exists()) {
    alert("昨日沒有資料");
    return;
  }

  await setDoc(
    doc(db, "families", family, "days", t),
    snap.data(),
    { merge: true }
  );

  alert("已複製昨日安排");

};