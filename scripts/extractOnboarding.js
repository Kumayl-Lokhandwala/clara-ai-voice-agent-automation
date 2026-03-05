import fs from "fs/promises";
import axios from "axios";

async function extractInfo(chunk) {
  const prompt = `
Extract ONLY operational information and rules about the contractor's business. 
We are looking for exact configurations, updates, or clarifications.

Ignore:
- Clara product explanations
- Introductions or small talk
- Pricing

Return bullet points under these headings:
- Business Hours & Timezone
- Emergency Definitions & Routing Rules
- Non-Emergency Routing Rules
- Call Transfer Rules & Fallbacks
- Integration Constraints
- General Notes

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
        num_predict: 2048,
      },
    },
  );

  return response.data.response;
}

async function main() {
  const files = (await fs.readdir("dataset/onboarding_calls")).filter((file) =>
    file.startsWith("chunk_"),
  );

  await fs.mkdir("dataset/onboarding_calls/extracted", { recursive: true });

  for (const file of files) {
    const chunk = await fs.readFile(`dataset/onboarding_calls/${file}`, "utf8");
    console.log("Processing", file);

    const result = await extractInfo(chunk);
    await fs.writeFile(`dataset/onboarding_calls/extracted/${file}`, result);
  }

  console.log("Onboarding extraction complete");
}

main();
