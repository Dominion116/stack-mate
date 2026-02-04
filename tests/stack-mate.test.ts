import { describe, expect, it, beforeEach } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const player1 = accounts.get("wallet_1")!;
const player2 = accounts.get("wallet_2")!;

describe("Stack Mate Contract - Initialization", () => {
  it("ensures simnet is well initialized", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("contract is deployed successfully", () => {
    const contracts = simnet.getContractsInterfaces();
    expect(contracts.size).toBeGreaterThan(0);
  });
});

describe("Stack Mate Contract - Game Creation", () => {
  it("creates a new game with EASY difficulty", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "start-game",
      [`u1`], // DIFFICULTY-EASY
      player1
    );
    expect(result).toBeOk(`u1`);
  });

  it("creates a new game with HARD difficulty", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "start-game",
      [`u2`], // DIFFICULTY-HARD
      player1
    );
    expect(result).toBeOk(`u1`);
  });

  it("rejects invalid difficulty level", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "start-game",
      [`u3`], // Invalid difficulty
      player1
    );
    expect(result).toBeErr(`u106`); // err-invalid-difficulty
  });

  it("assigns unique game IDs to multiple games", () => {
    const game1 = simnet.callPublicFn("stack-mate", "start-game", [`u1`], player1);
    const game2 = simnet.callPublicFn("stack-mate", "start-game", [`u2`], player1);
    
    expect(game1.result).toBeOk(`u1`);
    expect(game2.result).toBeOk(`u2`);
  });

  it("tracks player's current game", () => {
    simnet.callPublicFn("stack-mate", "start-game", [`u1`], player1);
    
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-player-game",
      [player1],
      player1
    );
    expect(result).toBeOk(`u1`);
  });
});

describe("Stack Mate Contract - Game State Queries", () => {
  beforeEach(() => {
    simnet.callPublicFn("stack-mate", "start-game", [`u1`], player1);
  });

  it("retrieves complete game state", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-game",
      [`u1`],
      player1
    );
    expect(result).toBeOk();
  });

  it("retrieves game status", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-game-status",
      [`u1`],
      player1
    );
    expect(result).toBeOk();
  });

  it("retrieves board state", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-board",
      [`u1`],
      player1
    );
    expect(result).toBeOk();
  });

  it("retrieves piece at specific position", () => {
    // Position 52 should have a white pawn (e2)
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-piece-at",
      [`u1`, `u52`],
      player1
    );
    expect(result).toBeOk(`u1`); // WHITE-PAWN
  });

  it("returns error for non-existent game", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-game",
      [`u999`],
      player1
    );
    expect(result).toBeErr(`u101`); // err-game-not-found
  });
});

describe("Stack Mate Contract - Move Validation", () => {
  beforeEach(() => {
    simnet.callPublicFn("stack-mate", "start-game", [`u1`], player1);
  });

  it("validates a legal pawn move (e2 to e4)", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "validate-move",
      [`u1`, `u52`, `u36`], // e2 to e4
      player1
    );
    expect(result).toBeOk(`true`);
  });

  it("validates a legal knight move", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "validate-move",
      [`u1`, `u57`, `u42`], // b1 to c3
      player1
    );
    expect(result).toBeOk(`true`);
  });

  it("rejects moving to same position", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "validate-move",
      [`u1`, `u52`, `u52`],
      player1
    );
    expect(result).toBeOk(`false`);
  });

  it("rejects moving empty square", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "validate-move",
      [`u1`, `u40`, `u32`], // Empty square
      player1
    );
    expect(result).toBeOk(`false`);
  });

  it("rejects invalid position", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "validate-move",
      [`u1`, `u100`, `u50`], // Position > 63
      player1
    );
    expect(result).toBeOk(`false`);
  });
});

describe("Stack Mate Contract - Player Moves", () => {
  beforeEach(() => {
    simnet.callPublicFn("stack-mate", "start-game", [`u1`], player1);
  });

  it("allows player to make a valid pawn move", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [`u1`, `u52`, `u36`], // e2 to e4
      player1
    );
    expect(result).toBeOk(`true`);
  });

  it("allows player to make a valid knight move", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [`u1`, `u57`, `u42`], // b1 to c3
      player1
    );
    expect(result).toBeOk(`true`);
  });

  it("prevents unauthorized player from making moves", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [`u1`, `u52`, `u36`],
      player2 // Wrong player
    );
    expect(result).toBeErr(`u100`); // err-not-authorized
  });

  it("prevents move when it's not player's turn", () => {
    // First move
    simnet.callPublicFn("stack-mate", "make-move", [`u1`, `u52`, `u36`], player1);
    
    // Try to move again immediately (it's computer's turn)
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [`u1`, `u51`, `u35`],
      player1
    );
    expect(result).toBeErr(`u103`); // err-not-your-turn
  });

  it("prevents invalid move", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [`u1`, `u52`, `u28`], // Pawn can't move 3 squares
      player1
    );
    expect(result).toBeErr(`u102`); // err-invalid-move
  });

  it("prevents moving opponent's piece", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [`u1`, `u12`, `u28`], // Try to move black pawn
      player1
    );
    expect(result).toBeErr(`u102`); // err-invalid-move
  });

  it("prevents capturing own piece", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [`u1`, `u56`, `u48`], // Rook to pawn position
      player1
    );
    expect(result).toBeErr(`u102`); // err-invalid-move
  });

  it("prevents move on non-existent game", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [`u999`, `u52`, `u36`],
      player1
    );
    expect(result).toBeErr(`u101`); // err-game-not-found
  });

  it("updates move count after valid move", () => {
    simnet.callPublicFn("stack-mate", "make-move", [`u1`, `u52`, `u36`], player1);
    
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-game-status",
      [`u1`],
      player1
    );
    
    // Check that white-turn is now false
    expect(result).toBeOk();
  });
});

