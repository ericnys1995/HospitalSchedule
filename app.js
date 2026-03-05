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

const app=initializeApp(firebaseConfig);
const db=getFirestore(app);

const members=["媽咪","阿哥","細路","姑姐","舅父","其他"];

function memberSelect(){
return `
<select>
<option value="">--選擇--</option>
${members.map(m=>`<option>${m}</option>`).join("")}
</select>
`;
}

function getFamily(){
const m=location.hash.match(/family=([^&]+)/);
return m?m[1]:"default";
}

const family=getFamily();
document.getElementById("status").innerText="Family: "+family;

function formatDate(d){
return d.toISOString().split("T")[0];
}

function label(d){

const today=new Date();
today.setHours(0,0,0,0);

const x=new Date(d);
x.setHours(0,0,0,0);

const diff=(x-today)/86400000;

if(diff===0)return"今日";
if(diff===1)return"聽日";

return d.toLocaleDateString("zh-HK",{weekday:"short",month:"numeric",day:"numeric"});
}

const container=document.getElementById("schedule");

function createSlot(date,key,title,data){

const slot=document.createElement("div");
slot.className="slot";

slot.innerHTML=`
<div class="slot-title">${title}</div>

<div class="row">
<div>
<label>去醫院</label>
${memberSelect()}
</div>

<div>
<label>帶嘢食</label>
${memberSelect()}
</div>
</div>

<label>備注</label>
<input placeholder="例如：粥、水果">
`;

const selects=slot.querySelectorAll("select");
const remark=slot.querySelector("input");

if(data){
selects[0].value=data.visitor||"";
selects[1].value=data.food||"";
remark.value=data.remark||"";
}

let timer;

function save(){

clearTimeout(timer);

timer=setTimeout(async()=>{

await setDoc(
doc(db,"families",family,"days",date),
{
[key]:{
visitor:selects[0].value,
food:selects[1].value,
remark:remark.value
},
updatedAt:serverTimestamp()
},
{merge:true}
);

},400);

}

selects[0].onchange=save;
selects[1].onchange=save;
remark.oninput=save;

return slot;
}


// 建立7日
for(let i=0;i<7;i++){

const d=new Date();
d.setDate(d.getDate()+i);

const date=formatDate(d);

const dayDiv=document.createElement("div");
dayDiv.className="day";

const today=new Date();
today.setHours(0,0,0,0);

const check=new Date(d);
check.setHours(0,0,0,0);

if(check.getTime()===today.getTime()){
dayDiv.classList.add("today");
}

dayDiv.innerHTML=`
<div class="day-title">
${label(d)} ${check.getTime()===today.getTime()?"⭐":""} (${date})
</div>
`;

container.appendChild(dayDiv);

onSnapshot(
doc(db,"families",family,"days",date),
snap=>{

const data=snap.exists()?snap.data():{};

dayDiv.innerHTML=`
<div class="day-title">
${label(d)} ${check.getTime()===today.getTime()?"⭐":""} (${date})
</div>
`;

dayDiv.appendChild(createSlot(date,"noon","午",data.noon));
dayDiv.appendChild(createSlot(date,"night","晚",data.night));

});

}


// 複製昨日
document.getElementById("copyYesterday").onclick=async()=>{

const today=new Date();
const yesterday=new Date();
yesterday.setDate(today.getDate()-1);

const t=formatDate(today);
const y=formatDate(yesterday);

const snap=await getDoc(doc(db,"families",family,"days",y));

if(!snap.exists()){
alert("昨日沒有資料");
return;
}

const data=snap.data();

await setDoc(
doc(db,"families",family,"days",t),
data,
{merge:true}
);

alert("已複製昨日安排");

};