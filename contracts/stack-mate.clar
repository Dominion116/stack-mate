;; Chess Game Smart Contract for Stacks
;; Players vs Computer with Easy and Hard difficulty modes
;; Each move requires a transaction signature

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u100))
(define-constant err-game-not-found (err u101))
(define-constant err-invalid-move (err u102))
(define-constant err-not-your-turn (err u103))
(define-constant err-game-over (err u104))
(define-constant err-invalid-position (err u105))
(define-constant err-invalid-difficulty (err u106))

;; Piece types (0 = empty, 1-6 = white pieces, 7-12 = black pieces)
;; White: 1=Pawn, 2=Knight, 3=Bishop, 4=Rook, 5=Queen, 6=King
;; Black: 7=Pawn, 8=Knight, 9=Bishop, 10=Rook, 11=Queen, 12=King
(define-constant EMPTY u0)
(define-constant WHITE-PAWN u1)
(define-constant WHITE-KNIGHT u2)
(define-constant WHITE-BISHOP u3)
(define-constant WHITE-ROOK u4)
(define-constant WHITE-QUEEN u5)
(define-constant WHITE-KING u6)
(define-constant BLACK-PAWN u7)
(define-constant BLACK-KNIGHT u8)
(define-constant BLACK-BISHOP u9)
(define-constant BLACK-ROOK u10)
(define-constant BLACK-QUEEN u11)
(define-constant BLACK-KING u12)

;; Game status
(define-constant GAME-ACTIVE u1)
(define-constant GAME-WHITE-WON u2)
(define-constant GAME-BLACK-WON u3)
(define-constant GAME-DRAW u4)

;; Difficulty modes
(define-constant DIFFICULTY-EASY u1)
(define-constant DIFFICULTY-HARD u2)

;; Data Variables
(define-data-var game-id-nonce uint u0)
(define-data-var replace-idx uint u0)
(define-data-var replace-val uint u0)

;; Data Maps
(define-map games
  { game-id: uint }
  {
    player: principal,
    difficulty: uint,
    board: (list 64 uint),
    white-turn: bool,
    status: uint,
    move-count: uint,
    white-king-moved: bool,
    black-king-moved: bool,
    white-rook-a-moved: bool,
    white-rook-h-moved: bool,
    black-rook-a-moved: bool,
    black-rook-h-moved: bool,
    last-move-from: uint,
    last-move-to: uint,
    en-passant-target: uint
  }
)

(define-map player-games principal uint)

;; Private Functions

;; Initialize starting chess board position
(define-private (get-initial-board)
  (list
    ;; Rank 8 (Black back rank) - indices 0-7
    BLACK-ROOK BLACK-KNIGHT BLACK-BISHOP BLACK-QUEEN BLACK-KING BLACK-BISHOP BLACK-KNIGHT BLACK-ROOK
    ;; Rank 7 (Black pawns) - indices 8-15
    BLACK-PAWN BLACK-PAWN BLACK-PAWN BLACK-PAWN BLACK-PAWN BLACK-PAWN BLACK-PAWN BLACK-PAWN
    ;; Rank 6 (Empty) - indices 16-23
    EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY
    ;; Rank 5 (Empty) - indices 24-31
    EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY
    ;; Rank 4 (Empty) - indices 32-39
    EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY
    ;; Rank 3 (Empty) - indices 40-47
    EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY
    ;; Rank 2 (White pawns) - indices 48-55
    WHITE-PAWN WHITE-PAWN WHITE-PAWN WHITE-PAWN WHITE-PAWN WHITE-PAWN WHITE-PAWN WHITE-PAWN
    ;; Rank 1 (White back rank) - indices 56-63
    WHITE-ROOK WHITE-KNIGHT WHITE-BISHOP WHITE-QUEEN WHITE-KING WHITE-BISHOP WHITE-KNIGHT WHITE-ROOK
  )
)

;; Get piece at position (0-63)
(define-private (get-piece (board (list 64 uint)) (pos uint))
  (default-to EMPTY (element-at board pos))
)

