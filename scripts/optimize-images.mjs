#!/usr/bin/env node

/**
 * Optimizes JPEG images under public/assets by resizing large images and recompressing them.
 *
 * - Caps width at MAX_WIDTH while respecting aspect ratio.
 * - Re-encodes as progressive JPEG with moderate quality using mozjpeg for smaller payloads.
 * - Skips writing if the optimized buffer is not at least MIN_BYTES_SAVED smaller.
 *
 * The script prints a compact summary including total savings.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_ROOT = path.resolve(__dirname, "../public/assets");
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 72;
const MIN_BYTES_SAVED = 1024; // Only overwrite if we save at least 1KB.
const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".JPG", ".JPEG"]);

async function collectImages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectImages(entryPath);
      }
      return entryPath;
    })
  );
  return files.flat();
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const idx = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, idx)).toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
}

async function optimizeImage(filePath) {
  const ext = path.extname(filePath);
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    return null;
  }

  const stats = await fs.stat(filePath);
  const originalSize = stats.size;

  let metadata;
  try {
    metadata = await sharp(filePath).metadata();
  } catch (error) {
    console.error(`Skipping ${filePath}: could not read metadata`, error);
    return null;
  }

  let pipeline = sharp(filePath).rotate();

  if (metadata.width && metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize({
      width: MAX_WIDTH,
      withoutEnlargement: true,
    });
  }

  const tempPath = `${filePath}.tmp`;

  await pipeline
    .jpeg({
      quality: JPEG_QUALITY,
      progressive: true,
      mozjpeg: true,
      chromaSubsampling: "4:2:0",
    })
    .toFile(tempPath);

  const optimizedStats = await fs.stat(tempPath);
  const optimizedSize = optimizedStats.size;
  const savedBytes = originalSize - optimizedSize;

  if (savedBytes < MIN_BYTES_SAVED) {
    await fs.rm(tempPath, { force: true });
    return {
      filePath,
      originalSize,
      optimizedSize: originalSize,
      savedBytes: 0,
      skipped: true,
    };
  }

  await fs.rm(filePath, { force: true });
  await fs.rename(tempPath, filePath);

  return {
    filePath,
    originalSize,
    optimizedSize,
    savedBytes,
    skipped: false,
  };
}

async function main() {
  console.log("📦 Optimizing images under", ASSETS_ROOT);

  let files;
  try {
    files = await collectImages(ASSETS_ROOT);
  } catch (error) {
    console.error("Could not read assets directory:", error);
    process.exitCode = 1;
    return;
  }

  const results = [];
  for (const file of files) {
    if (!SUPPORTED_EXTENSIONS.has(path.extname(file))) continue;
    // eslint-disable-next-line no-await-in-loop
    const result = await optimizeImage(file);
    if (result) {
      results.push(result);
    }
  }

  if (results.length === 0) {
    console.log("No JPEG images found. Nothing to do.");
    return;
  }

  let totalSavings = 0;
  let optimizedCount = 0;
  for (const result of results) {
    if (!result.skipped) {
      totalSavings += result.savedBytes;
      optimizedCount += 1;
      console.log(
        `✔ ${path.relative(ASSETS_ROOT, result.filePath)}: ${formatBytes(result.originalSize)} → ${formatBytes(
          result.optimizedSize
        )} (saved ${formatBytes(result.savedBytes)})`
      );
    } else {
      console.log(
        `⚪ ${path.relative(ASSETS_ROOT, result.filePath)}: skipped (savings < ${formatBytes(MIN_BYTES_SAVED)})`
      );
    }
  }

  console.log(`\nOptimized ${optimizedCount} image(s). Total savings: ${formatBytes(totalSavings)}.`);
}

main().catch((error) => {
  console.error("Unexpected error during optimization:", error);
  process.exitCode = 1;
});
