(()=>{"use strict";const D=window.MUSIC_DB||{};const rows=n=>(D[n]?.rows)||[];const uniq=a=>[...new Set(a.filter(x=>x!==undefined&&String(x).trim()!==""))];const esc=x=>String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));function opts(id,a){const e=document.getElementById(id);if(e)e.innerHTML=uniq(a).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("")}function render(id,rs,msg="該当データがありません"){const e=document.getElementById(id);if(!e)return;e.innerHTML=rs.length?rs.slice(0,40).map(r=>`<div class="resultbox">${Object.entries(r).filter(([k,v])=>String(v??"").trim()).map(([k,v])=>`<div class="item"><b>${esc(k)}</b><div class="value">${esc(v).replace(/\n/g,"<br>")}</div></div>`).join("")}</div>`).join(""):`<div class="muted">${esc(msg)}</div>`}function page(p){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(p)?.classList.add("active");document.querySelectorAll(".bottom button").forEach(x=>x.classList.toggle("active",x.dataset.page===p));scrollTo(0,0)}document.querySelectorAll("[data-page]").forEach(x=>x.onclick=()=>page(x.dataset.page));
const keys=["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"],allCodes=rows("DB_コード"),codes=allCodes.filter(r=>!/[\/][A-G](?:#|b)?$/.test(String(r["コード"]||""))),progs=rows("DB_進行");document.getElementById("total").textContent=Object.values(D).reduce((n,s)=>n+s.rows.length,0).toLocaleString()+"件";document.getElementById("dbSummary").innerHTML=Object.entries(D).map(([n,s])=>`<div class="item"><b>${esc(n)}</b><div class="muted">${s.rows.length.toLocaleString()}件</div></div>`).join("");opts("codes",codes.map(r=>r["コード"]));opts("pt",progs.map(r=>r["進行タイプ"]));opts("sk",keys);opts("mk1",keys);opts("mk2",keys);opts("co",rows("DB_作曲").map(r=>r["方向"]));opts("me",rows("DB_メロディ").map(r=>r["進行タイプ"]));opts("ar",rows("DB_アレンジ").map(r=>r["方向/進行"]));document.getElementById("cbtn").onclick=()=>{const r=codes.filter(r=>r["コード"]===document.getElementById("codes").value);render("cout",r);showChordDiagram("chordGuitar",document.getElementById("codes").value)};document.getElementById("pbtn").onclick=()=>render("pout",progs.filter(r=>r["進行タイプ"]===document.getElementById("pt").value));document.getElementById("p2btn").onclick=()=>{let q=document.getElementById("pq").value.toLowerCase().replace(/\s/g,"");render("p2out",progs.filter(r=>String(r["実コード"]||"").toLowerCase().replace(/\s/g,"").includes(q)))};document.getElementById("sbtn").onclick=()=>{let k=document.getElementById("sk").value,kind=document.getElementById("sm").value;render("sout",rows("DB_解決音").filter(r=>r["キー"]===k&&r["キー種別"]===kind))};document.getElementById("mbtn").onclick=()=>{let a=document.getElementById("mk1").value,b=document.getElementById("mk2").value;render("mout",rows("DB_転調").filter(r=>String(Object.values(r).join(" ")).includes(a)&&String(Object.values(r).join(" ")).includes(b)),"該当する転調データがありません。")};document.getElementById("cobtn").onclick=()=>render("coout",rows("DB_作曲").filter(r=>r["方向"]===document.getElementById("co").value));document.getElementById("mebtn").onclick=()=>render("meout",rows("DB_メロディ").filter(r=>r["進行タイプ"]===document.getElementById("me").value));document.getElementById("arbtn").onclick=()=>render("arout",rows("DB_アレンジ").filter(r=>r["方向/進行"]===document.getElementById("ar").value));function global(q,id){q=q.trim().toLowerCase();let rs=[];if(q)for(const [s,v] of Object.entries(D)){for(const r of v.rows)if(Object.values(r).some(x=>String(x??"").toLowerCase().includes(q))){rs.push(Object.assign({"データベース":s},r));if(rs.length>=40)break}if(rs.length>=40)break}render(id,rs,"検索語を入力してください。")}document.getElementById("gbtn")?.addEventListener("click",()=>global(document.getElementById("gq").value,"gout"));document.getElementById("quickBtn")?.addEventListener("click",()=>{document.getElementById("gq").value=document.getElementById("quick").value;page("search");global(document.getElementById("quick").value,"gout")});
// 分数コード
const F=rows("DB_分数コード"),fvals=k=>uniq(F.map(r=>r[k]));const updateF=()=>{const b=document.getElementById("fbass")?.value,c=document.getElementById("fclass")?.value;opts("fpat",fvals("パターン").filter(p=>F.some(r=>r["ベース音"]===b&&r["分類"]===c&&r["パターン"]===p)))};opts("fbass",fvals("ベース音"));opts("fclass",fvals("分類"));updateF();document.getElementById("fbass")?.addEventListener("change",updateF);document.getElementById("fclass")?.addEventListener("change",updateF);document.getElementById("fbtn")?.addEventListener("click",()=>{const b=document.getElementById("fbass").value,c=document.getElementById("fclass").value,p=document.getElementById("fpat").value;render("fout",F.filter(r=>r["ベース音"]===b&&r["分類"]===c&&r["パターン"]===p))});document.getElementById("fqbtn")?.addEventListener("click",()=>{const q=document.getElementById("fq").value.trim().toLowerCase();render("fqout",F.filter(r=>String(r["分数コード"]||"").toLowerCase()===q||String(r["例"]||"").toLowerCase()===q))});
// Guitar chord diagrams / movable forms
// Internal fingering order is always [6th,5th,4th,3rd,2nd,1st string].
// -1 = mute, 0 = open, positive integer = absolute fret number.
function parseFingering(value){
  if(Array.isArray(value)){
    return value.slice(0,6).map(v=>v===-1?-1:Number(v));
  }
  const s=String(value??"").trim();
  if(!s)return [];
  // New safe notation: x,8,10,10,9,8
  if(/[,\s/]/.test(s)){
    const parts=s.split(/[,\s/]+/).filter(Boolean);
    if(parts.length===6)return parts.map(x=>/^[xX-]$/.test(x)?-1:Number(x));
  }
  // Existing DB notation: x32010 (single digit frets only)
  if(/^[xX0-9]{6}$/.test(s)){
    return s.split("").map(x=>/[xX]/.test(x)?-1:Number(x));
  }
  return [];
}
function fingeringText(value){
  const f=parseFingering(value);
  return f.length===6?f.map(x=>x<0?"×":String(x)).join(" / "):String(value??"");
}
function chordSvg(code,notation){
  const f=parseFingering(notation);
  if(f.length!==6)return `<div class="muted">押さえ方データ：${esc(fingeringText(notation)||"未登録")}</div>`;
  const positives=f.filter(x=>x>0);
  const min=positives.length?Math.min(...positives):1;
  const max=positives.length?Math.max(...positives):1;
  let start=min>4?Math.max(1,min-1):1;
  if(max-start>4) start=Math.max(1,max-4);
  const frets=5,W=320,H=245,left=48,right=275,top=58,bottom=208;
  let svg=`<svg class="chordSvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(code)}のギターコードダイアグラム">`;
  svg+=`<text x="160" y="24" text-anchor="middle" font-size="20" font-weight="800">${esc(code)}</text>`;
  if(start>1)svg+=`<text x="24" y="69" font-size="13" font-weight="700">${start}F〜</text>`;
  // String lines and exact fret number above each string.
  for(let i=0;i<6;i++){
    const x=left+(right-left)*i/5;
    svg+=`<line x1="${x}" y1="${top}" x2="${x}" y2="${bottom}" stroke="#222" stroke-width="2"/>`;
    const val=f[i],label=val<0?"×":val===0?"○":String(val);
    svg+=`<text x="${x}" y="48" text-anchor="middle" font-size="16" font-weight="800">${label}</text>`;
  }
  for(let j=0;j<=frets;j++){
    const y=top+(bottom-top)*j/frets;
    svg+=`<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#222" stroke-width="${j===0&&start===1?5:2}"/>`;
  }
  for(let i=0;i<6;i++){
    const val=f[i];
    if(val>0){
      const rel=val-start+1;
      if(rel>=1&&rel<=frets){
        const x=left+(right-left)*i/5;
        const y=top+(bottom-top)*(rel-.5)/frets;
        svg+=`<circle cx="${x}" cy="${y}" r="10" fill="#111"/>`;
      }
    }
  }
  svg+=`<text x="160" y="232" text-anchor="middle" font-size="11" fill="#667085">6弦 → 1弦：${esc(fingeringText(f))}</text></svg>`;
  return svg;
}
function showChordDiagram(id,code){
  const box=document.getElementById(id);if(!box)return;
  const r=codes.find(x=>x["コード"]===code);if(!r){box.innerHTML="";return}
  box.innerHTML=`<div class="chordDiagram"><h3>🎸 ${esc(code)} の押さえ方</h3>${chordSvg(code,r["押さえ方"])}</div>`;
}

const NOTE_PC={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11};
function parseChordName(name){
  const m=String(name||"").match(/^([A-G](?:#|b)?)(.*?)(?:\/([A-G](?:#|b)?))?$/);
  return m?{root:m[1],quality:m[2]||"",bass:m[3]||null}:null;
}
function templateFingering(rootFret,shape){
  const t={
    majorE:[0,2,2,1,0,0],minorE:[0,2,2,0,0,0],sevenE:[0,2,0,1,0,0],minor7E:[0,2,0,0,0,0],major7E:[0,2,1,1,0,0],
    majorA:[-1,0,2,2,2,0],minorA:[-1,0,2,2,1,0],sevenA:[-1,0,2,0,2,0],minor7A:[-1,0,2,0,1,0],major7A:[-1,0,2,1,2,0]
  }[shape];
  if(!t)return null;
  const out=t.map(x=>x<0?-1:x+rootFret);
  return out.every(x=>x<=20)?out:null;
}
function generatedForms(code){
  const c=parseChordName(code);if(!c||c.bass)return[];
  const q=c.quality.toLowerCase();
  const type=q==="m"||q==="min"||q==="minor"?"minor":
    q==="7"?"seven":
    q==="m7"||q==="min7"?"minor7":
    q==="maj7"||q==="major7"?"major7":
    q===""||q==="maj"||q==="major"?"major":null;
  if(!type||NOTE_PC[c.root]==null)return[];
  const eRoot=(NOTE_PC[c.root]-4+12)%12;
  const aRoot=(NOTE_PC[c.root]-9+12)%12;
  const out=[];
  const e=templateFingering(eRoot,`${type}E`);
  const a=templateFingering(aRoot,`${type}A`);
  if(e)out.push({form:e,label:`Eフォーム（${eRoot}F付近）`});
  if(a)out.push({form:a,label:`Aフォーム（${aRoot}F付近）`});
  return out;
}
function formKey(form){return parseFingering(form).join(",")}
function formPosition(form){
  const f=parseFingering(form),p=f.filter(x=>x>0);
  return p.length?p.reduce((a,b)=>a+b,0)/p.length:0;
}
function formDistance(a,b){
  const aa=parseFingering(a),bb=parseFingering(b);
  if(aa.length!==6||bb.length!==6)return 999;
  let d=0,n=0;
  for(let i=0;i<6;i++){
    if(aa[i]>0&&bb[i]>0){d+=Math.abs(aa[i]-bb[i]);n++}
    else if(aa[i]!==bb[i])d+=1.25;
  }
  return d/(n||1)+Math.abs(formPosition(aa)-formPosition(bb))*0.18;
}
function chordCandidateObjects(code){
  const seen=new Set(),out=[];
  for(const r of codes.filter(x=>x["コード"]===code)){
    const f=parseFingering(r["押さえ方"]);
    if(f.length===6){
      const k=formKey(f);
      if(!seen.has(k)){seen.add(k);out.push({form:f,label:"DB登録フォーム"});}
    }
  }
  for(const x of generatedForms(code)){
    const k=formKey(x.form);
    if(!seen.has(k)){seen.add(k);out.push(x);}
  }
  return out;
}
function chordCandidates(code){return chordCandidateObjects(code).map(x=>x.form)}
function optimizeProgression(chordList){
  let prev=null;
  return chordList.map(code=>{
    const candidates=chordCandidateObjects(code);
    if(!candidates.length)return{code,form:null,auto:false,label:"未登録"};
    let best=candidates[0],bestScore=Infinity;
    for(const c of candidates){
      const score=prev?formDistance(prev,c.form):formPosition(c.form)+parseFingering(c.form).filter(x=>x===0).length*0.15;
      if(score<bestScore){bestScore=score;best=c;}
    }
    prev=best.form;
    return{code,form:best.form,auto:candidates.length>1,candidates:candidates.length,label:best.label};
  });
}

const NOTE_NAMES=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const INTERVAL_LABEL={0:"Root",1:"♭9",2:"9",3:"♭3",4:"3",5:"11",6:"♭5/#11",7:"5",8:"♭13",9:"13",10:"♭7",11:"7"};
function chordBackingNotes(code){
 const r=codes.find(x=>x["コード"]===code),c=parseChordName(code); if(!r||!c||NOTE_PC[c.root]==null)return null;
 const raw=String(r["構成音"]||"").replace(/[,、]/g," ").split(/\s+/).filter(Boolean),pcs=[];
 for(const n of raw){const m=String(n).match(/^([A-G](?:#|b)?)/);if(m&&NOTE_PC[m[1]]!=null)pcs.push(NOTE_PC[m[1]])}
 const rootPc=NOTE_PC[c.root],ints=[...new Set(pcs)].map(pc=>(pc-rootPc+12)%12),q=c.quality.toLowerCase();
 let priority=q.includes("sus2")?[2,7,5]:q.includes("sus4")?[5,7,2]:q.includes("7")?[4,10,7,2,9]:q.includes("maj")?[4,11,7,2,9]:q.includes("m")?[3,10,7,2,9]:[4,7,2,9,5];
 const selected=priority.filter(i=>ints.includes(i)).slice(0,3),fallback=ints.filter(i=>i!==0&&!selected.includes(i)); while(selected.length<2&&fallback.length)selected.push(fallback.shift());
 const notes=selected.map(i=>({note:NOTE_NAMES[(rootPc+i)%12],interval:INTERVAL_LABEL[i]||String(i)}));
 let role="3度を優先"; if(selected.includes(4)&&selected.includes(10))role="3度＋♭7を優先（コード感を明確に）"; else if(selected.includes(4)&&selected.includes(11))role="3度＋7度を優先（maj7感を明確に）"; else if(selected.includes(3)&&selected.includes(10))role="♭3＋♭7を優先（マイナー感を明確に）"; else if(q.includes("sus"))role="3度を避け、sus音＋5度を優先";
 return {notes,role,avoid:`低音側の${c.root}（Root）はベースに任せ、ギターでは重ねすぎない`};
}
const BACKING_STYLES={
 alt:{name:"オルタナ",bass:"Root中心＋必要に応じて5度・オクターブ。ギターはRootを重ねすぎず、3度・7度・9度・sus/add9で色を作る。",priority:[4,10,11,2,7,5],avoid:"低音域のRootはベースに任せ、ギターは中高域のコード感と余韻を担当。"},
 jpop:{name:"J-POP",bass:"Rootを明確に弾き、5度や経過音でベースラインを滑らかにする。",priority:[4,10,11,2,7,9,5],avoid:"ギターはRootの重複を減らし、3度・7度・9度でコード進行を明確にする。"},
 rock:{name:"ロック",bass:"Root＋5度＋オクターブを軸に、リズムを強く支える。",priority:[7,0,4,10,3,5],avoid:"ギターはRoot＋5度のパワー感を優先。必要に応じて3度/♭3でメジャー・マイナー感を出す。"},
 ballad:{name:"バラード",bass:"Rootを安定して支え、5度・オクターブ・滑らかな経過音を使う。",priority:[4,11,10,2,7,9,5],avoid:"ギターは3度・7度・9度を中心に、開放弦や余韻を活かして広がりを作る。"}
};
function styleBackingNotes(code,style){
 const base=chordBackingNotes(code),r=codes.find(x=>x["コード"]===code),c=parseChordName(code),cfg=BACKING_STYLES[style]||BACKING_STYLES.alt;
 if(!r||!c||NOTE_PC[c.root]==null)return null;
 const raw=String(r["構成音"]||"").replace(/[,、]/g," ").split(/\s+/).filter(Boolean),pcs=[];
 for(const n of raw){const m=String(n).match(/^([A-G](?:#|b)?)/);if(m&&NOTE_PC[m[1]]!=null)pcs.push(NOTE_PC[m[1]])}
 const rootPc=NOTE_PC[c.root],ints=[...new Set(pcs)].map(pc=>(pc-rootPc+12)%12),selected=cfg.priority.filter(i=>ints.includes(i)).slice(0,3);
 const notes=selected.map(i=>({note:NOTE_NAMES[(rootPc+i)%12],interval:INTERVAL_LABEL[i]||String(i)}));
 return {notes:notes.length?notes:(base?.notes||[]),role:cfg.name+"："+cfg.bass,avoid:cfg.avoid};
}
function styleBackingNoteHtml(code,style){
 const x=styleBackingNotes(code,style);if(!x)return "";
 return `<div class="backingNote styleBacking"><b>🎚 ${esc(BACKING_STYLES[style]?.name||"オルタナ")}向けバッキング</b><br><span class="muted">${esc(x.role)}</span><div>${x.notes.map(n=>`<span class="notePill">${esc(n.note)} <small>${esc(n.interval)}</small></span>`).join("")}</div><div class="muted">${esc(x.avoid)}</div></div>`;
}
const GUITAR_TUNING_PC=[4,9,2,7,11,4],STRING_NAMES=["6弦","5弦","4弦","3弦","2弦","1弦"];
function ensemblePlacement(code,form){
 const c=parseChordName(code); if(!c||NOTE_PC[c.root]==null||!form)return null;
 const f=parseFingering(form); if(f.length!==6)return null;
 const rootPc=NOTE_PC[c.root],tones=[];
 for(let i=0;i<6;i++){if(f[i]===-1||f[i]==null)continue;const fret=f[i],pc=(GUITAR_TUNING_PC[i]+fret)%12,interval=(pc-rootPc+12)%12;tones.push({string:STRING_NAMES[i],stringNo:6-i,fret,note:NOTE_NAMES[pc],interval});}
 return {rootPc,tones,bass:`${c.root}（Root）`};
}
function styleEnsembleHtml(code,form,style){
 const base=ensemblePlacement(code,form);if(!base)return "";
 const cfg=BACKING_STYLES[style]||BACKING_STYLES.alt,selected=[];
 for(const int of cfg.priority){const t=base.tones.find(y=>y.interval===int&&!selected.some(z=>z.stringNo===y.stringNo));if(t)selected.push(t)}
 for(const t of base.tones){if(t.interval!==0&&!selected.some(y=>y.stringNo===t.stringNo))selected.push(t)}
 const fmt=t=>`${t.string} ${t.fret===0?"開放":`${t.fret}F`} ${t.note}`;
 return `<div class="ensembleBox styleEnsemble"><b>🎛 ${esc(cfg.name)}：実際のアンサンブル配置</b><div class="muted">ベース：<strong>${esc(base.bass)}</strong></div><div class="ensembleLine"><span>ギター：</span>${selected.length?selected.slice(0,3).map(n=>`<span class="notePill">${esc(fmt(n))} <small>${esc(INTERVAL_LABEL[n.interval]||String(n.interval))}</small></span>`).join(""):'<span class="muted">候補音を取れるフォームがありません</span>'}</div><div class="muted">${esc(cfg.avoid)}</div></div>`;
}
// Guitar dictionary
const G=rows("DB_ギター"),cats=uniq(G.map(r=>r["カテゴリ"]));
opts("gcode",codes.map(r=>r["コード"]));
opts("gcat",cats);
function updateGItems(){
  const c=document.getElementById("gcat")?.value;
  opts("gitem",G.filter(r=>r["カテゴリ"]===c).map(r=>r["項目"]));
}
function updateGForms(){
  const code=document.getElementById("gcode")?.value;
  const list=chordCandidateObjects(code);
  const el=document.getElementById("gform");
  if(!el)return;
  el.innerHTML=list.map((x,i)=>`<option value="${i}">${i+1}. ${esc(x.label)}｜6→1弦：${esc(fingeringText(x.form))}</option>`).join("");
  el.dataset.forms=JSON.stringify(list.map(x=>x.form));
}
updateGItems();updateGForms();
document.getElementById("gcat")?.addEventListener("change",updateGItems);
document.getElementById("gcode")?.addEventListener("change",updateGForms);
document.getElementById("gbtnChord")?.addEventListener("click",()=>{
  const code=document.getElementById("gcode").value;
  const el=document.getElementById("gform");
  const forms=JSON.parse(el?.dataset.forms||"[]");
  const idx=Math.max(0,parseInt(el?.value||"0",10)||0);
  const form=forms[idx]||parseFingering(codes.find(r=>r["コード"]===code)?.["押さえ方"]);
  const box=document.getElementById("guitarChordOut");
  if(box)box.innerHTML=form&&parseFingering(form).length===6
    ?`<div class="chordDiagram"><h3>🎸 ${esc(code)} の押さえ方</h3>${chordSvg(code,form)}<div class="muted" style="text-align:center;margin-top:6px">6弦→1弦：${esc(fingeringText(form))}</div></div>`
    :`<div class="muted">押さえ方データがありません。</div>`;
});
document.getElementById("gbtnTech")?.addEventListener("click",()=>{
  const c=document.getElementById("gcat").value,i=document.getElementById("gitem").value;
  render("guitarTechOut",G.filter(r=>r["カテゴリ"]===c&&r["項目"]===i));
});

// Custom progression builder
let progSlots=[];
function addSlot(code){progSlots.push(code||codes[0]?.["コード"]||"");drawSlots()}
function drawSlots(){
  const e=document.getElementById("customProgress");if(!e)return;
  e.innerHTML=progSlots.map((v,i)=>`<div class="slot"><div class="slothead"><span>${i+1}小節目</span><button class="remove" data-i="${i}" type="button">×</button></div><select data-slot="${i}">${codes.map(r=>`<option value="${esc(r["コード"])}" ${r["コード"]===v?"selected":""}>${esc(r["コード"])}</option>`).join("")}</select></div>`).join("");
  e.querySelectorAll("select[data-slot]").forEach(s=>s.addEventListener("change",ev=>{progSlots[Number(ev.target.dataset.slot)]=ev.target.value}));
  e.querySelectorAll("button.remove").forEach(b=>b.addEventListener("click",()=>{progSlots.splice(Number(b.dataset.i),1);drawSlots()}));
}
["C","G","Am","F"].forEach(addSlot);
document.getElementById("addProg")?.addEventListener("click",()=>{if(progSlots.length<64)addSlot()});
document.getElementById("clearProg")?.addEventListener("click",()=>{progSlots=[];drawSlots()});
document.getElementById("showProg")?.addEventListener("click",()=>{
  const out=document.getElementById("progGuitarOut");if(!out)return;
  try{
    // Read current selects once more so the latest UI choices are guaranteed to be reflected.
    document.querySelectorAll("#customProgress select[data-slot]").forEach(s=>{progSlots[Number(s.dataset.slot)]=s.value});
    if(!progSlots.length){out.innerHTML='<div class="muted">コードを1つ以上追加してください。</div>';return}
    const optimized=optimizeProgression(progSlots);
    const rootMode=document.getElementById("bassRootMode")?.checked!==false;
    const style=document.getElementById("backingStyle")?.value||"alt";
    const cfg=BACKING_STYLES[style]||BACKING_STYLES.alt;
    const modeNote=rootMode?`<div class="backingNote"><b>🎚 ${esc(cfg.name)}スタイルで自動提案</b><br><span class="muted">${esc(cfg.bass)}</span></div>`:"";
    const rowsHtml=Array.from({length:Math.ceil(optimized.length/4)},(_,row)=>{
      const cards=optimized.slice(row*4,row*4+4).map((item,j)=>{
        const i=row*4+j;
        let extra="";
        if(rootMode){
          try{extra+=styleBackingNoteHtml(item.code,style)}catch(e){}
          try{extra+=styleEnsembleHtml(item.code,item.form,style)}catch(e){}
        }
        return `<div class="miniCard"><h4>${i+1}小節目<br>${esc(item.code)}</h4>${item.form?chordSvg(item.code,item.form):'<div class="muted">押さえ方未登録</div>'}${item.form?`<div class="formNote">${esc(item.label||"フォーム")}<br>6→1弦：${esc(fingeringText(item.form))}</div>`:""}${extra}</div>`;
      }).join("");
      return `<div class="progressRow"><div class="rowLabel">${row*4+1}〜${Math.min(row*4+4,optimized.length)}小節</div><div class="miniDiagrams">${cards}</div></div>`;
    }).join("");
    out.innerHTML=`<div class="optimizerNote">🎯 <b>自動最適化済み</b><br><span class="muted">前後のコードとのフレット移動が少なくなるフォームを優先しています。</span></div>${modeNote}<div class="progressRows">${rowsHtml}</div>`;
    out.scrollIntoView({behavior:"smooth",block:"start"});
  }catch(err){
    console.error(err);
    out.innerHTML=`<div class="resultbox"><b>表示エラー</b><div class="value">コード進行の表示処理でエラーが発生しました。再読み込み後にもう一度お試しください。</div></div>`;
  }
});

})();