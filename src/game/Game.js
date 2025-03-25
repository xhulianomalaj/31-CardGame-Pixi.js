/**
 * Game.js
 *
 * The main orchestrator for the card game application. This class is responsible for:
 * - Initializing the game UI components (containers, buttons, text elements)
 * - Setting up the game state and player data
 * - Managing the high-level game flow (starting, restarting, determining winners)
 * - Creating and positioning UI elements like buttons and score displays
 * - Handling user interfaces for different game phases (start, play, end)
 * - Coordinating between different game components (deck, hands, points)
 * - Managing event listeners for user interactions
 *
 * The Game class essentially serves as the central hub that connects all other
 * game elements together while managing the overall game state and UI.
 */

import { Container, Assets, Text } from "pixi.js";
import { GameState, Player } from "../cardTypes";
import { suits, ranks } from "../cardTypes";
import { HandContainer } from "../components/HandContainer";
import { DeckContainer } from "../components/DeckContainer";
import { DiscardPileContainer } from "../components/DiscardPileContainer";
import { Button } from "../components/Button";
import { Deck } from "./Deck";
import { PointsCalculator } from "./PointsCalculator";
import { CardAnimator } from "../animations/CardAnimator";
import { GameController } from "./GameController";
import { generateCardTexture } from "../utils";

