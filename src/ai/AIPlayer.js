/**
 * AIPlayer.js
 *
 * Handles the AI logic for Player 2. This class is responsible for:
 * - Deciding which card to draw (from deck or discard pile)
 * - Deciding which card to discard
 * - Basic strategy for maximizing points by suit
 * - Deciding when to knock based on hand strength
 *
 * The AIPlayer provides automated gameplay for the computer opponent,
 * making decisions based on simple card game strategy.
 */

import { getSortedCards, rankOrder, getSuitSymbol } from "../cardSwapping";

export class AIPlayer {
  constructor(gameState, player2Index = 1) {
    this.gameState = gameState;
    this.player2Index = player2Index;
  }

  /**
   * Decides whether to draw from deck or discard pile
   * @param {Card} topDiscardCard - The top card of the discard pile
   * @returns {boolean} - True if should draw from discard pile, false for deck
   */
  shouldDrawFromDiscardPile(topDiscardCard) {
    if (!topDiscardCard) return false;

    const player2 = this.gameState.players[this.player2Index];
    const hand = player2.hand;

    // If we have no cards, any card is good
    if (hand.length === 0) return true;

    // Calculate current points by suit
    const pointsBySuit = this.calculatePointsBySuit(hand);
    const currentBestSuit = Object.entries(pointsBySuit).sort(
      (a, b) => b[1] - a[1]
    )[0];

    // Calculate how much this card would improve our best suit
    const discardCardSuit = getSuitSymbol(topDiscardCard.suit).symbol;
    const discardCardValue = rankOrder[topDiscardCard.rank];

    // Check if adding this card would improve our best suit
    if (discardCardSuit === currentBestSuit[0]) {
      return true;
    }

    // Check if this card would start a strong new suit
    if (discardCardValue >= 10) {
      // Count cards in each suit
      const suitCounts = {};
      hand.forEach((card) => {
        const symbol = getSuitSymbol(card.suit).symbol;
        suitCounts[symbol] = (suitCounts[symbol] || 0) + 1;
      });

      // If we have fewer than 2 cards in the discard's suit, it might be worth starting a new collection
      if (!suitCounts[discardCardSuit] || suitCounts[discardCardSuit] < 2) {
        return true;
      }
    }

    // If we already have a really strong suit (25+), be more selective
    if (currentBestSuit[1] >= 25) {
      return discardCardSuit === currentBestSuit[0] && discardCardValue >= 8;
    }

    // If our hand is already full (4 cards), only draw if it's clearly better than what we have
    if (hand.length >= 4) {
      // Find our weakest card
      const weakestCard = this.findWeakestCard(hand);

      // Only draw if the discard is better than our weakest card
      return this.isCardBetterThanWeakest(topDiscardCard, weakestCard, hand);
    }

    // For medium value cards (7-9), draw if it matches our suit strategy
    if (discardCardValue >= 7 && discardCardValue <= 9) {
      // Count cards by suit
      const suitCounts = hand.reduce((counts, card) => {
        const symbol = getSuitSymbol(card.suit).symbol;
        counts[symbol] = (counts[symbol] || 0) + 1;
        return counts;
      }, {});

      // If we already have cards of this suit, take it
      return suitCounts[discardCardSuit] && suitCounts[discardCardSuit] > 0;
    }

    // For high value cards (10+), almost always take them
    return discardCardValue >= 10;
  }

  /**
   * Finds the weakest card in the hand (least valuable for our strategy)
   * @param {Array} hand - Array of card objects
   * @returns {Object} - The weakest card object
   */
  findWeakestCard(hand) {
    // Group cards by suit
    const cardsBySuit = hand.reduce((groups, card) => {
      const suitSymbol = getSuitSymbol(card.suit).symbol;
      if (!groups[suitSymbol]) {
        groups[suitSymbol] = [];
      }
      groups[suitSymbol].push(card);
      return groups;
    }, {});

    // Calculate total points per suit
    const pointsBySuit = {};
    Object.entries(cardsBySuit).forEach(([suit, cards]) => {
      pointsBySuit[suit] = cards.reduce(
        (sum, card) => sum + rankOrder[card.rank],
        0
      );
    });

    // Find suit with lowest points or fewest cards
    const weakestSuit = Object.entries(cardsBySuit).sort((a, b) => {
      // First by count
      if (a[1].length !== b[1].length) {
        return a[1].length - b[1].length;
      }
      // Then by points
      return pointsBySuit[a[0]] - pointsBySuit[b[0]];
    })[0][0];

    // Find the lowest value card in the weakest suit
    return cardsBySuit[weakestSuit].sort(
      (a, b) => rankOrder[a.rank] - rankOrder[b.rank]
    )[0];
  }