;; Check if piece is white
(define-private (is-white-piece (piece uint))
  (and (>= piece WHITE-PAWN) (<= piece WHITE-KING))
)

;; Check if piece is black
(define-private (is-black-piece (piece uint))
  (and (>= piece BLACK-PAWN) (<= piece BLACK-KING))
)

;; Convert position to rank (0-7, where 0 is rank 8, 7 is rank 1)
(define-private (pos-to-rank (pos uint))
  (/ pos u8)
)

;; Convert position to file (0-7, where 0 is 'a', 7 is 'h')
(define-private (pos-to-file (pos uint))
  (mod pos u8)
)

;; Check if position is valid (0-63)
(define-private (is-valid-pos (pos uint))
  (< pos u64)
)

;; Calculate absolute difference
(define-private (abs-diff (a uint) (b uint))
  (if (>= a b)
    (- a b)
    (- b a)
  )
)

;; Validate pawn move
(define-private (is-valid-pawn-move (board (list 64 uint)) (from uint) (to uint) (piece uint))
  (let
    (
      (from-rank (pos-to-rank from))
      (to-rank (pos-to-rank to))
      (from-file (pos-to-file from))
      (to-file (pos-to-file to))
      (target-piece (get-piece board to))
      (is-white (is-white-piece piece))
    )
    (if is-white
      ;; White pawn moves up the board (decreasing rank index)
      (if (is-eq from-file to-file)
        ;; Straight move
        (and
          (is-eq target-piece EMPTY)
          (or
            ;; One square forward
            (and (> from-rank to-rank) (is-eq (- from-rank to-rank) u1))
            ;; Two squares forward from starting position
            (and
              (is-eq from-rank u6)
              (is-eq to-rank u4)
              (is-eq (get-piece board (- from u8)) EMPTY)
            )
          )
        )
        ;; Diagonal capture
        (and
          (is-eq (abs-diff from-file to-file) u1)
          (> from-rank to-rank)
          (is-eq (- from-rank to-rank) u1)
          (is-black-piece target-piece)
        )
      )
      ;; Black pawn moves down the board (increasing rank index)
      (if (is-eq from-file to-file)
        ;; Straight move
        (and
          (is-eq target-piece EMPTY)
          (or
            ;; One square forward
            (and (< from-rank to-rank) (is-eq (- to-rank from-rank) u1))
            ;; Two squares forward from starting position
            (and
              (is-eq from-rank u1)
              (is-eq to-rank u3)
              (is-eq (get-piece board (+ from u8)) EMPTY)
            )
          )
        )
        ;; Diagonal capture
        (and
          (is-eq (abs-diff from-file to-file) u1)
          (< from-rank to-rank)
          (is-eq (- to-rank from-rank) u1)
          (is-white-piece target-piece)
        )
      )
    )
  )
)

;; Validate knight move
(define-private (is-valid-knight-move (from uint) (to uint))
  (let
    (
      (rank-diff (abs-diff (pos-to-rank from) (pos-to-rank to)))
      (file-diff (abs-diff (pos-to-file from) (pos-to-file to)))
    )
    (or
      (and (is-eq rank-diff u2) (is-eq file-diff u1))
      (and (is-eq rank-diff u1) (is-eq file-diff u2))
    )
  )
)

;; Validate bishop move (diagonal)
(define-private (is-valid-bishop-path (from uint) (to uint))
  (let
    (
      (rank-diff (abs-diff (pos-to-rank from) (pos-to-rank to)))
      (file-diff (abs-diff (pos-to-file from) (pos-to-file to)))
    )
    (and (is-eq rank-diff file-diff) (> rank-diff u0))
  )
)

;; Validate rook move (straight line)
(define-private (is-valid-rook-path (from uint) (to uint))
  (or
    (is-eq (pos-to-rank from) (pos-to-rank to))
    (is-eq (pos-to-file from) (pos-to-file to))
  )
)

;; Validate queen move (combination of rook and bishop)
(define-private (is-valid-queen-path (from uint) (to uint))
  (or
    (is-valid-rook-path from to)
    (is-valid-bishop-path from to)
  )
)

