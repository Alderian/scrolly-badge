import scrollBadgeLevelsScrollyABI from "./abi/ScrollBadgeLevelsScrolly.json" assert { type: "json" };
import { normalizeAddress } from "./lib.js";
import "dotenv/config.js";
import { ethers } from "ethers";
import fs from "fs";

export const badges = {};

const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT);

badges[normalizeAddress(process.env.SIMPLE_BADGE_CONTRACT_ADDRESS)] = {
  name: "Scrolly Badge",
  address: normalizeAddress(process.env.SIMPLE_BADGE_CONTRACT_ADDRESS),
  proxy: normalizeAddress(process.env.SIMPLE_BADGE_ATTESTER_PROXY_CONTRACT_ADDRESS),
  isEligible: async (recipient) => {
    let isEligible = false;
    try {
      const scrollBadgeLevelsScrollyContract = new ethers.Contract(
        process.env.SIMPLE_BADGE_CONTRACT_ADDRESS,
        scrollBadgeLevelsScrollyABI.abi,
        provider
      );
      isEligible = await scrollBadgeLevelsScrollyContract.isEligible(recipient);
    } catch (error) {
      console.log("There was an error checking eligibility for", recipient);
    }
    return isEligible === true || isEligible === "true";
  },
  createPayload: async (/*recipient*/) => "0x",
};

const read = (_filename) => {
  const filename = "./src/" + _filename;
  let badgeData = [];
  if (fs.existsSync(filename)) {
    badgeData = JSON.parse(fs.readFileSync(filename, "utf-8"));
  }
  return badgeData;
};

export const badgeJsons = read("./badges-data.json");
