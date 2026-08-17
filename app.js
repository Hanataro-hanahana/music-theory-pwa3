(() => {
"use strict";
const DB = window.MUSIC_DB || {};
const keys=["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const rows=n=>(DB[n]&&DB[n].rows)||[];
const esc=x=>String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const setOptions=(id,vals)=>{const e=document.getElementById(id); if(!e)return; e.innerHTML=[...new Set(vals.filter(Boolean))].map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("")};
const card=r=>Object.entries(r).filter(([k,v])=>String(v??"").trim()!=="").map(([k,v])=>`<div class="item"><b>${esc(k)}</b><br>${esc(v).replace(/\n/g,"<br>")}</div>`).join("");
const showHits=(id,hits,empty="該当データなし")=>{document.getElementById(id).innerHTML=hits.length?hits.slice(0,30).map(card).join(""):`<div class="muted">${empty}</div>`};

function init(){
 const allRows=Object.values(DB).reduce((n,s)=>n+(s.rows?s.rows.length:0),0);
 document.getElementById("total").textContent=allRows.toLocaleString()+"件";
 document.getElementById("dbStats").innerHTML=Object.entries(DB).map(([n,s])=>`<div class="sheet"><span>${esc(n)}</span><span class="count">${s.rows.length}件</span></div>`).join("");

 const codes=rows("DB_コード");
 const codeNames=codes.map(r=>r["コード"]);
 ["chords","chords2","chords3"].forEach(id=>setOptions(id,codeNames));

 const progs=rows("DB_進行");
 setOptions("progType",progs.map(r=>r["進行タイプ"]));
 setOptions("composeType",rows("DB_作曲").map(r=>r["方向"]));
 setOptions("melodyType",rows("DB_メロディ").map(r=>r["進行タイプ"]));
 setOptions("arrangeType",rows("DB_アレンジ").map(r=>r["方向/進行"]));
 setOptions("scaleKey",keys);setOptions("fromKey",keys);setOptions("toKey",keys);

 const findCode=q=>codes.filter(r=>r["コード"]===q);
 const findCS=q=>rows("DB_コードスケール").filter(r=>r["コード"]===q);
 document.getElementById("chordBtn").onclick=()=>showHits("chordOut",findCode(document.getElementById("chordQ").value.trim()));
 document.getElementById("chordBtn2").onclick=()=>showHits("chordOut2",findCode(document.getElementById("chordQ2").value.trim()));
 document.getElementById("csBtn").onclick=()=>showHits("csOut",findCS(document.getElementById("csQ").value.trim()));

 document.getElementById("progBtn").onclick=()=>{const q=document.getElementById("progType").value;showHits("progOut",progs.filter(r=>r["進行タイプ"]===q));};
 document.getElementById("progTextBtn").onclick=()=>{const q=document.getElementById("progQ").value.toLowerCase().replace(/\s/g,"");showHits("progTextOut",progs.filter(r=>String(r["実コード"]||"").toLowerCase().replace(/\s/g,"").includes(q)));};

 document.getElementById("scaleBtn").onclick=()=>{const k=document.getElementById("scaleKey").value, kind=document.getElementById("scaleKind").value;showHits("scaleOut",rows("DB_解決音").filter(r=>r["キー"]===k&&r["キー種別"]===kind));};
 document.getElementById("composeBtn").onclick=()=>{const q=document.getElementById("composeType").value;showHits("composeOut",rows("DB_作曲").filter(r=>r["方向"]===q));};
 document.getElementById("melodyBtn").onclick=()=>{const q=document.getElementById("melodyType").value;showHits("melodyOut",rows("DB_メロディ").filter(r=>r["進行タイプ"]===q));};
 document.getElementById("arrangeBtn").onclick=()=>{const q=document.getElementById("arrangeType").value;showHits("arrangeOut",rows("DB_アレンジ").filter(r=>r["方向/進行"]===q));};
 document.getElementById("modBtn").onclick=()=>{const a=document.getElementById("fromKey").value,b=document.getElementById("toKey").value;showHits("modOut",rows("DB_転調").filter(r=>r["現在キー"]===a));};

 document.getElementById("globalBtn").onclick=()=>{
   const q=document.getElementById("globalQ").value.trim().toLowerCase();
   if(!q){document.getElementById("globalOut").innerHTML='<div class="muted">検索語を入力してください。</div>';return}
   const out=[];
   for(const [sheet,s] of Object.entries(DB)){
     for(const r of s.rows){
       if(Object.values(r).some(v=>String(v??"").toLowerCase().includes(q))) out.push({...r,__sheet:sheet});
       if(out.length>=80)break;
     }
     if(out.length>=80)break;
   }
   document.getElementById("globalOut").innerHTML=out.length?out.map(r=>`<div class="item"><span class="pill">${esc(r.__sheet)}</span>${card(Object.fromEntries(Object.entries(r).filter(([k])=>k!=="__sheet")))}</div>`).join(""):'<div class="muted">該当データなし</div>';
 };

 document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));document.getElementById(b.dataset.page).classList.add("active");window.scrollTo(0,0)});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();