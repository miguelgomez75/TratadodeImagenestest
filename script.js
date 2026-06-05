const IMAGE_SIZE = 2048;
const CHUNK_SIZE = 256;
const BLOCK_SIZE = 16;
const CHUNKS_PER_SIDE = 8;
const BLOCKS_PER_CHUNK = 16;

let templates = [];
let lastOutputText = "";

// =======================
// UTILIDAD PROGRESO
// =======================
function updateProgress(current, total) {
  const percent = Math.floor((current / total) * 100);
  document.getElementById("progressBar").style.width = percent + "%";
  document.getElementById("progressText").textContent =
    `Procesando... ${percent}%`;
}

// =======================
// CARGA DE PLANTILLAS
// =======================
async function loadTemplates() {
  templates = [];

  const canvas = document.createElement("canvas");
  canvas.width = BLOCK_SIZE;
  canvas.height = BLOCK_SIZE;
  const ctx = canvas.getContext("2d");

  document.getElementById("progressText").textContent =
    "Cargando plantillas...";

  for (let i = 0; i < 16; i++) {
    const hex = i.toString(16);
    const img = new Image();
    img.src = `plantillas/${hex}.png`;
    await img.decode();

    ctx.clearRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, BLOCK_SIZE, BLOCK_SIZE).data;
    templates.push(data);
  }
}

// =======================
// COMPARACIÓN
// =======================
function matchBlock(blockData) {
  let bestScore = Infinity;
  let bestIndex = 0;

  const blk = blockData.data;

  for (let i = 0; i < templates.length; i++) {
    let diff = 0;
    const tpl = templates[i];

    for (let p = 0; p < blk.length; p += 4) {
      diff += Math.abs(blk[p]     - tpl[p]);
      diff += Math.abs(blk[p + 1] - tpl[p + 1]);
      diff += Math.abs(blk[p + 2] - tpl[p + 2]);

      if (diff >= bestScore) break;
    }

    if (diff < bestScore) {
      bestScore = diff;
      bestIndex = i;
    }
  }
  return bestIndex;
}

// =======================
// PROCESADO PRINCIPAL
// =======================
async function processImage(file) {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();

  if (img.width !== IMAGE_SIZE || img.height !== IMAGE_SIZE) {
    alert("La imagen debe ser 2048x2048");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_SIZE;
  canvas.height = IMAGE_SIZE;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  let csvOutput = "";
  const container = document.getElementById("output-container");
  container.innerHTML = ""; // Limpiar contenido anterior

  const totalChunks = CHUNKS_PER_SIDE * CHUNKS_PER_SIDE;
  let processedChunks = 0;

  for (let cy = 0; cy < CHUNKS_PER_SIDE; cy++) {
    for (let cx = 0; cx < CHUNKS_PER_SIDE; cx++) {

      // Crear estructura de tabla visual para este Chunk
      const chunkTitle = document.createElement("h3");
      chunkTitle.textContent = `Chunk (${cx}, ${cy})`;
      chunkTitle.style.marginTop = "20px";
      container.appendChild(chunkTitle);

      const table = document.createElement("table");
      table.className = "chunk-table";

      csvOutput += `Chunk (${cx}; ${cy})\n`;

      for (let by = 0; by < BLOCKS_PER_CHUNK; by++) {
        const tr = document.createElement("tr");
        let rowBlocks = [];

        for (let bx = 0; bx < BLOCKS_PER_CHUNK; bx++) {
          const x = cx * CHUNK_SIZE + bx * BLOCK_SIZE;
          const y = cy * CHUNK_SIZE + by * BLOCK_SIZE;

          const block = ctx.getImageData(x, y, BLOCK_SIZE, BLOCK_SIZE);
          const best = matchBlock(block);
          const hexValue = best.toString(16);

          rowBlocks.push(hexValue);

          // Celda visual HTML
          const td = document.createElement("td");
          td.textContent = hexValue;
          tr.appendChild(td);
        }

        table.appendChild(tr);
        csvOutput += rowBlocks.join(";") + "\n";
      }

      container.appendChild(table);
      csvOutput += "\n";

      processedChunks++;
      updateProgress(processedChunks, totalChunks);

      await new Promise(r => setTimeout(r, 0));
    }
  }

  lastOutputText = csvOutput;

  document.getElementById("progressText").textContent = "✔ Procesado completo";
  document.getElementById("downloadBtn").disabled = false;
}

// =======================
// DESCARGA CSV (EXCEL)
// =======================
function downloadCSV() {
  // El caracter "\ufeff" asegura que Excel detecte la codificación UTF-8 correctamente
  const blob = new Blob(["\ufeff" + lastOutputText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "mapa_procesado.csv"; 
  a.click();

  URL.revokeObjectURL(url);
}

// =======================
// EVENTOS
// =======================
document.getElementById("runBtn").addEventListener("click", async () => {
  const input = document.getElementById("inputImage");
  if (!input.files.length) {
    alert("Selecciona una imagen");
    return;
  }

  document.getElementById("output-container").innerHTML = "";
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressText").textContent = "Inicializando...";
  document.getElementById("downloadBtn").disabled = true;

  await loadTemplates();
  await processImage(input.files[0]);
});

document.getElementById("downloadBtn").addEventListener("click", downloadCSV);
