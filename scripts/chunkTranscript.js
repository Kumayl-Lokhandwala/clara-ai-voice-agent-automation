import fs from "fs/promises";

const CHUNK_SIZE = 6000;

function splitText(text, size) {
  const chunks = [];
  let index = 0;

  while (index < text.length) {
    chunks.push(text.slice(index, index + size));
    index += size;
  }

  return chunks;
}

async function main() {
  const transcript = await fs.readFile("dataset/demo_calls/demo_1.txt", "utf8");

  const chunks = splitText(transcript, CHUNK_SIZE);

  for (let i = 0; i < chunks.length; i++) {
    await fs.writeFile(`dataset/demo_calls/chunk_${i + 1}.txt`, chunks[i]);
  }

  console.log("Chunks created:", chunks.length);
}

main();
