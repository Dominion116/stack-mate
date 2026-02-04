import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();

describe("Stack Mate Contract", () => {
  it("ensures simnet is well initialized", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("can create a new game", () => {
    const wallet1 = accounts.get("wallet_1")!;
    
    const response = simnet.callPublicFn(
      "stack-mate",
      "start-game",
      [simnet.types.uint(1)], // difficulty: EASY
      wallet1
    );
    expect(response.result).toBeOk(simnet.types.uint(1)); // Returns game-id 1
  });

  it("retrieves game state", () => {
    const wallet1 = accounts.get("wallet_1")!;
    
    // Create a game first
    simnet.callPublicFn(
      "stack-mate",
      "start-game",
      [simnet.types.uint(1)],
      wallet1
    );

    // Get game state
    const response = simnet.callReadOnlyFn(
      "stack-mate",
      "get-game",
      [simnet.types.uint(1)],
      wallet1
    );
    
    expect(response.result).toBeSome();
  });

  it("rejects invalid difficulty level", () => {
    const wallet1 = accounts.get("wallet_1")!;
    
    const response = simnet.callPublicFn(
      "stack-mate",
      "start-game",
      [simnet.types.uint(99)], // Invalid difficulty
      wallet1
    );
    expect(response.result).toBeErr(simnet.types.uint(106)); // err-invalid-difficulty
  });

  it("allows player to make a valid move", () => {
    const wallet1 = accounts.get("wallet_1")!;
    
    // Create a game
    simnet.callPublicFn(
      "stack-mate",
      "start-game",
      [simnet.types.uint(1)],
      wallet1
    );

    // Make a move: e2 to e4 (pawn move)
    // Position encoding: row * 8 + col (0-indexed)
    // e2 = (6 * 8) + 4 = 52
    // e4 = (4 * 8) + 4 = 36
    const response = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [simnet.types.uint(1), simnet.types.uint(52), simnet.types.uint(36)],
      wallet1
    );
    
    expect(response.result).toBeOk(simnet.types.bool(true));
  });
});
