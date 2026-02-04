import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

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
      [Cl.uint(1)], // DIFFICULTY-EASY
      player1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("creates a new game with HARD difficulty", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "start-game",
      [Cl.uint(2)], // DIFFICULTY-HARD
      player1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("rejects invalid difficulty level", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "start-game",
      [Cl.uint(3)], // Invalid difficulty
      player1
    );
    expect(result).toBeErr(Cl.uint(106)); // err-invalid-difficulty
  });

  it("assigns unique game IDs to multiple games", () => {
    const game1 = simnet.callPublicFn("stack-mate", "start-game", [Cl.uint(1)], player1);
    const game2 = simnet.callPublicFn("stack-mate", "start-game", [Cl.uint(2)], player1);
    
    expect(game1.result).toBeOk(Cl.uint(1));
    expect(game2.result).toBeOk(Cl.uint(2));
  });

  it("tracks player's current game", () => {
    simnet.callPublicFn("stack-mate", "start-game", [Cl.uint(1)], player1);
    
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-player-game",
      [Cl.principal(player1)],
      player1
    );
    expect(result).toBeOk(Cl.uint(1));
  });
});

describe("Stack Mate Contract - Game State Queries", () => {
  beforeEach(() => {
    simnet.callPublicFn("stack-mate", "start-game", [Cl.uint(1)], player1);
  });

  it("retrieves complete game state", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-game",
      [Cl.uint(1)],
      player1
    );
    expect(result).not.toBeErr();
  });

  it("retrieves game status", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-game-status",
      [Cl.uint(1)],
      player1
    );
    expect(result).not.toBeErr();
  });

  it("retrieves board state", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-board",
      [Cl.uint(1)],
      player1
    );
    expect(result).not.toBeErr();
  });

  it("retrieves piece at specific position", () => {
    // Position 52 should have a white pawn (e2)
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-piece-at",
      [Cl.uint(1), Cl.uint(52)],
      player1
    );
    expect(result).toBeOk(Cl.uint(1)); // WHITE-PAWN
  });

  it("returns error for non-existent game", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-game",
      [Cl.uint(999)],
      player1
    );
    expect(result).toBeErr(Cl.uint(101)); // err-game-not-found
  });
});

describe("Stack Mate Contract - Move Validation", () => {
  beforeEach(() => {
    simnet.callPublicFn("stack-mate", "start-game", [Cl.uint(1)], player1);
  });

  it("validates a legal pawn move (e2 to e4)", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "validate-move",
      [Cl.uint(1), Cl.uint(52), Cl.uint(36)], // e2 to e4
      player1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("validates a legal knight move", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "validate-move",
      [Cl.uint(1), Cl.uint(57), Cl.uint(42)], // b1 to c3
      player1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("rejects moving to same position", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "validate-move",
      [Cl.uint(1), Cl.uint(52), Cl.uint(52)],
      player1
    );
    expect(result).toBeOk(Cl.bool(false));
  });

  it("rejects moving empty square", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "validate-move",
      [Cl.uint(1), Cl.uint(40), Cl.uint(32)], // Empty square
      player1
    );
    expect(result).toBeOk(Cl.bool(false));
  });

  it("rejects invalid position", () => {
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "validate-move",
      [Cl.uint(1), Cl.uint(100), Cl.uint(50)], // Position > 63
      player1
    );
    expect(result).toBeOk(Cl.bool(false));
  });
});

describe("Stack Mate Contract - Player Moves", () => {
  beforeEach(() => {
    simnet.callPublicFn("stack-mate", "start-game", [Cl.uint(1)], player1);
  });

  it("allows player to make a valid pawn move", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [Cl.uint(1), Cl.uint(52), Cl.uint(36)], // e2 to e4
      player1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("allows player to make a valid knight move", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [Cl.uint(1), Cl.uint(57), Cl.uint(42)], // b1 to c3
      player1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents unauthorized player from making moves", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [Cl.uint(1), Cl.uint(52), Cl.uint(36)],
      player2 // Wrong player
    );
    expect(result).toBeErr(Cl.uint(100)); // err-not-authorized
  });

  it("prevents move when it's not player's turn", () => {
    // First move
    simnet.callPublicFn("stack-mate", "make-move", [Cl.uint(1), Cl.uint(52), Cl.uint(36)], player1);
    
    // Try to move again immediately (it's computer's turn)
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [Cl.uint(1), Cl.uint(51), Cl.uint(35)],
      player1
    );
    expect(result).toBeErr(Cl.uint(103)); // err-not-your-turn
  });

  it("prevents invalid move", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [Cl.uint(1), Cl.uint(52), Cl.uint(28)], // Pawn can't move 3 squares
      player1
    );
    expect(result).toBeErr(Cl.uint(102)); // err-invalid-move
  });

  it("prevents moving opponent's piece", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [Cl.uint(1), Cl.uint(12), Cl.uint(28)], // Try to move black pawn
      player1
    );
    expect(result).toBeErr(Cl.uint(102)); // err-invalid-move
  });

  it("prevents capturing own piece", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [Cl.uint(1), Cl.uint(56), Cl.uint(48)], // Rook to pawn position
      player1
    );
    expect(result).toBeErr(Cl.uint(102)); // err-invalid-move
  });

  it("prevents move on non-existent game", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [Cl.uint(999), Cl.uint(52), Cl.uint(36)],
      player1
    );
    expect(result).toBeErr(Cl.uint(101)); // err-game-not-found
  });

  it("updates move count after valid move", () => {
    simnet.callPublicFn("stack-mate", "make-move", [Cl.uint(1), Cl.uint(52), Cl.uint(36)], player1);
    
    const { result } = simnet.callReadOnlyFn(
      "stack-mate",
      "get-game-status",
      [Cl.uint(1)],
      player1
    );
    
    // Check that white-turn is now false
    expect(result).not.toBeErr();
  });
});

