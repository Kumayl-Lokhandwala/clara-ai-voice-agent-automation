// scripts/generateV2AgentSpec.js

import fs from "fs/promises";
import axios from "axios";
import path from "path";

async function generateV2AgentSpec() {
  const accountId = "account_001";

  // Read the v2 memo we just created
  const memoPath = path.join(
    "outputs",
    "accounts",
    accountId,
    "v2",
    "memo.json",
  );
  const memoContent = await fs.readFile(memoPath, "utf8");

  const prompt = `
You are a prompt engineer configuring a Retell AI voice agent for a contractor.
Using the provided v2 Account Memo JSON, generate the finalized Retell Agent Spec in strictly valid JSON format.

CRITICAL ASSIGNMENT RULES:
1. The system prompt MUST include a "Business hours flow" (Greeting, purpose, collect name/number, route/transfer, fallback, confirm next steps, close)[cite: 119].
2. The system prompt MUST include an "After hours flow" (Greeting, purpose, confirm emergency, collect address, attempt transfer, fallback, close)[cite: 120].
3. DO NOT mention "function calls" to the caller[cite: 122].
4. Set version to "v2"[cite: 92].

Required JSON Schema:
{
  "agent_name": "Clara Answers - Trades",
  "voice_style": "Professional, helpful, and concise",
  "system_prompt": "...",
  "key_variables": ["timezone", "business_hours", "address", "emergency_routing"],
  "tool_invocation_placeholders": ["transfer_call_tool", "check_business_hours_tool"],
  "call_transfer_protocol": "Attempt to transfer. If no answer, take a message.",
  "fallback_protocol": "If transfer fails, apologize, collect name and number, and assure quick follow-up.",
  "version": "v2"
}

Account Memo JSON:
${memoContent}
`;

  try {
    console.log("Generating v2 Agent Spec...");
    const response = await axios.post(
      "http://host.docker.internal:11434/api/generate",
      {
        model: "llama3.2",
        prompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0.2,
          num_predict: 2048,
        },
      },
    );

    const specString = response.data.response;
    const spec = JSON.parse(specString);

    const outputDir = path.join("outputs", "accounts", accountId, "v2");
    await fs.writeFile(
      path.join(outputDir, "agent_spec.json"),
      JSON.stringify(spec, null, 2),
    );

    console.log("Success! agent_spec.json (v2) generated in", outputDir);
  } catch (error) {
    console.error("Error generating agent spec:", error.message);
  }
}

generateV2AgentSpec();