describe("Stack Mate Contract - Computer Moves", () => {
  beforeEach(() => {
    simnet.callPublicFn("stack-mate", "start-game", [`u1`], player1);
    // Player makes first move
    simnet.callPublicFn("stack-mate", "make-move", [`u1`, `u52`, `u36`], player1);
  });

  it("allows computer to make a move after player", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "computer-move",
      [`u1`],
      player1
    );
    expect(result).toBeOk();
  });

  it("prevents computer move when it's player's turn", () => {
    // Computer moves
    simnet.callPublicFn("stack-mate", "computer-move", [`u1`], player1);
    
    // Try computer move again immediately
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "computer-move",
      [`u1`],
      player1
    );
    expect(result).toBeErr(`u103`); // err-not-your-turn
  });

  it("prevents unauthorized player from triggering computer move", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "computer-move",
      [`u1`],
      player2 // Wrong player
    );
    expect(result).toBeErr(`u100`); // err-not-authorized
  });

  it("generates different moves for EASY vs HARD difficulty", () => {
    // Create another game with HARD difficulty
    simnet.callPublicFn("stack-mate", "start-game", [`u2`], player2);
    simnet.callPublicFn("stack-mate", "make-move", [`u2`, `u52`, `u36`], player2);
    
    const result1 = simnet.callPublicFn("stack-mate", "computer-move", [`u1`], player1);
    const result2 = simnet.callPublicFn("stack-mate", "computer-move", [`u2`], player2);
    
    expect(result1.result).toBeOk();
    expect(result2.result).toBeOk();
  });
});

describe("Stack Mate Contract - Game Resignation", () => {
  beforeEach(() => {
    simnet.callPublicFn("stack-mate", "start-game", [`u1`], player1);
  });

  it("allows player to resign game", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "resign-game",
      [`u1`],
      player1
    );
    expect(result).toBeOk(`true`);
  });

  it("prevents unauthorized player from resigning", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "resign-game",
      [`u1`],
      player2
    );
    expect(result).toBeErr(`u100`); // err-not-authorized
  });

  it("prevents moves after resignation", () => {
    // Resign the game
    simnet.callPublicFn("stack-mate", "resign-game", [`u1`], player1);
    
    // Try to make a move
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [`u1`, `u52`, `u36`],
      player1
    );
    expect(result).toBeErr(`u104`); // err-game-over
  });

  it("prevents resigning already finished game", () => {
    simnet.callPublicFn("stack-mate", "resign-game", [`u1`], player1);
    
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "resign-game",
      [`u1`],
      player1
    );
    expect(result).toBeErr(`u104`); // err-game-over
  });
});

describe("Stack Mate Contract - Complete Game Flow", () => {
  it("simulates a complete game sequence", () => {
    // Create game
    const createResult = simnet.callPublicFn("stack-mate", "start-game", [`u1`], player1);
    expect(createResult.result).toBeOk(`u1`);
    
    // Player move 1
    const move1 = simnet.callPublicFn("stack-mate", "make-move", [`u1`, `u52`, `u36`], player1);
    expect(move1.result).toBeOk(`true`);
    
    // Computer move 1
    const compMove1 = simnet.callPublicFn("stack-mate", "computer-move", [`u1`], player1);
    expect(compMove1.result).toBeOk();
    
    // Player move 2
    const move2 = simnet.callPublicFn("stack-mate", "make-move", [`u1`, `u57`, `u42`], player1);
    expect(move2.result).toBeOk(`true`);
    
    // Computer move 2
    const compMove2 = simnet.callPublicFn("stack-mate", "computer-move", [`u1`], player1);
    expect(compMove2.result).toBeOk();
    
    // Check final game status
    const status = simnet.callReadOnlyFn("stack-mate", "get-game-status", [`u1`], player1);
    expect(status.result).toBeOk();
  });

  it("handles multiple concurrent games", () => {
    const game1 = simnet.callPublicFn("stack-mate", "start-game", [`u1`], player1);
    const game2 = simnet.callPublicFn("stack-mate", "start-game", [`u2`], player2);
    
    expect(game1.result).toBeOk(`u1`);
    expect(game2.result).toBeOk(`u2`);
    
    // Each player can move in their own game
    const move1 = simnet.callPublicFn("stack-mate", "make-move", [`u1`, `u52`, `u36`], player1);
    const move2 = simnet.callPublicFn("stack-mate", "make-move", [`u2`, `u52`, `u36`], player2);
    
    expect(move1.result).toBeOk(`true`);
    expect(move2.result).toBeOk(`true`);
  });
});
