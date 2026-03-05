import fs from "fs/promises";
import axios from "axios";
import path from "path";

async function generateMemo(summary) {
  const prompt = `
You are an expert data extractor. Read the provided notes about a contractor business and populate the JSON schema.

RULES:
1. Extract all services mentioned in the notes (e.g., electrical work, EV chargers, hot tub installations) and put them in the "services_supported" array.
2. Extract any team structure, workflow, or company info and put it into the relevant fields or the "notes" field.
3. If specific operational rules like "business_hours", "emergency_routing_rules", or "call_transfer_rules" are completely missing from the text, leave those fields blank and list them in the "questions_or_unknowns" array.
4. Output ONLY valid JSON. Do not add any extra text.

Schema:
{
  "account_id": "",
  "company_name": "",
  "business_hours": {
    "days": "",
    "start": "",
    "end": "",
    "timezone": ""
  },
  "office_address": "",
  "services_supported": [],
  "emergency_definition": [],
  "emergency_routing_rules": "",
  "non_emergency_routing_rules": "",
  "call_transfer_rules": "",
  "integration_constraints": "",
  "after_hours_flow_summary": "",
  "office_hours_flow_summary": "",
  "questions_or_unknowns": [],
  "notes": ""
}

Notes:
${summary}
`;

  const response = await axios.post(
    "http://host.docker.internal:11434/api/generate",
    {
      model: "llama3.2",
      prompt,
      stream: false,
      format: "json", // Forces Ollama to return strictly structured JSON
      options: {
        temperature: 0,
        num_predict: 2048,
      },
    },
  );

  return response.data.response;
}

async function main() {
  const summary = await fs.readFile(
    "dataset/demo_calls/merged_summary.txt",
    "utf8",
  );
  const memoString = await generateMemo(summary);
  const memo = JSON.parse(memoString);

  // You can dynamically assign this later based on the file name
  memo.account_id = "account_001";

  const outputDir = path.join("outputs", "accounts", memo.account_id, "v1");
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(`${outputDir}/memo.json`, JSON.stringify(memo, null, 2));

  console.log("v1 memo.json generated successfully");
}

main();
