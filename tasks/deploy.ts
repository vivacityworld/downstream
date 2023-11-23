import { HardhatUserConfig, task, subtask } from "hardhat/config";
import fs from "fs";
import { DeployLocal } from "../scripts/types/deploy";

task("deploy", "deploy contracts")
  .addPositionalParam("type", "deploy type", "")
  .setAction(async ({ type }, hre) => {
    await hre.run("compile");
    console.log("type", type);
    const names = type ? type.split(",") : [];
    console.log("deploy", names);


    const networkName = hre.network.name;
    const networkPath = `${__dirname}/../networks/${networkName}`;
    const path = `${__dirname}/../scripts/deploy/${networkName}`;
    const files = fs.readdirSync(path);

    const data = fs.readFileSync(`${networkPath}.json`);
    let deployed: DeployLocal = JSON.parse(data.toString());

    for (const file of files) {
      if (fs.statSync(`${path}/${file}`).isDirectory()) continue;
      if (names?.length > 0) {
        if (!includes(names, file)) {
          continue;
        }
      }
      console.log(`Deploy ${file}`);
      const { default: deploy } = await import(`${path}/${file}`);
      try {
        const result = await deploy({ deployed });
        deployed = {
          ...deployed,
          ...result
        }
      } catch (e: any) {
        console.error(e);
        fs.writeFileSync(`${networkPath}.json`, JSON.stringify(deployed, null, "\t"));
        return process.exitCode = 1;
      }
    }
    console.log("deployed", deployed);
    fs.writeFileSync(`${networkPath}.json`, JSON.stringify(deployed, null, "\t"));
  });

function includes(types: string[], name: string) {

  for (let i = 0; i < types.length; i++) {
    if (name.includes(types[i])) {
      return true;
    }
  }
  return false;
}