export class Game {
  constructor(app) {
    this.app = app;
    this.gameContainer = new Container();
    this.gameContainer.label = "gameContainer";
    this.gameContainer.sortableChildren = true;
    this.app.stage.addChild(this.gameContainer);

    this.gameState = new GameState();
    this.gameState.players = [new Player("Player 1"), new Player("Player 2")];
    this.gameState.currentPlayerIndex = 0; // Start with Player 1
    this.deck = new Deck(suits, ranks);

    this.player1HandContainer = new HandContainer(
      "player1Hand",
      app,
      this.gameContainer,
      (app.screen.width - 200) / 2,
      app.screen.height - 190
    );

    this.player2HandContainer = new HandContainer(
      "player2Hand",
      app,
      this.gameContainer,
      (app.screen.width - 150) / 2 - 25,
      40
    );

    this.deckContainer = new DeckContainer(
      app,
      this.gameContainer,
      this.deck.cards
    );
    this.discardPileContainer = new DiscardPileContainer(
      app,
      this.gameContainer
    );
    this.cardAnimator = new CardAnimator(
      app,
      this.gameContainer,
      this.deckContainer
    );

    this.deckContainer.addDiscardPile(this.discardPileContainer);

    this.totalPointsText = new Text("Total Points: ", {
      fill: "black",
      fontSize: 20,
    });
    this.totalPointsText.position.set(
      this.player1HandContainer.getContainer().position.x + 300,
      this.player1HandContainer.getContainer().position.y + 110
    );
    this.gameContainer.addChild(this.totalPointsText);

    this.player2TotalPointsText = new Text("Player 2 Total Points: ", {
      fill: "black",
      fontSize: 20,
    });
    this.player2TotalPointsText.position.set(
      this.player2HandContainer.getContainer().position.x + 300,
      this.player2HandContainer.getContainer().position.y + 40
    );
    this.gameContainer.addChild(this.player2TotalPointsText);

    this.pointsCalculator = new PointsCalculator(
      this.gameState,
      this.totalPointsText,
      this.player1HandContainer,
      this.player2TotalPointsText,
      this.player2HandContainer
    );

    this.player1points = this.pointsCalculator.player1points;
    this.player2points = this.pointsCalculator.player2points;

    this.isDealingCards = false; // Flag to track card dealing animation
    this.isAnimating = false; // Flag for other animations

    this.startGameButton = new Button(
      "Start Game",
      (app.screen.width - 90) / 2,
      (app.screen.height - 50) / 2 + 100,
      async () => {
        // Disable all buttons during the dealing animation
        this.disableAllButtons();

        // Set animation flags to true
        this.isDealingCards = true;
        this.isAnimating = true;

        console.log("Starting game animation, all buttons disabled");

        // Make all buttons visible but disabled during animation
        this.drawCardActionButton.setVisible(true);
        this.drawFromPileButton.setVisible(true);
        this.totalPointsText.visible = true;
        this.knockButton.setVisible(true);
        this.endTurnButton.setVisible(true);

        // Hide the start game button
        this.startGameButton.setVisible(false);

        // Set current player to Player 1 to start the game
        this.gameState.currentPlayerIndex = 0;
        this.gameState.player1HasDrawn = false;
        this.gameState.player1HasDiscarded = false;
        this.gameState.player2HasDrawn = false;
        this.gameState.player2HasDiscarded = false;

        // Start dealing the cards (animation handled in GameController)
        await this.gameController.dealCardsOneByOne();

        // Animation flags are cleared in the dealCardsOneByOne method

        // Update total points to show initial hand strength
        this.pointsCalculator.updateTotalPoints();

        // Add turn indicator
        this.updateTurnIndicator();
      }
    );
    this.startGameButton.setVisible(true); // Make the start game button visible initially
    this.gameContainer.addChild(this.startGameButton.getButton());

    this.drawCardActionButton = new Button(
      "Draw Card",
      (app.screen.width - 90) / 2,
      (app.screen.height - 50) / 2 + 100,
      async () => {
        await this.gameController.drawCardForPlayer1();
      }
    );
    this.gameContainer.addChild(this.drawCardActionButton.getButton());

    this.drawFromPileButton = new Button(
      "Draw from Pile",
      (app.screen.width - 90) / 2 + 175,
      (app.screen.height - 50) / 2 + 100,
      async () => {
        await this.gameController.drawCardFromDiscardPile();
      },
      150
    );
    this.gameContainer.addChild(this.drawFromPileButton.getButton());

    // Add End Turn button
    this.endTurnButton = new Button(
      "End Turn",
      this.totalPointsText.position.x - 5,
      this.totalPointsText.position.y - 90, // Position above the knock button
      () => {
        // Only allow ending turn if we're not in an animation
        if (
          this.gameState.currentPlayerIndex === 0 &&
          !this.isDealingCards &&
          !this.isAnimating
        ) {
          // Disable all buttons during the turn transition
          this.disableAllButtons();
          this.isAnimating = true;

          // Switch to Player 2's turn
          this.gameState.currentPlayerIndex = 1;
          this.gameState.player1HasDrawn = false;
          this.gameState.player1HasDiscarded = false;

          // Trigger turn change callback
          if (this.gameState._turnChangeCallback) {
            this.gameState._turnChangeCallback();
          }

          // Start Player 2's turn after a short delay
          setTimeout(() => {
            this.isAnimating = false;
            // Use the player2Controller from the GameController
            this.gameController.player2Controller.performTurn();
          }, 1000);
        }
      },
      110,
      0x00bfff // Light blue color
    );
    this.endTurnButton.setVisible(false); // Initially hide the end turn button
    this.gameContainer.addChild(this.endTurnButton.getButton());

    this.knockButton = new Button(
      "Knock",
      this.totalPointsText.position.x - 5,
      this.totalPointsText.position.y - 50, // Keep this position for the knock button
      async () => {
        if (
          this.knockButton.getButton().interactive &&
          !this.isDealingCards &&
          !this.isAnimating
        ) {
          // Disable all buttons during the knock animation
          this.disableAllButtons();
          this.isAnimating = true;

          // Update game state to indicate Player 1 has knocked
          this.gameState.knockedPlayer = 0; // Player 1's index

          await this.revealPlayer2Cards();
          this.pointsCalculator.updatePlayer2TotalPoints();
          this.player2TotalPointsText.visible = true; // Make the player 2 total points text visible
          this.determineWinner(); // Determine the winner
          this.showRestartButton(); // Show the restart button

          this.isAnimating = false;
          // Re-enable the restart button
          if (this.restartGameButton) {
            this.restartGameButton.setInteractive(true);
          }
        }
      },
      110,
      0xff0000
    );
    this.knockButton.setVisible(false); // Initially hide the knock button
    this.gameContainer.addChild(this.knockButton.getButton());

    // Create turn indicator
    this.turnIndicatorText = new Text("Current Turn: Player 1", {
      fill: "white",
      fontSize: 24,
      fontWeight: "bold",
    });
    this.turnIndicatorText.position.set(
      this.knockButton.getButton().position.x + 150,
      this.knockButton.getButton().position.y - 20
    );
    this.turnIndicatorText.visible = false;
    this.gameContainer.addChild(this.turnIndicatorText);

    this.winnerText = new Text("", {
      fill: "black",
      fontSize: 30,
      fontWeight: "bold",
    });
    this.winnerText.position.set(
      this.knockButton.getButton().position.x,
      this.knockButton.getButton().position.y - 110 // Position higher, above the End Turn button
    );
    this.gameContainer.addChild(this.winnerText);

    this.totalPointsText.visible = false; // Initially hide the total points text
    this.player2TotalPointsText.visible = false; // Initially hide the player 2 total points text

    this.gameController = new GameController(
      app,
      this.gameContainer,
      this.gameState,
      this.deck,
      this.deckContainer,
      this.player1HandContainer,
      this.player2HandContainer,
      this.cardAnimator,
      this.pointsCalculator,
      this.drawCardActionButton,
      this.drawFromPileButton,
      this.knockButton,
      this.endTurnButton,
      this
    );

    this.initEventListeners();
  }

