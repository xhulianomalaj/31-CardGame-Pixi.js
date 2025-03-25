/**
 * Deck.js
 *
 * Manages the card deck used in the game. This class is responsible for:
 * - Creating a complete deck of cards from suits and ranks
 * - Shuffling the deck to randomize card order
 * - Providing card drawing functionality
 * - Managing the remaining cards in the deck
 *
 * The Deck class serves as the source of cards for the game, allowing players
 * to draw cards throughout gameplay while maintaining the deck's state.
 */

import { Card } from "../cardTypes";
import { getSuitSymbol } from "../cardSwapping";

export class Deck {
  constructor(suits, ranks) {
    this.cards = suits
      .flatMap((suit) => {
        const suitSymbol = getSuitSymbol(suit).symbol;
        return ranks.map(
          (rank, index) => new Card(suitSymbol, suit, rank, index)
        );
      })
      .slice(0, 52);
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  drawCard() {
    const card = this.cards.pop();
    return card;
  }
}