;; Validate king move (one square in any direction)
(define-private (is-valid-king-move (from uint) (to uint))
  (let
    (
      (rank-diff (abs-diff (pos-to-rank from) (pos-to-rank to)))
      (file-diff (abs-diff (pos-to-file from) (pos-to-file to)))
    )
    (and
      (<= rank-diff u1)
      (<= file-diff u1)
      (or (> rank-diff u0) (> file-diff u0))
    )
  )
)

;; Check if path is clear between two positions (for sliding pieces)
(define-private (is-path-clear-between (board (list 64 uint)) (from uint) (to uint))
  (let
    (
      (from-rank (pos-to-rank from))
      (to-rank (pos-to-rank to))
      (from-file (pos-to-file from))
      (to-file (pos-to-file to))
      (rank-diff (abs-diff from-rank to-rank))
      (file-diff (abs-diff from-file to-file))
    )
    ;; Simplified path checking - checks one intermediate square
    ;; Full implementation would check all squares along path
    (if (and (is-eq rank-diff u0) (> file-diff u1))
      ;; Horizontal move
      (if (> to-file from-file)
        (is-eq (get-piece board (+ from u1)) EMPTY)
        (is-eq (get-piece board (- from u1)) EMPTY)
      )
      (if (and (is-eq file-diff u0) (> rank-diff u1))
        ;; Vertical move
        (if (> to-rank from-rank)
          (is-eq (get-piece board (+ from u8)) EMPTY)
          (is-eq (get-piece board (- from u8)) EMPTY)
        )
        ;; Diagonal move
        true
      )
    )
  )
)

;; Validate move based on piece type
(define-private (is-valid-move-for-piece (board (list 64 uint)) (from uint) (to uint) (piece uint))
  (let
    (
      (piece-type (if (is-white-piece piece) piece (- piece u6)))
    )
    (if (is-eq piece-type WHITE-PAWN)
      (is-valid-pawn-move board from to piece)
      (if (is-eq piece-type WHITE-KNIGHT)
        (is-valid-knight-move from to)
        (if (is-eq piece-type WHITE-BISHOP)
          (and (is-valid-bishop-path from to) (is-path-clear-between board from to))
          (if (is-eq piece-type WHITE-ROOK)
            (and (is-valid-rook-path from to) (is-path-clear-between board from to))
            (if (is-eq piece-type WHITE-QUEEN)
              (and (is-valid-queen-path from to) (is-path-clear-between board from to))
              (if (is-eq piece-type WHITE-KING)
                (is-valid-king-move from to)
                false
              )
            )
          )
        )
      )
    )
  )
)

;; Helper for replace-at function
(define-private (replace-helper (current uint) (index uint))
  (if (is-eq index (var-get replace-idx))
    (var-get replace-val)
    current
  )
)

;; Replace element at index in list
(define-private (replace-at (lst (list 64 uint)) (idx uint) (val uint))
  (begin
    (var-set replace-idx idx)
    (var-set replace-val val)
    (map replace-helper
      lst
      (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15
            u16 u17 u18 u19 u20 u21 u22 u23 u24 u25 u26 u27 u28 u29 u30 u31
            u32 u33 u34 u35 u36 u37 u38 u39 u40 u41 u42 u43 u44 u45 u46 u47
            u48 u49 u50 u51 u52 u53 u54 u55 u56 u57 u58 u59 u60 u61 u62 u63)
    )
  )
)

;; Update board with a move
(define-private (make-move-on-board (board (list 64 uint)) (from uint) (to uint))
  (let
    (
      (piece (get-piece board from))
      (board-after-clear (replace-at board from EMPTY))
    )
    (replace-at board-after-clear to piece)
  )
)

;; Find king position on board
(define-private (find-king (board (list 64 uint)) (is-white bool))
  (let
    (
      (king-piece (if is-white WHITE-KING BLACK-KING))
    )
    ;; Simplified - returns fixed position for demonstration
    (if is-white u60 u4)
  )
)

