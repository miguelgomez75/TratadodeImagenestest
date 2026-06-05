// =======================
// PROCESADO PRINCIPAL (Modificado para usar comas)
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
  container.innerHTML = ""; 

  const totalChunks = CHUNKS_PER_SIDE * CHUNKS_PER_SIDE;
  let processedChunks = 0;

  for (let cy = 0; cy < CHUNKS_PER_SIDE; cy++) {
    for (let cx = 0; cx < CHUNKS_PER_SIDE; cx++) {

      const chunkTitle = document.createElement("h3");
      chunkTitle.textContent = `Chunk (${cx}, ${cy})`;
      chunkTitle.style.marginTop = "20px";
      container.appendChild(chunkTitle);

      const table = document.createElement("table");
      table.className = "chunk-table";

      // Encabezado del Chunk en el CSV
      csvOutput += `Chunk (${cx}-${cy})\n`;

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

          const td = document.createElement("td");
          td.textContent = hexValue;
          tr.appendChild(td);
        }

        table.appendChild(tr);
        // CAMBIO: Ahora unimos con comas limpias para Google Sheets
        csvOutput += rowBlocks.join(",") + "\n"; 
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
// DESCARGA CORRECTA PARA GOOGLE SHEETS
// =======================
function downloadCSV() {
  // Forzamos el MIME type a text/csv y añadimos el BOM para asegurar UTF-8
  const blob = new Blob(["\ufeff" + lastOutputText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  
  // OBLIGAMOS al navegador a guardarlo con extensión .csv
  a.download = "mapa_procesado.csv"; 
  
  document.body.appendChild(a); // Requisito en algunos navegadores para que funcione bien
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
