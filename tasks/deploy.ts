import { HardhatUserConfig, task, subtask } from "hardhat/config";
import fs from "fs";
import { DeployLocal } from "../scripts/types/deploy";

task("deploy", "deploy contracts")
  .addPositionalParam("type", "deploy type", "deploy")
  .setAction(async ({ type }, hre) => {
    await hre.run("compile");

    const _type = type || "deploy";

    const networkName = hre.network.name;
    const networkPath = `${__dirname}/../networks/${networkName}`;
    const path = `${__dirname}/../scripts/${_type}/${networkName}`;
    const files = fs.readdirSync(path);

    const data = fs.readFileSync(`${networkPath}.json`);
    let deployed: DeployLocal = JSON.parse(data.toString());

    for (const file of files) {
      if (fs.statSync(`${path}/${file}`).isDirectory()) continue;
      console.log(`Deploy ${file}`);
      const { default: deploy } = await import(`${path}/${file}`);
      try {
        const result = await deploy({ deployed });
        deployed = {
          ...deployed,
          ...result
        }
        // await save(result);
      } catch (e: any) {
        console.error(e);
        process.exitCode = 1;
      }
    }
    console.log("deployed", deployed);
    fs.writeFileSync(`${networkPath}.json`, JSON.stringify(deployed, null, "\t"));
  });