  async revealPlayer2Cards() {
    const player2Hand = this.player2HandContainer.getContainer().children;

    // First ensure all cards have the same dimensions
    if (player2Hand.length > 0) {
      // Use the first card as reference
      const referenceCard = player2Hand[0];

      // Apply reference dimensions to all cards in hand
      for (const card of player2Hand) {
        card.scale.set(referenceCard.scale.x, referenceCard.scale.y);
        card.width = referenceCard.width;
        card.height = referenceCard.height;
      }
    }

    // Now flip the cards
    for (const cardSprite of player2Hand) {
      const card = cardSprite.card;
      let frontCardTexture;
      try {
        // Load the front texture for the card from the assets folder
        frontCardTexture = await Assets.load(
          `assets/${card.rank}_of_${card.suit}.jpg`
        );
      } catch (error) {
        console.error("Error loading card texture:", error);
        // Fallback to generated texture if loading fails
        frontCardTexture = generateCardTexture(this.app, card);
      }
      await this.cardAnimator.flipCard(cardSprite, frontCardTexture);
    }
  }

  determineWinner() {
    if (
      this.pointsCalculator.player1points > this.pointsCalculator.player2points
    ) {
      this.winnerText.text = "Player 1 is the winner!";
    } else if (
      this.pointsCalculator.player1points ===
      this.pointsCalculator.player2points
    ) {
      this.winnerText.text = "The game is a draw!";
    } else {
      this.winnerText.text = "Player 2 is the winner!";
    }
    this.winnerText.visible = true;
  }

  showRestartButton() {
    this.restartGameButton = new Button(
      "Restart Game",
      this.knockButton.getButton().position.x + 150,
      this.knockButton.getButton().position.y,
      () => {
        this.restartGame();
      }
    );
    this.restartGameButton.setVisible(true);
    this.gameContainer.addChild(this.restartGameButton.getButton());
  }