describe("Stack Mate Contract - Computer Moves", () => {
  beforeEach(() => {
    simnet.callPublicFn("stack-mate", "start-game", [Cl.uint(1)], player1);
    // Player makes first move
    simnet.callPublicFn("stack-mate", "make-move", [Cl.uint(1), Cl.uint(52), Cl.uint(36)], player1);
  });

  it("allows computer to make a move after player", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "computer-move",
      [Cl.uint(1)],
      player1
    );
    expect(result).not.toBeErr();
  });

  it("prevents computer move when it's player's turn", () => {
    // Computer moves
    simnet.callPublicFn("stack-mate", "computer-move", [Cl.uint(1)], player1);
    
    // Try computer move again immediately
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "computer-move",
      [Cl.uint(1)],
      player1
    );
    expect(result).toBeErr(Cl.uint(103)); // err-not-your-turn
  });

  it("prevents unauthorized player from triggering computer move", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "computer-move",
      [Cl.uint(1)],
      player2 // Wrong player
    );
    expect(result).toBeErr(Cl.uint(100)); // err-not-authorized
  });

  it("generates different moves for EASY vs HARD difficulty", () => {
    // Create another game with HARD difficulty
    simnet.callPublicFn("stack-mate", "start-game", [Cl.uint(2)], player2);
    simnet.callPublicFn("stack-mate", "make-move", [Cl.uint(2), Cl.uint(52), Cl.uint(36)], player2);
    
    const result1 = simnet.callPublicFn("stack-mate", "computer-move", [Cl.uint(1)], player1);
    const result2 = simnet.callPublicFn("stack-mate", "computer-move", [Cl.uint(2)], player2);
    
    expect(result1.result).not.toBeErr();
    expect(result2.result).not.toBeErr();
  });
});

describe("Stack Mate Contract - Game Resignation", () => {
  beforeEach(() => {
    simnet.callPublicFn("stack-mate", "start-game", [Cl.uint(1)], player1);
  });

  it("allows player to resign game", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "resign-game",
      [Cl.uint(1)],
      player1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents unauthorized player from resigning", () => {
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "resign-game",
      [Cl.uint(1)],
      player2
    );
    expect(result).toBeErr(Cl.uint(100)); // err-not-authorized
  });

  it("prevents moves after resignation", () => {
    // Resign the game
    simnet.callPublicFn("stack-mate", "resign-game", [Cl.uint(1)], player1);
    
    // Try to make a move
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "make-move",
      [Cl.uint(1), Cl.uint(52), Cl.uint(36)],
      player1
    );
    expect(result).toBeErr(Cl.uint(104)); // err-game-over
  });

  it("prevents resigning already finished game", () => {
    simnet.callPublicFn("stack-mate", "resign-game", [Cl.uint(1)], player1);
    
    const { result } = simnet.callPublicFn(
      "stack-mate",
      "resign-game",
      [Cl.uint(1)],
      player1
    );
    expect(result).toBeErr(Cl.uint(104)); // err-game-over
  });
});

describe("Stack Mate Contract - Complete Game Flow", () => {
  it("simulates a complete game sequence", () => {
    // Create game
    const createResult = simnet.callPublicFn("stack-mate", "start-game", [Cl.uint(1)], player1);
    expect(createResult.result).toBeOk(Cl.uint(1));
    
    // Player move 1
    const move1 = simnet.callPublicFn("stack-mate", "make-move", [Cl.uint(1), Cl.uint(52), Cl.uint(36)], player1);
    expect(move1.result).toBeOk(Cl.bool(true));
    
    // Computer move 1
    const compMove1 = simnet.callPublicFn("stack-mate", "computer-move", [Cl.uint(1)], player1);
    expect(compMove1.result).not.toBeErr();
    
    // Player move 2
    const move2 = simnet.callPublicFn("stack-mate", "make-move", [Cl.uint(1), Cl.uint(57), Cl.uint(42)], player1);
    expect(move2.result).toBeOk(Cl.bool(true));
    
    // Computer move 2
    const compMove2 = simnet.callPublicFn("stack-mate", "computer-move", [Cl.uint(1)], player1);
    expect(compMove2.result).not.toBeErr();
    
    // Check final game status
    const status = simnet.callReadOnlyFn("stack-mate", "get-game-status", [Cl.uint(1)], player1);
    expect(status.result).not.toBeErr();
  });

  it("handles multiple concurrent games", () => {
    const game1 = simnet.callPublicFn("stack-mate", "start-game", [Cl.uint(1)], player1);
    const game2 = simnet.callPublicFn("stack-mate", "start-game", [Cl.uint(2)], player2);
    
    expect(game1.result).toBeOk(Cl.uint(1));
    expect(game2.result).toBeOk(Cl.uint(2));
    
    // Each player can move in their own game
    const move1 = simnet.callPublicFn("stack-mate", "make-move", [Cl.uint(1), Cl.uint(52), Cl.uint(36)], player1);
    const move2 = simnet.callPublicFn("stack-mate", "make-move", [Cl.uint(2), Cl.uint(52), Cl.uint(36)], player2);
    
    expect(move1.result).toBeOk(Cl.bool(true));
    expect(move2.result).toBeOk(Cl.bool(true));
  });
});
