// NeuroSonic - Statik (GitHub Pages) versiyonu
// Tum analizler onceden hesaplanmis ve data/precomputed.json'da gomulu

let selectedSample = null;
let preData = {};

const $ = id => document.getElementById(id);
const sampleGrid = $("sampleGrid");
const analyzeBtn = $("analyzeBtn");

// ========= Onceden hesaplanmis veriyi yukle =========
async function loadPrecomputed() {
  try {
    const r = await fetch("data/precomputed.json");
    preData = await r.json();
    buildSampleTiles();
  } catch (e) {
    console.error("precomputed yuklenemedi", e);
    sampleGrid.innerHTML = "<p style='color:var(--rd)'>Veri yuklenemedi: " + e.message + "</p>";
  }
}

function buildSampleTiles() {
  const labels = {
    "01_saglikli.png": "SAĞLIKLI",
    "02_hafif_ms.png": "HAFİF MS",
    "03_orta_ms.png":  "ORTA MS",
    "04_ileri_ms.png": "İLERİ MS"
  };
  sampleGrid.innerHTML = Object.keys(preData).map(fn => `
    <div class="sample-tile" data-filename="${fn}">
      <img src="samples/${fn}" alt="${labels[fn]||fn}">
      <span>${labels[fn] || fn}</span>
    </div>
  `).join("");

  sampleGrid.querySelectorAll(".sample-tile").forEach(tile => {
    tile.addEventListener("click", () => selectSample(tile));
  });
}

function selectSample(tile) {
  sampleGrid.querySelectorAll(".sample-tile").forEach(t => t.classList.remove("active"));
  tile.classList.add("active");
  selectedSample = tile.dataset.filename;
  analyzeBtn.disabled = false;
  analyzeBtn.querySelector(".btn-text").textContent = "▶ Analizi Göster: " + selectedSample;
}

// ========= Analiz (anlik, JSON'dan) =========
analyzeBtn.addEventListener("click", () => {
  if (!selectedSample) return;
  analyzeBtn.classList.add("loading");
  analyzeBtn.querySelector(".btn-text").textContent = "Yükleniyor...";

  // Dramatik etki icin 600ms gecikme
  setTimeout(() => {
    const data = preData[selectedSample];
    if (!data) {
      alert("Veri bulunamadi: " + selectedSample);
      analyzeBtn.classList.remove("loading");
      return;
    }
    renderResults(data);
    document.getElementById("results").style.display = "block";
    document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
    analyzeBtn.classList.remove("loading");
    analyzeBtn.querySelector(".btn-text").textContent = "▶ Yeniden Göster";
  }, 600);
});

// ========= Sonuc render (eski versiyon ile ayni) =========
function renderResults(d) {
  $("imgOriginal").src = d.images.original;
  $("imgEnhanced").src = d.images.enhanced;
  $("imgMask").src = d.images.brain_mask;
  $("imgSegment").src = d.images.segmentation;

  const diag = d.diagnosis;
  $("diagVerdict").textContent = diag.verdict;
  $("probValue").textContent = (diag.ms_probability * 100).toFixed(1) + "%";
  $("probFill").style.width = (diag.ms_probability * 100) + "%";
  $("diagCard").className = "score-card " + diag.verdict_color;

  const totalArea = d.lesions.reduce((s, L) => s + L.area_mm2, 0);
  $("lesionCount").textContent = d.lesion_count;
  $("lesionTotalArea").textContent = `Toplam yük: ${totalArea.toFixed(1)} mm²`;
  $("jaccardValue").textContent = (d.jaccard * 100).toFixed(1) + "%";
  $("soundVoices").textContent = d.sound.voices.length + " ses";
  $("soundTempo").textContent = d.sound.tempo_bpm + " BPM";

  $("criteriaList").innerHTML = Object.entries(diag.criteria).map(([n, m]) =>
    `<li class="${m ? 'met' : ''}"><span class="ico">${m ? '✓' : '·'}</span><span>${n}</span></li>`
  ).join("");
  $("criteriaCount").textContent = `${diag.criteria_met}/${diag.criteria_total}`;

  const maxImp = Math.max(...diag.top_features.map(f => f.importance), 0.001);
  $("featureList").innerHTML = diag.top_features.map(f => `
    <div class="feature-row">
      <span class="name">${f.name}</span>
      <div class="bar"><div style="width:${(f.importance/maxImp*100).toFixed(0)}%"></div></div>
      <span class="val">${f.value}</span>
    </div>
  `).join("");

  const tbody = $("lesionTbody");
  if (d.lesions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--txt-2)">Lezyon tespit edilmedi (sağlıklı bulgu).</td></tr>`;
  } else {
    tbody.innerHTML = d.lesions.map((L, i) => {
      const v = d.sound.voices[i];
      return `<tr>
        <td class="num">#${L.id}</td><td>${L.region}</td>
        <td class="num">${L.area_mm2}</td><td class="num">${L.perimeter}</td>
        <td class="num">${L.eccentricity}</td><td class="num">${L.mean_intensity}</td>
        <td class="num">${v ? v.freq + ' Hz' : '–'}</td>
      </tr>`;
    }).join("");
  }

  $("soundNarrative").textContent = d.sound.narrative;
  $("voiceCloud").innerHTML = d.sound.voices.map(v =>
    `<span class="voice-chip" data-id="${v.id}">${v.label} · ${v.freq} Hz</span>`
  ).join("");

  if (window.NeuroSound) window.NeuroSound.load(d.sound);
}

loadPrecomputed();
