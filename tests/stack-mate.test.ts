import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("Stack Mate Contract", () => {
  it("ensures simnet is well initialized", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("contract is deployed", () => {
    const contracts = simnet.getContractsInterfaces();
    const contractId = `${deployer}.stack-mate`;
    expect(contracts.has(contractId)).toBe(true);
  });
});
