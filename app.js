import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
getFirestore,
doc,
onSnapshot,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


// 🔧 貼你 Firebase config
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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


// family code
function getFamily(){

const match = location.hash.match(/family=([^&]+)/);

return match ? match[1] : "default";

}

const family = getFamily();

document.getElementById("status").innerText =
"Family: " + family;


// format date
function formatDate(d){

const y = d.getFullYear();
const m = String(d.getMonth()+1).padStart(2,"0");
const day = String(d.getDate()).padStart(2,"0");

return `${y}-${m}-${day}`;

}


// label
function label(d){

const today = new Date();
today.setHours(0,0,0,0);

const x = new Date(d);
x.setHours(0,0,0,0);

const diff = (x - today) / 86400000;

if(diff===0) return "今日";
if(diff===1) return "聽日";

return d.toLocaleDateString("zh-HK",{weekday:"short",month:"numeric",day:"numeric"});

}


const container = document.getElementById("schedule");


// 7 days
const days = [];

for(let i=0;i<7;i++){

const d = new Date();
d.setDate(d.getDate()+i);

days.push(d);

}


// create UI
function createSlot(date,key,title,data){

const slot = document.createElement("div");
slot.className="slot";

slot.innerHTML=`
<div class="slot-title">${title}</div>

<div class="row">
<div>
<label>去醫院</label>
<input data-field="visitor">
</div>

<div>
<label>帶嘢食</label>
<input data-field="food">
</div>
</div>

<label>Remark</label>
<input data-field="remark">
`;

const visitor = slot.querySelector('[data-field="visitor"]');
const food = slot.querySelector('[data-field="food"]');
const remark = slot.querySelector('[data-field="remark"]');

if(data){

visitor.value = data.visitor || "";
food.value = data.food || "";
remark.value = data.remark || "";

}


// autosave
let timer;

function save(){

clearTimeout(timer);

timer=setTimeout(async ()=>{

await setDoc(
doc(db,"families",family,"days",date),
{
[key]:{
visitor:visitor.value,
food:food.value,
remark:remark.value
},
updatedAt:serverTimestamp()
},
{merge:true}
);

},500);

}

visitor.oninput=save;
food.oninput=save;
remark.oninput=save;

return slot;

}


days.forEach(d=>{

const date = formatDate(d);

const dayDiv=document.createElement("div");
dayDiv.className="day";

dayDiv.innerHTML=`
<div class="day-title">
${label(d)} (${date})
</div>
`;

container.appendChild(dayDiv);


// realtime
onSnapshot(
doc(db,"families",family,"days",date),
snap=>{

const data = snap.exists()?snap.data():{};

dayDiv.innerHTML=`
<div class="day-title">
${label(d)} (${date})
</div>
`;

dayDiv.appendChild(
createSlot(date,"noon","午",data.noon)
);

dayDiv.appendChild(
createSlot(date,"night","晚",data.night)
);

});

});