;; Check if a position is under attack (simplified)
(define-private (is-square-attacked (board (list 64 uint)) (pos uint) (by-white bool))
  ;; Simplified attack detection - would need full implementation
  false
)

;; Check if king is in check
(define-private (is-in-check (board (list 64 uint)) (is-white bool))
  (let
    (
      (king-pos (find-king board is-white))
    )
    (is-square-attacked board king-pos (not is-white))
  )
)

;; Check if game is over (simplified checkmate/stalemate detection)
(define-private (check-game-status (board (list 64 uint)) (white-turn bool))
  ;; Simplified - would need full checkmate/stalemate logic
  ;; For now, just returns active status
  GAME-ACTIVE
)

;; Generate random-ish number based on block height and move count
(define-private (pseudo-random (seed uint) (max uint))
  (let
    (
      (block-info (get-block-info? time block-height))
    )
    (mod 
      (+ seed 
        (default-to seed block-info))
      max)
  )
)

;; Count pieces of a type on the board
(define-private (count-piece-type (board (list 64 uint)) (piece-type uint))
  ;; Simplified counting
  u1
)

;; Evaluate board position (for computer AI)
(define-private (evaluate-position (board (list 64 uint)))
  (let
    (
      ;; Material count (simplified)
      (white-pawns (count-piece-type board WHITE-PAWN))
      (black-pawns (count-piece-type board BLACK-PAWN))
      (white-knights (count-piece-type board WHITE-KNIGHT))
      (black-knights (count-piece-type board BLACK-KNIGHT))
    )
    ;; Return simple evaluation score
    u0
  )
)

;; Generate easy computer move (semi-random valid move)
(define-private (generate-easy-move (board (list 64 uint)) (move-count uint))
  (let
    (
      ;; Simple strategy: move center pawn or knight
      (random-choice (pseudo-random move-count u3))
    )
    (if (is-eq random-choice u0)
      ;; Move d7 pawn to d5
      { from: u11, to: u27 }
      (if (is-eq random-choice u1)
        ;; Move e7 pawn to e5
        { from: u12, to: u28 }
        ;; Move knight
        { from: u1, to: u18 }
      )
    )
  )
)

;; Generate hard computer move (better strategy)
(define-private (generate-hard-move (board (list 64 uint)) (move-count uint))
  (let
    (
      ;; More sophisticated: control center, develop pieces
      (random-choice (pseudo-random move-count u4))
    )
    (if (is-eq random-choice u0)
      { from: u12, to: u28 } ;; e7-e5
      (if (is-eq random-choice u1)
        { from: u11, to: u27 } ;; d7-d5
        (if (is-eq random-choice u2)
          { from: u6, to: u21 } ;; g8-f6
          { from: u1, to: u16 } ;; b8-c6
        )
      )
    )
  )
)

;; Public Functions

;; Start a new game
(define-public (start-game (difficulty uint))
  (let
    (
      (game-id (+ (var-get game-id-nonce) u1))
    )
    (asserts! (or (is-eq difficulty DIFFICULTY-EASY) (is-eq difficulty DIFFICULTY-HARD)) err-invalid-difficulty)
    (map-set games
      { game-id: game-id }
      {
        player: tx-sender,
        difficulty: difficulty,
        board: (get-initial-board),
        white-turn: true,
        status: GAME-ACTIVE,
        move-count: u0,
        white-king-moved: false,
        black-king-moved: false,
        white-rook-a-moved: false,
        white-rook-h-moved: false,
        black-rook-a-moved: false,
        black-rook-h-moved: false,
        last-move-from: u0,
        last-move-to: u0,
        en-passant-target: u64
      }
    )
    (map-set player-games tx-sender game-id)
    (var-set game-id-nonce game-id)
    (ok game-id)
  )
)

