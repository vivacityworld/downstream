import * as dotenv from "dotenv";

import { HardhatUserConfig, task, subtask } from "hardhat/config";
import fs from "fs";

dotenv.config();

task("deploy", "deploy contracts")
  .addPositionalParam("type", "deploy type", "testnet")
  .setAction(async ({ type }) => {
    const path = `${__dirname}/../scripts/deploy/${type}`;
    const files = fs.readdirSync(path);
    let address: Record<string, string> = {};

    for (const file of files) {
      if (fs.statSync(`${path}/${file}`).isDirectory()) continue;
      console.log(`Deploy ${file}`);
      const { default: deploy } = await import(`${path}/${file}`);
      try {
        address = {
          ...address,
          ...(await deploy({ address }))
        }
      } catch (e: any) {
        console.error(e);
        process.exitCode = 1;
      }
    }
    console.log("address", address);
    fs.writeFileSync(`${path}/../${type}_address.json`, JSON.stringify(address));
  });