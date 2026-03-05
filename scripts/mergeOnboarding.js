import fs from "fs/promises";

async function main() {
  const files = await fs.readdir("dataset/onboarding_calls/extracted");
  let combined = "";

  for (const file of files) {
    const content = await fs.readFile(
      `dataset/onboarding_calls/extracted/${file}`,
      "utf8",
    );
    combined += "\n" + content;
  }

  await fs.writeFile(
    "dataset/onboarding_calls/merged_onboarding_summary.txt",
    combined,
  );
  console.log("Merged onboarding summary created!");
}

main();
