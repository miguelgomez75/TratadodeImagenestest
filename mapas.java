package Utilidades.MapasMinecraft;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.FileWriter;
import javax.imageio.ImageIO;

public class mapas {

    static final int IMAGE_SIZE = 2048;
    static final int CHUNK_SIZE = 256;
    static final int BLOCK_SIZE = 16;
    static final int CHUNKS_PER_SIDE = 8;
    static final int BLOCKS_PER_CHUNK = 16;

    public static void main(String[] args) {

        try {

            File imageFile = new File("/Users/miguelgomezcruz/Desktop/MapasMinecraft/dibujo.png");

            System.out.println("Ruta absoluta   = " + imageFile.getAbsolutePath());
            System.out.println("Existe?         = " + imageFile.exists());
            System.out.println("Se puede leer?  = " + imageFile.canRead());

            if (!imageFile.exists()) {
                throw new RuntimeException("❌ El archivo NO existe");
            }

            BufferedImage source;

            try (InputStream in = new FileInputStream(imageFile)) {
                source = ImageIO.read(in);
            }

            if (source == null) {
                throw new RuntimeException("❌ ImageIO no pudo leer la imagen (no es PNG válido?)");
            }

            System.out.println("Resolución detectada = " + source.getWidth() + "x" + source.getHeight());

            if (source.getWidth() != IMAGE_SIZE || source.getHeight() != IMAGE_SIZE) {
                throw new IllegalArgumentException("❌ La imagen debe ser 2048x2048 exactos");
            }

            // ========= CARGAR PLANTILLAS =========
            BufferedImage[] templates = new BufferedImage[16];

            for (int i = 0; i < 16; i++) {
                String hex = Integer.toHexString(i);
                File templateFile = new File("/Users/miguelgomezcruz/Desktop/Men-de-utilidades/src/Utilidades/MapasMinecraft/plantillas/" + hex + ".png");

                if (!templateFile.exists()) {
                    throw new RuntimeException("❌ Falta plantilla: " + templateFile.getAbsolutePath());
                }

                try (InputStream in = new FileInputStream(templateFile)) {
                    templates[i] = ImageIO.read(in);
                }

                if (templates[i] == null) {
                    throw new RuntimeException("❌ Error al leer plantilla " + hex + ".png — NO es PNG válido?");
                }
            }

            // ========= GUARDAR EN ARCHIVO =========
            File outputFile = new File("/Users/miguelgomezcruz/Desktop/Men-de-utilidades/src/Utilidades/MapasMinecraft/mapa_chunks.txt");
            try (FileWriter writer = new FileWriter(outputFile)) {

                for (int cy = 0; cy < CHUNKS_PER_SIDE; cy++) {
                    for (int cx = 0; cx < CHUNKS_PER_SIDE; cx++) {

                        writer.write("Chunk (" + cx + ", " + cy + "):\n");

                        String[][] table = processChunk(source, templates, cx, cy);

                        // Escribir tabla en el archivo
                        for (int y = 0; y < table.length; y++) {
                            for (int x = 0; x < table[y].length; x++) {
                                writer.write(table[y][x] + " ");
                            }
                            writer.write("\n");
                        }

                        writer.write("\n"); // línea extra entre chunks
                    }
                }
            }

            System.out.println("✅ Todos los chunks guardados en: " + outputFile.getAbsolutePath());

        } catch (Exception e) {
            System.out.println("💥 ERROR:");
            e.printStackTrace();
        }
    }

    static String[][] processChunk(BufferedImage source, BufferedImage[] templates, int chunkX, int chunkY) {
        String[][] table = new String[BLOCKS_PER_CHUNK][BLOCKS_PER_CHUNK];

        for (int by = 0; by < BLOCKS_PER_CHUNK; by++) {
            for (int bx = 0; bx < BLOCKS_PER_CHUNK; bx++) {

                BufferedImage block = getBlockFromChunk(source, chunkX, chunkY, bx, by);
                int bestTemplate = matchBlock(block, templates);
                table[by][bx] = Integer.toHexString(bestTemplate);
            }
        }
        return table;
    }

    static BufferedImage getBlockFromChunk(BufferedImage img, int chunkX, int chunkY, int blockX, int blockY) {
        int x = chunkX * CHUNK_SIZE + blockX * BLOCK_SIZE;
        int y = chunkY * CHUNK_SIZE + blockY * BLOCK_SIZE;
        return img.getSubimage(x, y, BLOCK_SIZE, BLOCK_SIZE);
    }

    static int matchBlock(BufferedImage block, BufferedImage[] templates) {
        long bestScore = Long.MAX_VALUE;
        int bestIndex = 0;

        for (int i = 0; i < templates.length; i++) {
            long score = compareBlocks(block, templates[i]);
            if (score < bestScore) {
                bestScore = score;
                bestIndex = i;
            }
        }
        return bestIndex;
    }

    static long compareBlocks(BufferedImage a, BufferedImage b) {
        long diff = 0;
        for (int y = 0; y < BLOCK_SIZE; y++) {
            for (int x = 0; x < BLOCK_SIZE; x++) {

                int rgbA = a.getRGB(x, y);
                int rgbB = b.getRGB(x, y);

                int rA = (rgbA >> 16) & 0xff;
                int gA = (rgbA >> 8) & 0xff;
                int bA = rgbA & 0xff;

                int rB = (rgbB >> 16) & 0xff;
                int gB = (rgbB >> 8) & 0xff;
                int bB = rgbB & 0xff;

                diff += Math.abs(rA - rB);
                diff += Math.abs(gA - gB);
                diff += Math.abs(bA - bB);
            }
        }
        return diff;
    }
}
