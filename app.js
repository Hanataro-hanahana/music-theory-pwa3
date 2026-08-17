(()=>{"use strict";const D=window.MUSIC_DB||{};const rows=n=>(D[n]?.rows)||[];const uniq=a=>[...new Set(a.filter(x=>x!==undefined&&String(x).trim()!==""))];const esc=x=>String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));function opts(id,a){document.getElementById(id).innerHTML=uniq(a).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("")}function render(id,rs,msg="該当データがありません"){document.getElementById(id).innerHTML=rs.length?rs.slice(0,30).map(r=>`<div class="resultbox">${Object.entries(r).filter(([k,v])=>String(v??"").trim()).map(([k,v])=>`<div class="item"><b>${esc(k)}</b><div class="value">${esc(v).replace(/\n/g,"<br>")}</div></div>`).join("")}</div>`).join(""):`<div class="muted">${msg}</div>`}function page(p){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(p).classList.add("active");document.querySelectorAll(".bottom button").forEach(x=>x.classList.toggle("active",x.dataset.page===p));scrollTo(0,0)}document.querySelectorAll("[data-page]").forEach(x=>x.onclick=()=>page(x.dataset.page));
const keys=["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"],allCodes=rows("DB_コード"),codes=allCodes.filter(r=>!/[\/][A-G](?:#|b)?$/.test(String(r["コード"]||""))),progs=rows("DB_進行");
document.getElementById("total").textContent=Object.values(D).reduce((n,s)=>n+s.rows.length,0).toLocaleString()+"件";
document.getElementById("dbSummary").innerHTML=Object.entries(D).map(([n,s])=>`<div class="item"><b>${esc(n)}</b><div class="muted">${s.rows.length.toLocaleString()}件</div></div>`).join("");
opts("codes",codes.map(r=>r["コード"]));opts("pt",progs.map(r=>r["進行タイプ"]));opts("sk",keys);opts("mk1",keys);opts("mk2",keys);opts("co",rows("DB_作曲").map(r=>r["方向"]));opts("me",rows("DB_メロディ").map(r=>r["進行タイプ"]));opts("ar",rows("DB_アレンジ").map(r=>r["方向/進行"]));
document.getElementById("cbtn").onclick=()=>{let q=document.getElementById("cq").value.trim();render("cout",codes.filter(r=>String(r["コード"])===q))};
document.getElementById("pbtn").onclick=()=>{let q=document.getElementById("pt").value;render("pout",progs.filter(r=>r["進行タイプ"]===q))};
document.getElementById("p2btn").onclick=()=>{let q=document.getElementById("pq").value.toLowerCase().replace(/\s/g,"");render("p2out",progs.filter(r=>String(r["実コード"]||"").toLowerCase().replace(/\s/g,"").includes(q)))};
document.getElementById("sbtn").onclick=()=>{let k=document.getElementById("sk").value,kind=document.getElementById("sm").value;render("sout",rows("DB_解決音").filter(r=>r["キー"]===k&&r["キー種別"]===kind))};
document.getElementById("mbtn").onclick=()=>{let a=document.getElementById("mk1").value,b=document.getElementById("mk2").value;let rs=rows("DB_転調").filter(r=>String(Object.values(r).join(" ")).includes(a)&&String(Object.values(r).join(" ")).includes(b));render("mout",rs,"該当する転調データがありません。")};
document.getElementById("cobtn").onclick=()=>{let q=document.getElementById("co").value;render("coout",rows("DB_作曲").filter(r=>r["方向"]===q))};
document.getElementById("mebtn").onclick=()=>{let q=document.getElementById("me").value;render("meout",rows("DB_メロディ").filter(r=>r["進行タイプ"]===q))};
document.getElementById("arbtn").onclick=()=>{let q=document.getElementById("ar").value;render("arout",rows("DB_アレンジ").filter(r=>r["方向/進行"]===q))};
function global(q,id){q=q.trim().toLowerCase();let rs=[];if(q)for(const [s,v] of Object.entries(D)){for(const r of v.rows)if(Object.values(r).some(x=>String(x??"").toLowerCase().includes(q))){rs.push(Object.assign({"データベース":s},r));if(rs.length>=40)break}if(rs.length>=40)break}render(id,rs,"検索語を入力してください。")}document.getElementById("gbtn").onclick=()=>global(document.getElementById("gq").value,"gout");document.getElementById("quickBtn").onclick=()=>{document.getElementById("gq").value=document.getElementById("quick").value;page("search");global(document.getElementById("quick").value,"gout")};
})()
/* 作曲支援・アレンジ内のオルタナ機能 */
(function(){
 const A=window.MUSIC_DB||{}; const P=(A["DB_オルタナ進行"]||{}).rows||[]; const R=(A["DB_オルタナアレンジ"]||{}).rows||[]; const S=(A["DB_オルタナスタイル"]||{}).rows||[];
 const fill=(id,arr)=>{const e=document.getElementById(id); if(e) e.innerHTML=[...new Set(arr.filter(Boolean))].map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");};
 fill("alts",S.map(x=>x["スタイル"])); fill("altar",R.map(x=>x["方向/進行"]));
 document.getElementById("altsbtn")?.addEventListener("click",()=>{const q=document.getElementById("alts").value;render("altsout",S.filter(x=>x["スタイル"]===q)); const extra=P.filter(x=>String(x["進行タイプ"]||"").includes(q.split("/")[0])||String(x["進行タイプ"]||"").includes(q.split(" ")[0])); if(extra.length){document.getElementById("altsout").innerHTML+=extra.slice(0,5).map(r=>`<div class="resultbox">${Object.entries(r).map(([k,v])=>`<div class="item"><b>${esc(k)}</b><div class="value">${esc(v)}</div></div>`).join("")}</div>`).join("")}});
 document.getElementById("altarbtn")?.addEventListener("click",()=>{const q=document.getElementById("altar").value;render("altarout",R.filter(x=>x["方向/進行"]===q));});
})();

/* 分数コード専用UI：通常コード辞典から分離 */
(function(){
 const F=rows("DB_分数コード");
 const vals=(key)=>[...new Set(F.map(r=>String(r[key]??"")).filter(Boolean))];
 const fill=(id,a)=>{const e=document.getElementById(id);if(e)e.innerHTML=a.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");};
 const updatePatterns=()=>{const b=document.getElementById("fbass")?.value,c=document.getElementById("fclass")?.value;const pats=[...new Set(F.filter(r=>(!b||r["ベース音"]===b)&&(!c||r["分類"]===c)).map(r=>r["パターン"]).filter(Boolean))];fill("fpat",pats);};
 if(F.length){
  fill("fbass",vals("ベース音"));fill("fclass",vals("分類"));updatePatterns();
  document.getElementById("fbass")?.addEventListener("change",updatePatterns);document.getElementById("fclass")?.addEventListener("change",updatePatterns);
  document.getElementById("fbtn")?.addEventListener("click",()=>{const b=document.getElementById("fbass").value,c=document.getElementById("fclass").value,p=document.getElementById("fpat").value;render("fout",F.filter(r=>(!b||r["ベース音"]===b)&&(!c||r["分類"]===c)&&(!p||r["パターン"]===p)));});
  document.getElementById("fqbtn")?.addEventListener("click",()=>{const q=document.getElementById("fq").value.trim().toLowerCase();render("fqout",F.filter(r=>[r["分数コード"],r["例"]].some(v=>String(v??"").toLowerCase()===q)));});
 }
})();