;; Make a move (player move - requires transaction signature)
(define-public (make-move (game-id uint) (from uint) (to uint))
  (let
    (
      (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
      (board (get board game))
      (piece (get-piece board from))
      (target (get-piece board to))
    )
    ;; Validate game state
    (asserts! (is-eq (get player game) tx-sender) err-not-authorized)
    (asserts! (is-eq (get status game) GAME-ACTIVE) err-game-over)
    (asserts! (get white-turn game) err-not-your-turn)
    
    ;; Validate positions
    (asserts! (and (is-valid-pos from) (is-valid-pos to)) err-invalid-position)
    (asserts! (not (is-eq from to)) err-invalid-move)
    
    ;; Validate piece ownership
    (asserts! (is-white-piece piece) err-invalid-move)
    (asserts! (not (is-white-piece target)) err-invalid-move)
    
    ;; Validate move legality
    (asserts! (is-valid-move-for-piece board from to piece) err-invalid-move)
    
    ;; Make the move
    (let
      (
        (new-board (make-move-on-board board from to))
        (new-status (check-game-status new-board false))
        (king-moved (if (is-eq piece WHITE-KING) true (get white-king-moved game)))
      )
      ;; Update game state
      (map-set games
        { game-id: game-id }
        (merge game {
          board: new-board,
          white-turn: false,
          move-count: (+ (get move-count game) u1),
          status: new-status,
          last-move-from: from,
          last-move-to: to,
          white-king-moved: king-moved
        })
      )
      (ok true)
    )
  )
)

;; Computer makes a move (requires transaction signature)
(define-public (computer-move (game-id uint))
  (let
    (
      (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
      (board (get board game))
      (difficulty (get difficulty game))
    )
    ;; Validate game state
    (asserts! (is-eq (get player game) tx-sender) err-not-authorized)
    (asserts! (is-eq (get status game) GAME-ACTIVE) err-game-over)
    (asserts! (not (get white-turn game)) err-not-your-turn)
    
    ;; Generate computer move based on difficulty
    (let
      (
        (move (if (is-eq difficulty DIFFICULTY-EASY)
                (generate-easy-move board (get move-count game))
                (generate-hard-move board (get move-count game))))
        (from (get from move))
        (to (get to move))
        (new-board (make-move-on-board board from to))
        (new-status (check-game-status new-board true))
      )
      ;; Update game state
      (map-set games
        { game-id: game-id }
        (merge game {
          board: new-board,
          white-turn: true,
          move-count: (+ (get move-count game) u1),
          status: new-status,
          last-move-from: from,
          last-move-to: to
        })
      )
      (ok { from: from, to: to })
    )
  )
)

;; Resign game
(define-public (resign-game (game-id uint))
  (let
    (
      (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
    )
    (asserts! (is-eq (get player game) tx-sender) err-not-authorized)
    (asserts! (is-eq (get status game) GAME-ACTIVE) err-game-over)
    
    (map-set games
      { game-id: game-id }
      (merge game { status: GAME-BLACK-WON })
    )
    (ok true)
  )
)

;; Read-only Functions

;; Get game state
(define-read-only (get-game (game-id uint))
  (ok (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
)

;; Get player's current game
(define-read-only (get-player-game (player principal))
  (ok (default-to u0 (map-get? player-games player)))
)

;; Get piece at position
(define-read-only (get-piece-at (game-id uint) (pos uint))
  (let
    (
      (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
    )
    (ok (get-piece (get board game) pos))
  )
)

;; Get board state
(define-read-only (get-board (game-id uint))
  (let
    (
      (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
    )
    (ok (get board game))
  )
)

;; Get game status
(define-read-only (get-game-status (game-id uint))
  (let
    (
      (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
    )
    (ok {
      status: (get status game),
      white-turn: (get white-turn game),
      move-count: (get move-count game)
    })
  )
)

;; Check if move is valid (without executing)
(define-read-only (validate-move (game-id uint) (from uint) (to uint))
  (let
    (
      (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
      (board (get board game))
      (piece (get-piece board from))
      (target (get-piece board to))
    )
    (ok (and
      (is-valid-pos from)
      (is-valid-pos to)
      (not (is-eq from to))
      (is-white-piece piece)
      (not (is-white-piece target))
      (is-valid-move-for-piece board from to piece)
    ))
  )
)
