const IMAGE_SIZE = 2048;
const CHUNK_SIZE = 256;
const BLOCK_SIZE = 16;
const CHUNKS_PER_SIDE = 8;
const BLOCKS_PER_CHUNK = 16;

let templates = [];
let lastOutputText = "";

// =======================
// CARGA DE PLANTILLAS
// =======================
async function loadTemplates() {
  templates = [];

  for (let i = 0; i < 16; i++) {
    const hex = i.toString(16);
    const img = new Image();
    img.src = `plantillas/${hex}.png`;
    await img.decode();
    templates.push(img);
  }
}

// =======================
// COMPARACIÓN
// =======================
function matchBlock(blockData) {
  let bestScore = Infinity;
  let bestIndex = 0;

  for (let i = 0; i < templates.length; i++) {
    const score = compareBlocks(blockData, templates[i]);
    if (score < bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function compareBlocks(blockData, templateImg) {
  const canvas = document.createElement("canvas");
  canvas.width = BLOCK_SIZE;
  canvas.height = BLOCK_SIZE;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(templateImg, 0, 0);
  const tpl = ctx.getImageData(0, 0, BLOCK_SIZE, BLOCK_SIZE).data;
  const blk = blockData.data;

  let diff = 0;
  for (let i = 0; i < blk.length; i += 4) {
    diff += Math.abs(blk[i]     - tpl[i]);
    diff += Math.abs(blk[i + 1] - tpl[i + 1]);
    diff += Math.abs(blk[i + 2] - tpl[i + 2]);
  }
  return diff;
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

  for (let cy = 0; cy < CHUNKS_PER_SIDE; cy++) {
    for (let cx = 0; cx < CHUNKS_PER_SIDE; cx++) {

      output += `Chunk (${cx}, ${cy})\n`;

      for (let by = 0; by < BLOCKS_PER_CHUNK; by++) {
        for (let bx = 0; bx < BLOCKS_PER_CHUNK; bx++) {

          const x = cx * CHUNK_SIZE + bx * BLOCK_SIZE;
          const y = cy * CHUNK_SIZE + by * BLOCK_SIZE;

          const block = ctx.getImageData(x, y, BLOCK_SIZE, BLOCK_SIZE);
          const best = matchBlock(block);

          output += best.toString(16) + " ";
        }
        output += "\n";
      }
      output += "\n";
    }
  }

  lastOutputText = output;
  document.getElementById("output").textContent = output;
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

  document.getElementById("output").textContent = "Procesando...";
  document.getElementById("downloadBtn").disabled = true;

  await loadTemplates();
  await processImage(input.files[0]);
});

document.getElementById("downloadBtn").addEventListener("click", downloadTXT);
