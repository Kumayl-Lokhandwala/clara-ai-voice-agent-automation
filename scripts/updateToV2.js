import fs from "fs/promises";
import axios from "axios";
import path from "path";

async function generateV2Memo(v1Memo, onboardingText) {
  const prompt = `
You are an operational data clerk. Your job is to fill out the JSON form below.

Read the 'Original v1 Data'. 
Read the 'New Onboarding Notes'. 
Rewrite the entire JSON form. 

RULES:
1. Keep all original data.
2. Update the fields using the New Onboarding Notes (for example, business hours, timezones, and call transfer rules).
3. If a missing field is answered by the new notes, fill it in and remove it from the "questions_or_unknowns" array.
4. DO NOT return an empty object {}. You must output the full JSON structure.

Original v1 Data:
${v1Memo}

New Onboarding Notes:
${onboardingText}

OUTPUT EXACTLY THIS JSON STRUCTURE (Fill in the blanks):
{
  "account_id": "account_001",
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
`;

  const response = await axios.post(
    "http://host.docker.internal:11434/api/generate",
    {
      model: "llama3.2",
      prompt,
      stream: false,
      format: "json",
      options: {
        temperature: 0,
        num_predict: 2048,
      },
    },
  );

  return response.data.response;
}

async function generateChangelogMarkdown(v1Memo, v2Memo, onboardingText) {
  const prompt = `
You are documenting changes for an AI voice agent configuration.
Compare the v1 JSON and v2 JSON. Look at the onboarding notes to understand the context.
Write a clear markdown changelog showing exactly what changed from v1 to v2, and briefly explain WHY based on the onboarding notes.

Format it strictly as a markdown list:
### Changes from v1 to v2
* **Field Name**: Changed from [Old Value] to [New Value]. 
  * *Reason*: [Why it changed based on the notes]
* **Resolved Unknowns**: [List any questions that were answered]

Do not include any extra conversational text.

v1 Memo:
${v1Memo}

v2 Memo:
${v2Memo}

Onboarding Notes:
${onboardingText}
`;

  const response = await axios.post(
    "http://host.docker.internal:11434/api/generate",
    {
      model: "llama3.2",
      prompt,
      stream: false,
      options: { temperature: 0.1, num_predict: 2048 },
    },
  );

  return response.data.response;
}

async function main() {
  const accountId = "account_001";

  const v1MemoPath = path.join(
    "outputs",
    "accounts",
    accountId,
    "v1",
    "memo.json",
  );
  const onboardingPath = path.join(
    "dataset",
    "onboarding_calls",
    "merged_onboarding_summary.txt",
  );
  const outputDirV2 = path.join("outputs", "accounts", accountId, "v2");
  const rootChangelogDir = path.join("changelog");

  try {
    const v1MemoString = await fs.readFile(v1MemoPath, "utf8");
    const onboardingText = await fs.readFile(onboardingPath, "utf8");

    console.log("1. Generating v2 Memo...");
    const v2MemoString = await generateV2Memo(v1MemoString, onboardingText);

    console.log("--- RAW LLM RESPONSE ---");
    console.log(v2MemoString);
    console.log("------------------------");

    const v2MemoObj = JSON.parse(v2MemoString);

    // ACTION: Immediately create directory and save the v2 memo.json
    console.log("Saving v2 memo.json...");
    await fs.mkdir(outputDirV2, { recursive: true });
    await fs.writeFile(
      path.join(outputDirV2, "memo.json"),
      JSON.stringify(v2MemoObj, null, 2),
    );

    console.log("2. Generating Markdown Changelog...");
    const changelogMarkdown = await generateChangelogMarkdown(
      v1MemoString,
      v2MemoString,
      onboardingText,
    );

    console.log("Saving changelog files...");
    await fs.writeFile(path.join(outputDirV2, "changes.md"), changelogMarkdown);

    await fs.mkdir(rootChangelogDir, { recursive: true });
    await fs.writeFile(
      path.join(rootChangelogDir, `${accountId}_changes.md`),
      changelogMarkdown,
    );

    console.log("Success! v2 memo and changes.md generated.");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
