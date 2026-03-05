import fs from "fs/promises";

async function main() {
  const files = await fs.readdir("dataset/demo_calls/extracted");

  let combined = "";

  for (const file of files) {
    const content = await fs.readFile(
      `dataset/demo_calls/extracted/${file}`,
      "utf8",
    );

    combined += "\n" + content;
  }

  await fs.writeFile("dataset/demo_calls/merged_summary.txt", combined);

  console.log("Merged summary created");
}

main();
