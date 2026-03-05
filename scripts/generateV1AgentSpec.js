import fs from "fs/promises";
import axios from "axios";
import path from "path";

async function generateV1AgentSpec() {
  const accountId = "account_001";

  // 1. Read the v1 memo you already successfully generated
  const memoPath = path.join(
    "outputs",
    "accounts",
    accountId,
    "v1",
    "memo.json",
  );
  const memoContent = await fs.readFile(memoPath, "utf8");

  // 2. Instruct Llama to build the Agent Spec using the "Fill-in-the-blanks" method
  const prompt = `
Task: Create a Retell AI Voice Agent Configuration (v1).

Read the Account Memo JSON below and fill out the required Agent Spec JSON.

CRITICAL ASSIGNMENT RULES:
1. The system prompt MUST include a "Business hours flow" (Greeting, purpose, collect name/number, route/transfer, fallback, close).
2. The system prompt MUST include an "After hours flow" (Greeting, purpose, confirm emergency, collect address, attempt transfer, fallback, close).
3. DO NOT mention "function calls" to the caller.
4. Set version to "v1".
5. Output the FULL JSON. DO NOT return an empty object {}.

Account Memo JSON:
${memoContent}

OUTPUT EXACTLY THIS JSON STRUCTURE (Fill in the blanks):
{
  "agent_name": "Clara Answers - Trades",
  "voice_style": "Professional, helpful, and concise",
  "system_prompt": "...",
  "key_variables": ["timezone", "business_hours", "address", "emergency_routing"],
  "tool_invocation_placeholders": ["transfer_call_tool", "check_business_hours_tool"],
  "call_transfer_protocol": "Attempt to transfer. If no answer, take a message.",
  "fallback_protocol": "If transfer fails, apologize, collect name and number, and assure quick follow-up.",
  "version": "v1"
}
`;

  try {
    console.log("Generating v1 Agent Spec...");
    const response = await axios.post(
      "http://host.docker.internal:11434/api/generate",
      {
        model: "llama3.2",
        prompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0.2, // Slightly higher so the system_prompt sounds natural
          num_predict: 2048,
        },
      },
    );

    const specString = response.data.response;

    console.log("--- RAW LLM RESPONSE ---");
    console.log(specString);
    console.log("------------------------");

    const spec = JSON.parse(specString);

    // 3. Save the v1 Spec
    const outputDir = path.join("outputs", "accounts", accountId, "v1");
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(
      path.join(outputDir, "agent_spec.json"),
      JSON.stringify(spec, null, 2),
    );

    console.log(
      "Success! agent_spec.json (v1) generated successfully in",
      outputDir,
    );
  } catch (error) {
    console.error("Error generating v1 agent spec:", error.message);
  }
}

generateV1AgentSpec();
