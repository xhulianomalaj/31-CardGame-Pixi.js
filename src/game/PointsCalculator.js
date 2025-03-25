/**
 * PointsCalculator.js
 *
 * Handles the calculation and display of player scores in the game. This class is responsible for:
 * - Calculating points for each player based on their cards
 * - Organizing cards by suit and calculating suit-specific scores
 * - Updating the UI text elements with current point values
 * - Tracking player points for determining the winner
 * - Maintaining separate scoring for both players
 *
 * The PointsCalculator provides the scoring logic for the game, analyzing the
 * cards in each player's hand and determining their point values according to
 * the game rules.
 */

import { getSortedCards, rankOrder, getSuitSymbol } from "../cardSwapping";

export class PointsCalculator {
  constructor(
    gameState,
    totalPointsText,
    player1HandContainer,
    player2TotalPointsText,
    player2HandContainer = null
  ) {
    this.gameState = gameState;
    this.totalPointsText = totalPointsText;
    this.player1HandContainer = player1HandContainer;
    this.player2TotalPointsText = player2TotalPointsText;
    this.player2HandContainer = player2HandContainer;
    this.player1points = 0;
    this.player2points = 0;
  }

  updateTotalPoints() {
    const player1Hand = this.player1HandContainer
      .getContainer()
      .children.map((cardSprite) => cardSprite.card);

    if (!player1Hand || player1Hand.length === 0) {
      this.totalPointsText.text = "Total Points: ";
      return;
    }

    const sortedHand = getSortedCards(player1Hand);

    const pointsBySuit = sortedHand.reduce((acc, card) => {
      const suitSymbol = getSuitSymbol(card.suit).symbol;
      const rankValue = rankOrder[card.rank];

      if (!acc[suitSymbol]) {
        acc[suitSymbol] = 0;
      }
      acc[suitSymbol] += rankValue;
      return acc;
    }, {});
    const points = Object.entries(pointsBySuit)
      .flat()
      .filter((item) => typeof item === "number");
    this.player1points = Math.max(...points);
    const totalPointsText = Object.entries(pointsBySuit)
      .map(([symbol, points]) => `${points}${symbol}`)
      .join(" ");

    this.totalPointsText.text = `Total Points: ${totalPointsText} `;
  }

  updatePlayer2TotalPoints() {
    if (!this.player2HandContainer) return;

    const player2Hand = this.player2HandContainer
      .getContainer()
      .children.map((cardSprite) => cardSprite.card);

    if (!player2Hand || player2Hand.length === 0) {
      this.player2TotalPointsText.text = "Player 2 Total Points: ";
      return;
    }

    const sortedHand = getSortedCards(player2Hand);

    const pointsBySuit = sortedHand.reduce((acc, card) => {
      const suitSymbol = getSuitSymbol(card.suit).symbol;
      const rankValue = rankOrder[card.rank];

      if (!acc[suitSymbol]) {
        acc[suitSymbol] = 0;
      }
      acc[suitSymbol] += rankValue;
      return acc;
    }, {});
    const points = Object.entries(pointsBySuit)
      .flat()
      .filter((item) => typeof item === "number");
    this.player2points = Math.max(...points);
    const totalPointsText = Object.entries(pointsBySuit)
      .map(([symbol, points]) => `${points}${symbol}`)
      .join(" ");

    this.player2TotalPointsText.text = `Total Points: ${totalPointsText}`;
  }
}