  restartGame() {
    // Reset game state and UI elements
    this.gameState = new GameState();
    this.gameState.players = [new Player("Player 1"), new Player("Player 2")];
    this.deck = new Deck(suits, ranks);

    this.player1HandContainer.getContainer().removeChildren();
    this.player2HandContainer.getContainer().removeChildren();
    this.deckContainer.getContainer().removeChildren();
    this.discardPileContainer.getContainer().removeChildren();

    this.deckContainer.initDeck(this.deck.cards);
    this.totalPointsText.text = "Total Points: ";
    this.player2TotalPointsText.text = "Player 2 Total Points: ";
    this.winnerText.text = "";
    this.winnerText.visible = false;

    this.totalPointsText.visible = false;
    this.player2TotalPointsText.visible = false;

    this.startGameButton.setVisible(true);
    this.startGameButton.setInteractive(true);
    this.drawCardActionButton.setVisible(false);
    this.drawFromPileButton.setVisible(false);
    this.knockButton.setVisible(false);
    this.endTurnButton.setVisible(false);
    this.restartGameButton.setVisible(false);

    // Reinitialize the discard pile container
    this.discardPileContainer = new DiscardPileContainer(
      this.app,
      this.gameContainer
    );
    this.deckContainer.addDiscardPile(this.discardPileContainer);

    // Reset the animation and dealing flags
    this.isDealingCards = false;
    this.isAnimating = false;

    // Reinitialize the CardAnimator with the new deck container
    this.cardAnimator = new CardAnimator(
      this.app,
      this.gameContainer,
      this.deckContainer
    );

    // Update the PointsCalculator with the new game state
    this.pointsCalculator = new PointsCalculator(
      this.gameState,
      this.totalPointsText,
      this.player1HandContainer,
      this.player2TotalPointsText,
      this.player2HandContainer
    );

    // Reset the player points references
    this.player1points = this.pointsCalculator.player1points;
    this.player2points = this.pointsCalculator.player2points;

    // Reinitialize the GameController with the new game state and components
    this.gameController = new GameController(
      this.app,
      this.gameContainer,
      this.gameState,
      this.deck,
      this.deckContainer,
      this.player1HandContainer,
      this.player2HandContainer,
      this.cardAnimator,
      this.pointsCalculator,
      this.drawCardActionButton,
      this.drawFromPileButton,
      this.knockButton,
      this.endTurnButton,
      this
    );

    // Reset the turn indicator
    if (this.turnIndicatorText) {
      this.turnIndicatorText.visible = false;
    }

    // Reset event listeners that need references to the new game controller
    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener("contextmenu", (event) => event.preventDefault());

    window.addEventListener("discardCard", (event) => {
      this.gameController.discardCard(event.detail.cardSprite);
      this.pointsCalculator.updateTotalPoints(); // Update total points after discarding a card
    });

    // Listen for player turn changes
    this.gameState.addTurnChangeListener = (callback) => {
      this.gameState._turnChangeCallback = callback;
    };

    // Add knock event listener
    this.gameState.addKnockListener = (callback) => {
      this.gameState._knockCallback = callback;
    };

    this.gameState.addTurnChangeListener(() => {
      this.updateTurnIndicator();
    });

    // Handle knock actions
    this.gameState.addKnockListener(async (playerIndex) => {
      // Show who knocked
      this.turnIndicatorText.text = `Player ${playerIndex + 1} has knocked!`;
      this.turnIndicatorText.style.fill = playerIndex === 0 ? "blue" : "red";

      // Reveal Player 2's cards
      await this.revealPlayer2Cards();

      // Calculate and display points
      this.pointsCalculator.updateTotalPoints();
      this.pointsCalculator.updatePlayer2TotalPoints();
      this.player2TotalPointsText.visible = true;

      // Disable controls
      this.drawCardActionButton.setInteractive(false);
      this.drawFromPileButton.setInteractive(false);
      this.knockButton.setInteractive(false);

      // Determine winner and show restart button
      this.determineWinner();
      this.showRestartButton();
    });
  }

  discardCard(cardSprite) {
    this.gameController.discardCard(cardSprite);
  }

  /**
   * Updates the turn indicator text based on the current player
   */
  updateTurnIndicator() {
    if (!this.turnIndicatorText) return;

    this.turnIndicatorText.visible = true;

    if (this.gameState.currentPlayerIndex === 0) {
      this.turnIndicatorText.text = "Current Turn: Player 1";
      this.turnIndicatorText.style.fill = "white";
    } else {
      this.turnIndicatorText.text = "Current Turn: Player 2";
      this.turnIndicatorText.style.fill = "white";
    }

    // Update position relative to the knock button
    this.turnIndicatorText.position.x = this.knockButton.getButton().position.x + 150;
    this.turnIndicatorText.position.y = this.knockButton.getButton().position.y - 50;
  }

  /**
   * Disables all interactive buttons to prevent interaction during animations
   */
  disableAllButtons() {
    this.startGameButton.setInteractive(false);
    this.drawCardActionButton.setInteractive(false);
    this.drawFromPileButton.setInteractive(false);
    this.knockButton.setInteractive(false);
    this.endTurnButton.setInteractive(false);
    if (this.restartGameButton) {
      this.restartGameButton.setInteractive(false);
    }
  }

  /**
   * Re-enables buttons based on the current game state
   */
  updateButtonStates() {
    // Only update if not currently in an animation
    if (!this.isDealingCards && !this.isAnimating) {
      if (this.gameState.currentPlayerIndex === 0) {
        // Player 1's turn
        this.drawCardActionButton.setInteractive(
          !this.gameState.player1HasDrawn
        );
        this.drawFromPileButton.setInteractive(!this.gameState.player1HasDrawn);
        this.gameController.updateKnockButtonState();
        this.gameController.updateEndTurnButtonState();
      } else {
        // Player 2's turn
        this.drawCardActionButton.setInteractive(false);
        this.drawFromPileButton.setInteractive(false);
        this.knockButton.setInteractive(false);
        this.endTurnButton.setInteractive(false);
      }
    }
  }
}
