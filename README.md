# Stack-Mate

A chess game smart contract for the Stacks blockchain. Players can play against a computer opponent with configurable difficulty levels (Easy and Hard).

## Features

- Play chess against a computer opponent
- Two difficulty modes: Easy and Hard
- Each move requires a transaction signature
- Game state stored on-chain
- Support for standard chess rules

## Project Structure

```
.
├── chess-game.clar      # Main smart contract
├── Clarinet.toml        # Project configuration
├── README.md            # This file
└── .gitignore          # Git ignore rules
```

## Getting Started

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) installed

### Setup

```bash
# Install dependencies
clarinet install

# Run tests
clarinet test

# Run local development server
clarinet run
```

## Contract Functions

The chess-game contract provides functions for:
- Creating new games
- Making moves
- Querying game state
- Checking game status
- Playing against the computer AI

## Development

To modify the contract, edit `chess-game.clar` and test using:

```bash
clarinet check        # Syntax check
clarinet test         # Run tests
```

## License

MIT
