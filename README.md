# 31 Card Game - Pixi.js

A modern, interactive implementation of the classic 31 card game built with Pixi.js. This project features smooth animations, an intelligent AI opponent, and an intuitive user interface.

## Overview

31 is a traditional card game where players aim to collect cards of the same suit with the highest total value. This digital version features a player vs. AI gameplay with animated card dealing, drawing, and discarding actions.

## Game Rules

- The game is played with a standard 52-card deck.
- Each player starts with 3 cards.
- On your turn, you draw a card (from the deck or discard pile) and then discard one card.
- Cards are worth their face value. Aces are worth 11 points, and face cards (J, Q, K) are worth 10 points.
- Points are calculated by summing card values of the same suit.
- The objective is to get the highest score in one suit.
- Players can "knock" when they believe they have a better hand than their opponent.
- When a player knocks, the round ends, cards are revealed, and the player with the highest suit total wins.
- The maximum possible score is 31 (Ace + K + Q or Ace + K + 10).

## Features

- **Interactive Card Gameplay**: Drag and drop cards to rearrange or right-click to discard
- **Animated Card Actions**: Smooth animations for dealing, drawing, and discarding cards
- **Intelligent AI Opponent**: Computer player with adaptive strategy that improves as the game progresses
- **Real-time Score Calculation**: Visual feedback of your current point total by suit
- **Responsive Design**: Adapts to different screen sizes
- **Card Flipping Animations**: Realistic card reveal animations
- **Turn-based System**: Clear visual indicators for whose turn it is

## Technologies Used

- **Pixi.js**: High-performance 2D rendering library
- **JavaScript (ES6+)**: Modern JavaScript with object-oriented programming patterns
- **Vite**: Fast, modern frontend build tool
- **CSS**: Custom styling for UI elements

## Project Structure

- `src/`: Source code
  - `ai/`: AI opponent logic
  - `animations/`: Card movement and flip animations
  - `cardTypes/`: Card data models and types
  - `cardSwapping/`: Card interaction and arrangement logic
  - `components/`: UI components (buttons, containers)
  - `game/`: Core game mechanics and controllers
  - `utils/`: Helper functions

## Game Controls

- **Left-click and drag**: Move cards within your hand
- **Right-click**: Discard a card
- **Draw Card button**: Draw a card from the deck
- **Draw from Pile button**: Draw the top card from the discard pile
- **Knock button**: End the round when you believe you have a winning hand (only available when you have exactly 3 cards)
- **End Turn button**: End your turn (only available when you have 3 cards, not 4)

## Game Mechanics

1. **Setup**: Each player receives 3 cards, and one card is placed face-up on the discard pile.
2. **Turns**: Players take turns drawing and discarding cards.
3. **Drawing**: On your turn, draw either from the deck or the discard pile.
4. **Discarding**: After drawing, you must discard one card (to have exactly 3 cards).
5. **Knocking**: Choose to "knock" when you believe you have a better hand than your opponent.
6. **Scoring**: The player with the highest total in a single suit wins.

## AI Strategy

The AI opponent makes decisions based on:
- Current hand strength
- Visible cards in the discard pile
- Game progression stage
- Estimated opponent hand strength

The AI becomes more aggressive in the later stages of the game and will knock when:
- It has a very strong hand (25+ points)
- It reaches 31 points (maximum score)
- It believes its hand is stronger than the player's hand

## Installation and Setup

1. Clone the repository.

2. Navigate to the project directory:
   ```
   cd 31-CardGame-Pixi.js
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm run dev 
   ```

5. Open your browser and navigate to the URL displayed in the terminal (typically http://localhost:5173)

