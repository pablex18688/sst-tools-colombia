const STORAGE_KEY = "sst-tools-luxometry-v1";
let measurements = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const form = document.getElementById("measurementForm");
const rows = document.getElementById("rows");

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(measurements)); }
function fmt(n){ return Number.isFinite(n) ? n.toFixed(2) : "—"; }

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function render(){
  rows.innerHTML = "";
  measurements.forEach((m,i)=>{
    const meets = m.lux >= m.reference;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${escapeHtml(m.area)}</td>
      <td>${escapeHtml(m.point)}</td>
      <td>${escapeHtml(m.source)}</td>
      <td>${fmt(m.lux)}</td>
      <td>${fmt(m.reference)}</td>
      <td class="${meets ? "ok":"bad"}">${meets ? "Cumple referencia":"Bajo referencia"}</td>
      <td>${escapeHtml(m.note || "")}</td>
      <td><button type="button" class="danger delete" data-index="${i}">Eliminar</button></td>`;
    rows.appendChild(tr);
  });

  const values = measurements.map(m=>m.lux);
  const avg = values.length ? values.reduce((a,b)=>a+b,0)/values.length : NaN;
  const min = values.length ? Math.min(...values) : NaN;
  const max = values.length ? Math.max(...values) : NaN;
  const uniformity = values.length && avg ? min/avg : NaN;

  document.getElementById("avg").textContent = Number.isFinite(avg) ? `${fmt(avg)} lx` : "—";
  document.getElementById("min").textContent = Number.isFinite(min) ? `${fmt(min)} lx` : "—";
  document.getElementById("max").textContent = Number.isFinite(max) ? `${fmt(max)} lx` : "—";
  document.getElementById("uniformity").textContent = Number.isFinite(uniformity) ? uniformity.toFixed(3) : "—";
}

form.addEventListener("submit", e=>{
  e.preventDefault();
  measurements.push({
    area: document.getElementById("area").value.trim(),
    point: document.getElementById("point").value.trim(),
    source: document.getElementById("source").value,
    lux: Number(document.getElementById("lux").value),
    reference: Number(document.getElementById("reference").value),
    note: document.getElementById("note").value.trim()
  });
  save(); render(); form.reset();
});

rows.addEventListener("click", e=>{
  if(!e.target.classList.contains("delete")) return;
  measurements.splice(Number(e.target.dataset.index),1);
  save(); render();
});

document.getElementById("clearAll").addEventListener("click", ()=>{
  if(confirm("¿Borrar todas las mediciones guardadas?")){
    measurements=[]; save(); render();
  }
});

function csvCell(v){
  const s=String(v ?? "");
  return `"${s.replace(/"/g,'""')}"`;
}

document.getElementById("exportCsv").addEventListener("click", ()=>{
  if(!measurements.length) return alert("No hay mediciones para exportar.");
  const header=["Area","Punto","Fuente","Lux","Referencia","Resultado","Observacion"];
  const data=measurements.map(m=>[
    m.area,m.point,m.source,m.lux,m.reference,
    m.lux>=m.reference ? "Cumple referencia":"Bajo referencia",
    m.note || ""
  ]);
  const csv=[header,...data].map(r=>r.map(csvCell).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`luxometria-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

render();