  /**
   * Determines if a card would be better than the weakest card in hand
   * @param {Object} newCard - Card being evaluated
   * @param {Object} weakestCard - Current weakest card in hand
   * @param {Array} hand - Full hand of cards
   * @returns {boolean} - True if the new card is better
   */
  isCardBetterThanWeakest(newCard, weakestCard, hand) {
    const newCardSuit = getSuitSymbol(newCard.suit).symbol;
    const weakCardSuit = getSuitSymbol(weakestCard.suit).symbol;
    const newCardValue = rankOrder[newCard.rank];
    const weakCardValue = rankOrder[weakestCard.rank];

    // Calculate points by suit for the current hand
    const pointsBySuit = this.calculatePointsBySuit(hand);

    // If new card is in our strongest suit, it's likely better
    const strongestSuit = Object.entries(pointsBySuit).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    if (newCardSuit === strongestSuit && weakCardSuit !== strongestSuit) {
      return true;
    }

    // If new card is Ace or face card (high value), it's usually better
    if (newCardValue >= 10 && weakCardValue < 10) {
      return true;
    }

    // If new card would contribute to a suit we're building
    const suitCounts = hand.reduce((counts, card) => {
      const symbol = getSuitSymbol(card.suit).symbol;
      counts[symbol] = (counts[symbol] || 0) + 1;
      return counts;
    }, {});

    // If we have multiple cards of the new card's suit but the weak card is alone
    if (
      suitCounts[newCardSuit] &&
      suitCounts[newCardSuit] >= 2 &&
      suitCounts[weakCardSuit] === 1
    ) {
      return true;
    }

    // If cards are same suit but new card is higher value
    if (newCardSuit === weakCardSuit && newCardValue > weakCardValue) {
      return true;
    }

    // If weak card is in a weak suit (fewer than 15 points) and new card is valuable
    if (pointsBySuit[weakCardSuit] < 15 && newCardValue >= 8) {
      return true;
    }

    return false;
  }

  /**
   * Decides which card to discard from the player's hand
   * @param {Array} hand - The player's hand of cards
   * @returns {number} - Index of the card to discard
   */
  selectCardToDiscard(hand) {
    if (hand.length === 0) return -1;

    // Group cards by suit and calculate value per suit
    const suitGroups = {};

    hand.forEach((card, index) => {
      const suitSymbol = getSuitSymbol(card.suit).symbol;

      if (!suitGroups[suitSymbol]) {
        suitGroups[suitSymbol] = {
          cards: [],
          totalValue: 0,
          indices: [],
        };
      }

      suitGroups[suitSymbol].cards.push(card);
      suitGroups[suitSymbol].totalValue += rankOrder[card.rank];
      suitGroups[suitSymbol].indices.push(index);
    });

    // Strategy: Focus on building one strong suit

    // 1. If we have 3+ cards in a suit, keep them and discard from other suits
    const strongSuits = Object.entries(suitGroups).filter(
      ([suit, group]) => group.cards.length >= 3
    );

    if (strongSuits.length > 0) {
      // We have a suit with 3+ cards - discard lowest card from another suit
      const strongestSuit = strongSuits.sort(
        (a, b) => b[1].totalValue - a[1].totalValue
      )[0][0];

      // Find the weakest card not in our strongest suit
      const cardsInWeakSuits = hand
        .map((card, index) => ({ card, index }))
        .filter(
          (item) => getSuitSymbol(item.card.suit).symbol !== strongestSuit
        );

      if (cardsInWeakSuits.length > 0) {
        // Sort by value and return index of lowest
        cardsInWeakSuits.sort(
          (a, b) => rankOrder[a.card.rank] - rankOrder[b.card.rank]
        );
        return cardsInWeakSuits[0].index;
      }
    }

    // 2. If we have 2 suits with similar high values, keep the one with more cards or higher total
    const suitValues = Object.entries(suitGroups).sort((a, b) => {
      // Sort by card count first (descending)
      if (a[1].cards.length !== b[1].cards.length) {
        return b[1].cards.length - a[1].cards.length;
      }
      // Then by total value (descending)
      return b[1].totalValue - a[1].totalValue;
    });

    if (suitValues.length >= 2) {
      const bestSuit = suitValues[0][0];
      const secondBestSuit = suitValues[1][0];

      // If our second best suit is close in value to our best, consider building it
      const valueDifference =
        suitGroups[bestSuit].totalValue - suitGroups[secondBestSuit].totalValue;

      if (
        valueDifference <= 5 &&
        suitGroups[secondBestSuit].cards.length >= 2
      ) {
        // The suits are close in value - keep both and discard from others
        const otherSuits = Object.keys(suitGroups).filter(
          (suit) => suit !== bestSuit && suit !== secondBestSuit
        );

        if (otherSuits.length > 0) {
          // Discard lowest card from another suit
          let lowestValue = Infinity;
          let lowestIndex = -1;

          otherSuits.forEach((suit) => {
            suitGroups[suit].cards.forEach((card, i) => {
              const value = rankOrder[card.rank];
              if (value < lowestValue) {
                lowestValue = value;
                lowestIndex = suitGroups[suit].indices[i];
              }
            });
          });

          if (lowestIndex !== -1) {
            return lowestIndex;
          }
        }
      }
    }

    // 3. Identify our weakest suit and discard its lowest card
    const weakestSuit = suitValues[suitValues.length - 1][0];
    const weakSuitCards = suitGroups[weakestSuit].cards;
    const weakSuitIndices = suitGroups[weakestSuit].indices;

    // Find the lowest value card in the weakest suit
    let lowestValueIndex = 0;
    let lowestValue = rankOrder[weakSuitCards[0].rank];

    for (let i = 1; i < weakSuitCards.length; i++) {
      const cardValue = rankOrder[weakSuitCards[i].rank];
      if (cardValue < lowestValue) {
        lowestValue = cardValue;
        lowestValueIndex = i;
      }
    }

    // Return the index in the original hand
    return weakSuitIndices[lowestValueIndex];
  }

