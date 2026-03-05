import fs from "fs/promises";
import axios from "axios";

async function extractInfo(chunk) {
  const prompt = `
Extract ONLY information about the contractor's business.

Ignore:
- Clara product explanations
- pricing discussion
- introductions

Return bullet points under these headings:

Company Information
Services Offered
Team Structure
Software / Tools Used
Current Workflow
Operational Challenges

Text:
${chunk}
`;

  const response = await axios.post(
    "http://host.docker.internal:11434/api/generate",
    {
      model: "llama3.2",
      prompt,
      stream: false,
      options: {
        temperature: 0,
      },
    },
  );

  return response.data.response;
}

async function main() {
  const files = (await fs.readdir("dataset/demo_calls")).filter((file) =>
    file.startsWith("chunk_"),
  );

  await fs.mkdir("dataset/demo_calls/extracted", { recursive: true });

  for (const file of files) {
    const chunk = await fs.readFile(`dataset/demo_calls/${file}`, "utf8");

    console.log("Processing", file);

    const result = await extractInfo(chunk);

    await fs.writeFile(`dataset/demo_calls/extracted/${file}`, result);
  }

  console.log("Extraction complete");
}

main();
