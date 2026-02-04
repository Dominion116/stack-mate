import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();

describe("Stack Mate Contract", () => {
  it("ensures simnet is well initialized", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("can create a new game", () => {
    const wallet1 = accounts.get("wallet_1")!;
    
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "new-game",
      [1], // difficulty: EASY
      wallet1
    );
    expect(result).toBeOk(1); // Returns game-id 1
  });

  it("retrieves game state", () => {
    const wallet1 = accounts.get("wallet_1")!;
    
    // Create a game first
    simnet.callPublicFn(
      "stack-mate",
      "new-game",
      [1],
      wallet1
    );

    // Get game state
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-game",
      [1],
      wallet1
    );
    
    expect(result).toBeSome();
  });

  it("rejects invalid difficulty level", () => {
    const wallet1 = accounts.get("wallet_1")!;
    
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "new-game",
      [99], // Invalid difficulty
      wallet1
    );
    expect(result).toBeErr(106); // err-invalid-difficulty
  });

  it("allows player to make a valid move", () => {
    const wallet1 = accounts.get("wallet_1")!;
    
    // Create a game
    simnet.callPublicFn(
      "stack-mate",
      "new-game",
      [1],
      wallet1
    );

    // Make a move: e2 to e4 (pawn move)
    // Position encoding: row * 8 + col (0-indexed)
    // e2 = (6 * 8) + 4 = 52
    // e4 = (4 * 8) + 4 = 36
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [1, 52, 36],
      wallet1
    );
    
    expect(result).toBeOk(true);
  });
});