  /**
   * Decides whether Player 2 should knock based on its hand strength
   * @returns {boolean} - True if AI should knock, false otherwise
   */
  shouldKnock() {
    const player2 = this.gameState.players[this.player2Index];
    const hand = player2.hand;

    // Only allow knocking if Player 2 has exactly 3 cards
    if (hand.length !== 3) {
      console.log(
        "Player 2 can't knock - doesn't have exactly 3 cards",
        hand.length
      );
      return false;
    }

    // Calculate points by suit for Player 2's hand
    const pointsBySuit = this.calculatePointsBySuit(hand);

    // Get the maximum points for Player 2
    const player2MaxPoints = Math.max(...Object.values(pointsBySuit));
    console.log("Player 2 best suit points:", player2MaxPoints);

    // If we have 31 points, definitely knock
    if (player2MaxPoints === 31) {
      console.log("Player 2 knocking with 31 points");
      return true;
    }

    // If we have a very strong hand (25 or higher), knock - more aggressive
    if (player2MaxPoints >= 25) {
      console.log("Player 2 knocking with strong hand:", player2MaxPoints);
      return true;
    }

    // Try to estimate Player 1's hand strength from visible cards
    const player1 = this.gameState.players[0];
    const player1VisibleCards = player1.hand.filter(
      (card) => card.visible === true
    );

    // Calculate points from visible cards in Player 1's hand (if any)
    let player1EstimatedMaxPoints = 0;

    if (player1VisibleCards.length > 0) {
      const player1PointsBySuit =
        this.calculatePointsBySuit(player1VisibleCards);
      player1EstimatedMaxPoints = Math.max(
        ...Object.values(player1PointsBySuit)
      );
      console.log("Player 1 visible cards points:", player1EstimatedMaxPoints);

      // If we can see most of Player 1's cards, we can make a more accurate judgment
      if (player1VisibleCards.length >= player1.hand.length - 1) {
        // More aggressive if we know most of opponent's cards
        const shouldKnock = player2MaxPoints >= player1EstimatedMaxPoints + 1; // More aggressive
        console.log(
          "Player 2 can see most cards, knocking decision:",
          shouldKnock
        );
        return shouldKnock;
      }
    } else {
      // If we can't see any of Player 1's cards, estimate based on game progress
      if (this.gameState.discardPile && this.gameState.discardPile.length > 3) {
        // Later in the game, assume opponent has around 21-22 points (more aggressive)
        player1EstimatedMaxPoints = 21;
        console.log(
          "Late game estimate of Player 1 points:",
          player1EstimatedMaxPoints
        );
      } else {
        // Earlier in the game, assume opponent has around 18-19 points (more aggressive)
        player1EstimatedMaxPoints = 19;
        console.log(
          "Early game estimate of Player 1 points:",
          player1EstimatedMaxPoints
        );
      }
    }

    // Knock based on game stage
    const totalTurns = this.gameState.discardPile
      ? this.gameState.discardPile.length
      : 0;
    console.log("Game stage - turns played:", totalTurns);

    // Early game (first few turns) - be cautious but more aggressive than before
    if (totalTurns < 3) {
      // Knock with strong hand early
      const shouldKnock = player2MaxPoints >= 26; // More aggressive
      console.log("Early game knocking decision:", shouldKnock);
      return shouldKnock;
    }

    // Mid game - more moderate but still aggressive
    if (totalTurns < 6) {
      const confidenceMargin = 2; // Only need to be 2 points better (more aggressive)
      const shouldKnock =
        player2MaxPoints >= player1EstimatedMaxPoints + confidenceMargin;
      console.log("Mid game knocking decision:", shouldKnock);
      return shouldKnock;
    }

    // Late game - very aggressive
    const confidenceMargin = 1; // Only need to be 1 point better (very aggressive)
    const shouldKnock =
      player2MaxPoints >= player1EstimatedMaxPoints + confidenceMargin;
    console.log("Late game knocking decision:", shouldKnock);
    return shouldKnock;
  }

  /**
   * Helper function to calculate points by suit for a hand
   * @param {Array} hand - Array of card objects
   * @returns {Object} - Object with suit symbols as keys and point totals as values
   */
  calculatePointsBySuit(hand) {
    return hand.reduce((acc, card) => {
      const suitSymbol = getSuitSymbol(card.suit).symbol;
      const rankValue = rankOrder[card.rank];

      if (!acc[suitSymbol]) {
        acc[suitSymbol] = 0;
      }
      acc[suitSymbol] += rankValue;
      return acc;
    }, {});
  }
}
