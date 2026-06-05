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

      // salida temprana
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

  let output = "";

  const totalChunks = CHUNKS_PER_SIDE * CHUNKS_PER_SIDE;
  let processedChunks = 0;

  for (let cy = 0; cy < CHUNKS_PER_SIDE; cy++) {
    for (let cx = 0; cx < CHUNKS_PER_SIDE; cx++) {

      output += `Chunk (${cx}, ${cy})\n`;

      for (let by = 0; by < BLOCKS_PER_CHUNK; by++) {
        for (let bx = 0; bx < BLOCKS_PER_CHUNK; bx++) {

          const x = cx * CHUNK_SIZE + bx * BLOCK_SIZE;
          const y = cy * CHUNK_SIZE + by * BLOCK_SIZE;

          const block = ctx.getImageData(x, y, BLOCK_SIZE, BLOCK_SIZE);
          const best = matchBlock(block);

          output += best.toString(16) + "  ";
        }
        output += "\n";
      }
      output += "\n";

      processedChunks++;
      updateProgress(processedChunks, totalChunks);

      // deja respirar al navegador
      await new Promise(r => setTimeout(r, 0));
    }
  }

  lastOutputText = output;

  document.getElementById("output").textContent = output;
  document.getElementById("progressText").textContent =
    "✔ Procesado completo";
  document.getElementById("downloadBtn").disabled = false;
}

// =======================
// DESCARGA TXT
// =======================
function downloadTXT() {
  const blob = new Blob([lastOutputText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "resultado.txt";
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

  document.getElementById("output").textContent = "";
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressText").textContent = "Inicializando...";
  document.getElementById("downloadBtn").disabled = true;

  await loadTemplates();
  await processImage(input.files[0]);
});

document.getElementById("downloadBtn").addEventListener("click", downloadTXT);
