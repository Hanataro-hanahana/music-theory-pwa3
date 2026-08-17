(()=>{
"use strict";

const D=window.MUSIC_DB||{};
const rows=n=>(D[n]?.rows)||[];
const uniq=a=>[...new Set((a||[]).filter(v=>v!==undefined&&v!==null&&String(v).trim()!==""))];
const esc=x=>String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const byId=id=>document.getElementById(id);
const NORMAL_CODE_RE=/\/[A-G](?:#|b)?$/;
const NOTE_PC={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11};
const SHARP_NAMES=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const FLAT_NAMES=["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const TUNING_PC=[4,9,2,7,11,4]; // 6弦→1弦
const TUNING_MIDI=[40,45,50,55,59,64];
const STRING_NAMES=["6弦","5弦","4弦","3弦","2弦","1弦"];
const INTERVAL_LABEL={0:"Root",1:"♭9",2:"9",3:"♭3/#9",4:"3",5:"11",6:"♭5/#11",7:"5",8:"♭13",9:"13",10:"♭7",11:"7"};

function opts(id,values){
  const e=byId(id); if(!e)return;
  const current=e.value;
  e.innerHTML=uniq(values).map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");
  if([...e.options].some(o=>o.value===current))e.value=current;
}
function render(id,rs,msg="該当データがありません"){
  const e=byId(id); if(!e)return;
  e.innerHTML=rs.length?rs.slice(0,60).map(r=>`<div class="resultbox">${
    Object.entries(r).filter(([k,v])=>String(v??"").trim()!=="").map(([k,v])=>
      `<div class="item"><b>${esc(k)}</b><div class="value">${esc(v).replace(/\n/g,"<br>")}</div></div>`
    ).join("")
  }</div>`).join(""):`<div class="muted">${esc(msg)}</div>`;
}
function page(p){
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  byId(p)?.classList.add("active");
  document.querySelectorAll(".bottom button").forEach(x=>x.classList.toggle("active",x.dataset.page===p));
  window.scrollTo(0,0);
}
document.querySelectorAll("[data-page]").forEach(x=>x.addEventListener("click",()=>page(x.dataset.page)));

const allCodes=rows("DB_コード");
const codes=allCodes.filter(r=>!NORMAL_CODE_RE.test(String(r["コード"]||"")));
const progs=rows("DB_進行");

// ---------- Common DB / home ----------
if(byId("total"))byId("total").textContent=Object.values(D).reduce((n,s)=>n+(s?.rows?.length||0),0).toLocaleString()+"件";
if(byId("dbSummary"))byId("dbSummary").innerHTML=Object.entries(D).map(([n,s])=>`<div class="item"><b>${esc(n)}</b><div class="muted">${(s?.rows?.length||0).toLocaleString()}件</div></div>`).join("");

opts("codes",codes.map(r=>r["コード"]));
opts("pt",progs.map(r=>r["進行タイプ"]));
opts("co",rows("DB_作曲").map(r=>r["方向"]));
opts("me",rows("DB_メロディ").map(r=>r["進行タイプ"]));
opts("ar",rows("DB_アレンジ").map(r=>r["方向/進行"]));

function globalSearch(q,id){
  q=String(q||"").trim().toLowerCase();
  if(!q){render(id,[],"検索語を入力してください。");return}
  const out=[];
  for(const [sheet,s] of Object.entries(D)){
    for(const r of (s.rows||[])){
      if(Object.values(r).some(v=>String(v??"").toLowerCase().includes(q))){
        out.push({"データベース":sheet,...r});
        if(out.length>=60)break;
      }
    }
    if(out.length>=60)break;
  }
  render(id,out);
}
byId("gbtn")?.addEventListener("click",()=>globalSearch(byId("gq")?.value,"gout"));
byId("quickBtn")?.addEventListener("click",()=>{
  if(byId("gq"))byId("gq").value=byId("quick")?.value||"";
  page("search");
  globalSearch(byId("quick")?.value,"gout");
});

// ---------- Scale ----------
const scaleRows=rows("DB_解決音");
const SCALE_INTERVALS={メジャー:[0,2,4,5,7,9,11],マイナー:[0,2,3,5,7,8,10]};
function scaleKeyOptions(){
  const kind=byId("sm")?.value||"メジャー";
  return uniq(scaleRows.filter(r=>r["キー種別"]===kind).map(r=>r["キー"]));
}
function updateScaleKeys(){opts("sk",scaleKeyOptions())}
function noteNameForKey(pc,key){
  const useFlats=String(key).includes("b")||["F","Fm","Cm","Dm","Gm"].includes(key);
  return (useFlats?FLAT_NAMES:SHARP_NAMES)[pc%12];
}
function scaleNotes(key,kind){
  const rootName=String(key).replace(/m$/,"");
  const root=NOTE_PC[rootName];
  if(root===undefined)return[];
  return (SCALE_INTERVALS[kind]||[]).map(i=>noteNameForKey((root+i)%12,key));
}
updateScaleKeys();
byId("sm")?.addEventListener("change",updateScaleKeys);
byId("sbtn")?.addEventListener("click",()=>{
  const kind=byId("sm")?.value||"メジャー",key=byId("sk")?.value||"";
  const rs=scaleRows.filter(r=>r["キー種別"]===kind&&r["キー"]===key);
  const notes=scaleNotes(key,kind);
  const e=byId("sout"); if(!e)return;
  e.innerHTML=`<div class="resultbox"><b>${esc(key)} ${esc(kind)}</b><div class="scaleNotes">${notes.map(n=>`<span class="tag">${esc(n)}</span>`).join("")}</div><div class="muted">${kind==="マイナー"?"ナチュラルマイナーの構成音":"メジャースケールの構成音"}</div></div>`+
    (rs.length?rs.map(r=>`<div class="resultbox">${Object.entries(r).filter(([k,v])=>String(v??"").trim()).map(([k,v])=>`<div class="item"><b>${esc(k)}</b><div class="value">${esc(v)}</div></div>`).join("")}</div>`).join(""):`<div class="muted">解決音DBに該当データがありません。</div>`);
});

// ---------- Modulation ----------
const modRows=rows("DB_転調");
const modKeys=uniq(modRows.map(r=>r["現在キー"]));
opts("mk1",modKeys); opts("mk2",modKeys);
function recommendedTargets(row){
  return String(row?.["転調しやすいキー"]||"").split("/").map(x=>x.trim()).filter(Boolean);
}
byId("mbtn")?.addEventListener("click",()=>{
  const from=byId("mk1")?.value,to=byId("mk2")?.value,row=modRows.find(r=>r["現在キー"]===from);
  const e=byId("mout"); if(!e)return;
  if(!row){e.innerHTML='<div class="muted">転調データがありません。</div>';return}
  const rec=recommendedTargets(row),ok=rec.includes(to);
  e.innerHTML=`<div class="resultbox"><b>${esc(from)} → ${esc(to)}</b><div class="value ${ok?"statusGood":"statusWarn"}">${ok?"DBの推奨候補に含まれます":"DBの推奨候補外です"}</div><div class="muted">推奨候補：${esc(rec.join(" / "))}</div></div>`+
    `<div class="resultbox">${Object.entries(row).map(([k,v])=>`<div class="item"><b>${esc(k)}</b><div class="value">${esc(v)}</div></div>`).join("")}</div>`;
});

// ---------- Core DB tools ----------
byId("pbtn")?.addEventListener("click",()=>render("pout",progs.filter(r=>r["進行タイプ"]===byId("pt")?.value)));
byId("p2btn")?.addEventListener("click",()=>{
  const q=String(byId("pq")?.value||"").toLowerCase().replace(/\s/g,"");
  render("p2out",progs.filter(r=>String(r["実コード"]||"").toLowerCase().replace(/\s/g,"").includes(q)));
});
byId("cobtn")?.addEventListener("click",()=>render("coout",rows("DB_作曲").filter(r=>r["方向"]===byId("co")?.value)));
byId("mebtn")?.addEventListener("click",()=>render("meout",rows("DB_メロディ").filter(r=>r["進行タイプ"]===byId("me")?.value)));
byId("arbtn")?.addEventListener("click",()=>render("arout",rows("DB_アレンジ").filter(r=>r["方向/進行"]===byId("ar")?.value)));

// ---------- Fraction chords ----------
const F=rows("DB_分数コード");
const fvals=k=>uniq(F.map(r=>r[k]));
function updateFractionClasses(){
  const bass=byId("fbass")?.value;
  opts("fclass",uniq(F.filter(r=>r["ベース音"]===bass).map(r=>r["分類"])));
  updateFractionPatterns();
}
function updateFractionPatterns(){
  const bass=byId("fbass")?.value,cls=byId("fclass")?.value;
  opts("fpat",uniq(F.filter(r=>r["ベース音"]===bass&&r["分類"]===cls).map(r=>r["パターン"])));
}
opts("fbass",fvals("ベース音")); updateFractionClasses();
byId("fbass")?.addEventListener("change",updateFractionClasses);
byId("fclass")?.addEventListener("change",updateFractionPatterns);
byId("fbtn")?.addEventListener("click",()=>{
  const b=byId("fbass")?.value,c=byId("fclass")?.value,p=byId("fpat")?.value;
  render("fout",F.filter(r=>r["ベース音"]===b&&r["分類"]===c&&r["パターン"]===p));
});
byId("fqbtn")?.addEventListener("click",()=>{
  const q=String(byId("fq")?.value||"").trim().toLowerCase();
  render("fqout",F.filter(r=>String(r["分数コード"]||"").toLowerCase()===q||String(r["例"]||"").toLowerCase()===q));
});

// ---------- Guitar forms ----------
function parseFingering(value){
  if(Array.isArray(value)&&value.length===6)return value.map(v=>Number(v));
  let s=String(value??"").trim(); if(!s)return[];
  // strip descriptive prefix e.g. "5弦Root型: x-5-6-5-6-x"
  if(s.includes(":"))s=s.split(":").pop().trim();
  // standardized comma form
  let parts=s.split(/[,\s]+/).filter(Boolean);
  if(parts.length===6&&parts.every(x=>/^[xX-]$|^\d+$/.test(x)))return parts.map(x=>/^[xX-]$/.test(x)?-1:Number(x));
  // hyphen form, allowing x-5-6...
  parts=s.split("-").map(x=>x.trim()).filter(Boolean);
  if(parts.length===6&&parts.every(x=>/^[xX]$|^\d+$/.test(x)))return parts.map(x=>/^[xX]$/.test(x)?-1:Number(x));
  // legacy six single digits
  if(/^[xX0-9]{6}$/.test(s))return [...s].map(x=>/[xX]/.test(x)?-1:Number(x));
  return[];
}
function fingeringText(value){
  const f=parseFingering(value);
  return f.length===6?f.map(x=>x<0?"×":String(x)).join(" / "):String(value??"");
}
function parseFormList(row){
  const out=[],seen=new Set();
  const add=f=>{const p=parseFingering(f);if(p.length!==6)return;const k=p.join(",");if(!seen.has(k)){seen.add(k);out.push(p)}};
  String(row?.["フォーム候補"]||"").split("|").forEach(add);
  add(row?.["押さえ方"]);
  return out;
}
function chordSvg(code,notation){
  const raw=parseFingering(notation);
  if(raw.length!==6)return `<div class="muted">押さえ方データ未登録</div>`;
  const display=[raw[5],raw[4],raw[3],raw[2],raw[1],raw[0]]; // top 1st → bottom 6th
  const positives=raw.filter(x=>x>0),min=positives.length?Math.min(...positives):1,max=positives.length?Math.max(...positives):1;
  let start=min>4?Math.max(1,min-1):1; if(max-start>4)start=Math.max(1,max-4);
  const fretCount=5,W=360,H=270,left=78,right=330,top=68,bottom=225,rowH=(bottom-top)/5,colW=(right-left)/fretCount;
  let svg=`<svg class="chordSvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(code)}のギターコードダイアグラム">`;
  svg+=`<text x="180" y="27" text-anchor="middle" font-size="21" font-weight="800">${esc(code)}</text>`;
  for(let j=0;j<fretCount;j++){const fret=start+j,x=left+colW*(j+.5);svg+=`<text x="${x}" y="54" text-anchor="middle" font-size="14" font-weight="800">${fret}</text>`}
  for(let i=0;i<6;i++){const y=top+rowH*i;svg+=`<text x="34" y="${y+5}" text-anchor="middle" font-size="14" font-weight="800">${i+1}弦</text><line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#222" stroke-width="2"/>`}
  for(let j=0;j<=fretCount;j++){const x=left+colW*j;svg+=`<line x1="${x}" y1="${top}" x2="${x}" y2="${bottom}" stroke="#222" stroke-width="${j===0&&start===1?5:2}"/>`}
  for(let i=0;i<6;i++){
    const val=display[i],y=top+rowH*i;
    if(val===0)svg+=`<text x="61" y="${y+5}" text-anchor="middle" font-size="17" font-weight="800">○</text>`;
    else if(val<0)svg+=`<text x="61" y="${y+5}" text-anchor="middle" font-size="17" font-weight="800">×</text>`;
    else{const rel=val-start;if(rel>=0&&rel<fretCount){const x=left+colW*(rel+.5);svg+=`<circle cx="${x}" cy="${y}" r="10" fill="#111"/><text x="${x}" y="${y+4}" text-anchor="middle" font-size="10" font-weight="800" fill="white">${val}</text>`}}
  }
  svg+=`<text x="180" y="255" text-anchor="middle" font-size="11" fill="#667085">上：1弦 / 下：6弦　数字：実フレット番号</text></svg>`;
  return svg;
}
function barreEstimate(form){
  const f=parseFingering(form),counts={};
  f.filter(x=>x>0).forEach(x=>counts[x]=(counts[x]||0)+1);
  return Object.values(counts).some(n=>n>=3);
}
function formDifficulty(form){
  const f=parseFingering(form),p=f.filter(x=>x>0);
  if(!p.length)return{score:0,label:"易"};
  const span=Math.max(...p)-Math.min(...p),barre=barreEstimate(f),high=Math.max(...p)>=9;
  const score=span*1.5+(barre?2.2:0)+(high?0.7:0)+Math.max(0,p.length-4)*0.5;
  return{score,label:score<3?"易":score<5.5?"中":"難"};
}
function formPosition(form){const p=parseFingering(form).filter(x=>x>0);return p.length?p.reduce((a,b)=>a+b,0)/p.length:0}
function formDistance(a,b){
  const aa=parseFingering(a),bb=parseFingering(b); if(aa.length!==6||bb.length!==6)return 99;
  let d=0,n=0,common=0;
  for(let i=0;i<6;i++){
    if(aa[i]>=0&&bb[i]>=0){d+=Math.abs(aa[i]-bb[i]);n++;if(aa[i]===bb[i])common++}
    else if(aa[i]!==bb[i])d+=1.2;
  }
  return d/(n||1)+Math.abs(formPosition(aa)-formPosition(bb))*.2-common*.25;
}
function chordCandidates(code){
  const row=codes.find(r=>r["コード"]===code);
  return parseFormList(row).map((form,i)=>({form,label:i===0?"基本フォーム":`候補${i+1}`,difficulty:formDifficulty(form)}));
}

// ---------- Chord priority ----------
function parseChordName(name){
  const m=String(name||"").match(/^([A-G](?:#|b)?)(.*?)(?:\/([A-G](?:#|b)?))?$/);
  return m?{root:m[1],quality:m[2]||"",bass:m[3]||null}:null;
}
function priorityHtml(row,forBass=false){
  if(!row)return"";
  let first=String(row["最優先音"]||"").split("/").map(x=>x.trim()).filter(Boolean);
  let second=String(row["次に追加する音"]||"").split("/").map(x=>x.trim()).filter(Boolean);
  const c=parseChordName(row["コード"]);
  if(forBass&&c){
    first=first.filter(n=>NOTE_PC[n]!==NOTE_PC[c.root]);
    if(!first.length)first=second.filter(n=>NOTE_PC[n]!==NOTE_PC[c.root]).slice(0,2);
    second=second.filter(n=>NOTE_PC[n]!==NOTE_PC[c.root]&&!first.includes(n));
  }
  return `<div class="priorityBox"><div class="priorityTitle">🎯 コードを作るときの音の優先順位</div><div class="priorityRow"><b>最優先：</b>${first.length?first.map(n=>`<span class="priorityPill">${esc(n)}</span>`).join(""):"<span class='muted'>構成音を均等に</span>"}</div><div class="priorityRow"><b>その後に追加：</b>${second.length?second.map(n=>`<span class="priorityPill secondaryPill">${esc(n)}</span>`).join(""):"<span class='muted'>必要に応じてオクターブや重複音</span>"}</div>${forBass&&c?`<div class="muted">ベースが${esc(c.root)}（Root）を担当する前提では、ギターのRoot重複を減らします。</div>`:""}</div>`;
}
function showChordDiagram(id,code){
  const box=byId(id),row=codes.find(r=>r["コード"]===code);if(!box||!row)return;
  const candidates=chordCandidates(code),c=candidates[0];
  box.innerHTML=c?`<div class="chordDiagram"><h3>🎸 ${esc(code)} の押さえ方</h3>${chordSvg(code,c.form)}<div class="muted" style="text-align:center">6弦→1弦：${esc(fingeringText(c.form))} <span class="difficulty">難易度：${esc(c.difficulty.label)}</span></div></div>`:`<div class="muted">押さえ方データがありません。</div>`;
}
byId("cbtn")?.addEventListener("click",()=>{
  const code=byId("codes")?.value,row=codes.find(r=>r["コード"]===code);
  render("cout",row?[row]:[]);
  if(byId("chordPriority"))byId("chordPriority").innerHTML=priorityHtml(row,false);
  showChordDiagram("chordGuitar",code);
});

// ---------- Guitar dictionary ----------
const G=rows("DB_ギター");
opts("gcode",codes.map(r=>r["コード"]));
opts("gcat",uniq(G.map(r=>r["カテゴリ"])));
function updateGItems(){opts("gitem",G.filter(r=>r["カテゴリ"]===byId("gcat")?.value).map(r=>r["項目"]))}
function updateGForms(){
  const code=byId("gcode")?.value,list=chordCandidates(code),el=byId("gform");if(!el)return;
  el.innerHTML=list.map((x,i)=>`<option value="${i}">${i+1}. ${esc(x.label)}｜6→1弦：${esc(fingeringText(x.form))}｜${esc(x.difficulty.label)}</option>`).join("");
}
updateGItems();updateGForms();
byId("gcat")?.addEventListener("change",updateGItems);
byId("gcode")?.addEventListener("change",updateGForms);
byId("gbtnTech")?.addEventListener("click",()=>render("guitarTechOut",G.filter(r=>r["カテゴリ"]===byId("gcat")?.value&&r["項目"]===byId("gitem")?.value)));
byId("gbtnChord")?.addEventListener("click",()=>{
  const code=byId("gcode")?.value,list=chordCandidates(code),idx=Number(byId("gform")?.value||0),c=list[idx],box=byId("guitarChordOut");
  if(!box)return;
  box.innerHTML=c?`<div class="chordDiagram"><h3>🎸 ${esc(code)} の押さえ方</h3>${chordSvg(code,c.form)}<div class="muted" style="text-align:center">6弦→1弦：${esc(fingeringText(c.form))} <span class="difficulty">難易度：${esc(c.difficulty.label)}</span></div></div>`:`<div class="muted">押さえ方データがありません。</div>`;
});

// ---------- Whole progression form optimization ----------
function optimizeProgression(chordList){
  const candLists=chordList.map(code=>{
    const cs=chordCandidates(code);
    return cs.length?cs:[{form:null,label:"未登録",difficulty:{score:10,label:"難"}}];
  });
  const n=candLists.length,dp=[],prev=[];
  for(let i=0;i<n;i++){dp[i]=Array(candLists[i].length).fill(Infinity);prev[i]=Array(candLists[i].length).fill(-1)}
  for(let j=0;j<candLists[0].length;j++){
    const c=candLists[0][j];
    dp[0][j]=(c.difficulty?.score||0)+formPosition(c.form||[])*.05;
  }
  for(let i=1;i<n;i++){
    for(let j=0;j<candLists[i].length;j++){
      const cur=candLists[i][j];
      for(let k=0;k<candLists[i-1].length;k++){
        const before=candLists[i-1][k];
        const trans=cur.form&&before.form?formDistance(before.form,cur.form):20;
        const cost=dp[i-1][k]+trans+(cur.difficulty?.score||0)*.55;
        if(cost<dp[i][j]){dp[i][j]=cost;prev[i][j]=k}
      }
    }
  }
  let j=dp[n-1].indexOf(Math.min(...dp[n-1])),out=Array(n);
  for(let i=n-1;i>=0;i--){const c=candLists[i][j];out[i]={code:chordList[i],...c,candidates:candLists[i].length};j=prev[i][j];if(i>0&&j<0)j=0}
  return out;
}

// ---------- Style backing and voice leading ----------
const BACKING_STYLES={
 alt:{name:"オルタナ",priority:[4,3,10,11,2,5,7,0],bass:"Root中心。必要に応じて5度・オクターブ。",guide:"3度/♭3・7度・9th/susを先に。Rootはベースに任せやすい。"},
 jpop:{name:"J-POP",priority:[4,3,10,11,2,7,9,0],bass:"Rootを明確にし、経過音で滑らかにつなぐ。",guide:"3度・7度を先に、9thや5度を後から追加。"},
 rock:{name:"ロック",priority:[0,7,4,3,10,5,2],bass:"Root＋5度＋オクターブでリズムを支える。",guide:"Root＋5度を先に。必要に応じて3度/♭3で長短を明確に。"},
 ballad:{name:"バラード",priority:[4,3,11,10,2,9,7,0],bass:"Rootを安定して支え、5度・経過音を控えめに。",guide:"3度・7度を先に、9th・13thを後から追加して広げる。"}
};
function actualTones(code,form){
  const c=parseChordName(code);if(!c||NOTE_PC[c.root]===undefined)return[];
  const root=NOTE_PC[c.root],f=parseFingering(form),out=[];
  if(f.length!==6)return out;
  for(let i=0;i<6;i++){
    if(f[i]<0)continue;
    const pc=(TUNING_PC[i]+f[i])%12,midi=TUNING_MIDI[i]+f[i],interval=(pc-root+12)%12;
    out.push({string:STRING_NAMES[i],stringNo:6-i,fret:f[i],pc,midi,note:SHARP_NAMES[pc],interval});
  }
  return out;
}
function voiceLedSelections(items,style,rootMode){
  const cfg=BACKING_STYLES[style]||BACKING_STYLES.alt,out=[];let prevMidis=[];
  for(const item of items){
    let tones=actualTones(item.code,item.form);
    const c=parseChordName(item.code),rootPc=c?NOTE_PC[c.root]:null;
    if(rootMode&&style!=="rock")tones=tones.filter(t=>t.pc!==rootPc);
    const scored=tones.map(t=>{
      const pidx=cfg.priority.indexOf(t.interval),priority=pidx<0?20:pidx*3;
      const voice=prevMidis.length?Math.min(...prevMidis.map(m=>Math.abs(m-t.midi))):0;
      const highPenalty=t.midi>79?2:0;
      return{...t,score:priority+voice*.35+highPenalty};
    }).sort((a,b)=>a.score-b.score);
    const chosen=[];
    for(const t of scored){
      if(chosen.some(x=>x.stringNo===t.stringNo))continue;
      chosen.push(t);
      if(chosen.length>=3)break;
    }
    prevMidis=chosen.map(x=>x.midi);
    out.push(chosen);
  }
  return out;
}
function backingPriorityHtml(code,style,rootMode){
  const row=codes.find(r=>r["コード"]===code),cfg=BACKING_STYLES[style]||BACKING_STYLES.alt;
  return `<div class="backingNote"><b>🎚 ${esc(cfg.name)}：バッキング優先順位</b><div class="muted">${esc(cfg.guide)}</div>${priorityHtml(row,rootMode)}</div>`;
}
function ensembleHtml(item,chosen,style){
  const cfg=BACKING_STYLES[style]||BACKING_STYLES.alt,c=parseChordName(item.code);
  const bass=c?`${c.root}（Root）`:"Root";
  const pills=chosen.map(t=>`<span class="notePill">${esc(t.string)} ${t.fret===0?"開放":`${t.fret}F`} ${esc(t.note)} <small>${esc(INTERVAL_LABEL[t.interval]||"")}</small></span>`).join("");
  return `<div class="ensembleBox"><b>🎛 実際のアンサンブル配置</b><div class="muted">ベース：<strong>${esc(bass)}</strong>｜${esc(cfg.bass)}</div><div class="ensembleLine">ギター：${pills||"<span class='muted'>候補なし</span>"}</div><div class="muted">前後コードとの音高移動も小さくなるよう優先しています。</div></div>`;
}

// ---------- Custom progression ----------
let progSlots=[];
function addSlot(code){if(progSlots.length>=64)return;progSlots.push(code||codes[0]?.["コード"]||"");drawSlots()}
function drawSlots(){
  const e=byId("customProgress");if(!e)return;
  e.innerHTML=progSlots.map((v,i)=>`<div class="slot"><div class="slothead"><span>${i+1}小節目</span><button class="remove" data-i="${i}" type="button">×</button></div><select data-slot="${i}">${codes.map(r=>`<option value="${esc(r["コード"])}" ${r["コード"]===v?"selected":""}>${esc(r["コード"])}</option>`).join("")}</select></div>`).join("");
  e.querySelectorAll("select[data-slot]").forEach(s=>s.addEventListener("change",ev=>progSlots[Number(ev.target.dataset.slot)]=ev.target.value));
  e.querySelectorAll("button.remove").forEach(b=>b.addEventListener("click",()=>{progSlots.splice(Number(b.dataset.i),1);drawSlots()}));
}
["C","G","Am","F"].forEach(addSlot);
byId("addProg")?.addEventListener("click",()=>addSlot());
byId("clearProg")?.addEventListener("click",()=>{progSlots=[];drawSlots()});
byId("showProg")?.addEventListener("click",()=>{
  const out=byId("progGuitarOut");if(!out)return;
  try{
    document.querySelectorAll("#customProgress select[data-slot]").forEach(s=>progSlots[Number(s.dataset.slot)]=s.value);
    if(!progSlots.length){out.innerHTML='<div class="muted">コードを1つ以上追加してください。</div>';return}
    const optimized=optimizeProgression(progSlots),rootMode=byId("bassRootMode")?.checked!==false,style=byId("backingStyle")?.value||"alt";
    let detail=byId("detailMode")?.checked===true;
    const long=optimized.length>16;
    if(long&&detail)detail=false; // performance guard
    const selections=voiceLedSelections(optimized,style,rootMode);
    const notice=long?`<div class="compactNotice">⚡ ${optimized.length}小節のため軽量表示にしています。コード図・優先音・最適フォームは表示し、詳細な実音配置は省略します。</div>`:"";
    const rowsHtml=Array.from({length:Math.ceil(optimized.length/4)},(_,ri)=>{
      const cards=optimized.slice(ri*4,ri*4+4).map((item,j)=>{
        const i=ri*4+j,row=codes.find(r=>r["コード"]===item.code);
        return `<div class="miniCard"><h4>${i+1}小節目<br>${esc(item.code)}</h4>${item.form?chordSvg(item.code,item.form):'<div class="muted">フォーム未登録</div>'}<div class="formNote">${esc(item.label||"フォーム")}｜難易度:${esc(item.difficulty?.label||"-")}<br>6→1弦：${esc(item.form?fingeringText(item.form):"-")}</div>${backingPriorityHtml(item.code,style,rootMode)}${detail?ensembleHtml(item,selections[i],style):""}</div>`;
      }).join("");
      return `<div class="progressRow"><div class="rowLabel">${ri*4+1}〜${Math.min(ri*4+4,optimized.length)}小節</div><div class="miniDiagrams">${cards}</div></div>`;
    }).join("");
    out.innerHTML=`<div class="optimizerNote">🎯 <b>進行全体を見て自動最適化</b><br><span class="muted">移動距離・押さえやすさ・セーハ・指の開き・共通ポジションをまとめて評価しています。</span></div>${notice}<div class="progressRows">${rowsHtml}</div>`;
    out.scrollIntoView({behavior:"smooth",block:"start"});
  }catch(err){
    console.error(err);
    out.innerHTML=`<div class="resultbox"><b>表示エラー</b><div class="value">${esc(err.message||"コード進行を表示できませんでした。")}</div></div>`;
  }
});

// ---------- PWA ----------
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(err=>console.warn("Service Worker registration failed",err)));
}

})();