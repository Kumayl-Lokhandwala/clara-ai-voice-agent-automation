import { execSync } from "child_process";

const pipelineType = process.argv[2]; // Accepts 'A' or 'B'

if (!pipelineType || (pipelineType !== "A" && pipelineType !== "B")) {
  console.error(
    "Error: Please specify pipeline type 'A' or 'B' (e.g., node scripts/runBatch.js A)",
  );
  process.exit(1);
}

console.log(`--- Starting Pipeline ${pipelineType} Batch Processing ---`);

for (let i = 1; i <= 5; i++) {
  const accountId = `account_00${i}`;
  const fileId = i; // Used to pick demo_1.txt, demo_2.txt, etc.

  console.log(`\n[${i}/5] Processing ${accountId}...`);

  try {
    if (pipelineType === "A") {
      // Sequence for Pipeline A (Demo to V1)
      // We pass fileId to chunking and accountId to memo/spec generation
      execSync(`node scripts/chunkTranscript.js ${fileId}`, {
        stdio: "inherit",
      });
      execSync(`node scripts/extractChunks.js`, { stdio: "inherit" });
      execSync(`node scripts/mergeChunks.js`, { stdio: "inherit" });
      execSync(`node scripts/generateMemo.js ${accountId}`, {
        stdio: "inherit",
      });
      execSync(`node scripts/generateV1AgentSpec.js ${accountId}`, {
        stdio: "inherit",
      });
    } else {
      // Sequence for Pipeline B (Onboarding to V2)
      execSync(`node scripts/chunkOnboarding.js ${fileId}`, {
        stdio: "inherit",
      });
      execSync(`node scripts/extractOnboarding.js`, { stdio: "inherit" });
      execSync(`node scripts/mergeOnboarding.js`, { stdio: "inherit" });
      execSync(`node scripts/updateToV2.js ${accountId}`, { stdio: "inherit" });
      execSync(`node scripts/generateV2AgentSpec.js ${accountId}`, {
        stdio: "inherit",
      });
    }
  } catch (error) {
    console.error(`Failed at ${accountId}:`, error.message);
    // Continue to next account even if one fails
  }
}

console.log(`\n--- Pipeline ${pipelineType} Batch Complete ---`);
