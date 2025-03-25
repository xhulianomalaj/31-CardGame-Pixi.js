/**
 * GameController.js
 *
 * Implements the core gameplay logic and mechanics for the card game. This class is responsible for:
 * - Managing specific gameplay mechanics (drawing, discarding cards)
 * - Handling the animations for card movement and interactions
 * - Enforcing game rules and turn management
 * - Controlling card dealing and distribution
 * - Managing the player actions and their consequences
 * - Updating the game state during gameplay
 * - Handling the discard pile interactions
 * - Enabling/disabling interactive elements based on valid player actions
 *
 * While the Game class manages overall structure and UI, the GameController focuses
 * specifically on implementing gameplay rules and mechanics. It handles the logic
 * that dictates how cards behave, move, and interact with players.
 */

import { Assets, Ticker } from "pixi.js";
import { makeCardMovable } from "../cardSwapping";
import { generateCardTexture } from "../utils";
import { Player2Controller } from "../ai/Player2Controller";

export class GameController {
  constructor(
    app,
    gameContainer,
    gameState,
    deck,
    deckContainer,
    player1HandContainer,
    player2HandContainer,
    cardAnimator,
    pointsCalculator,
    drawCardActionButton,
    drawFromPileButton,
    knockButton,
    endTurnButton,
    gameInstance
  ) {
    this.app = app;
    this.gameContainer = gameContainer;
    this.gameState = gameState;
    this.deck = deck;
    this.deckContainer = deckContainer;
    this.player1HandContainer = player1HandContainer;
    this.player2HandContainer = player2HandContainer;
    this.cardAnimator = cardAnimator;
    this.pointsCalculator = pointsCalculator;
    this.drawCardActionButton = drawCardActionButton;
    this.drawFromPileButton = drawFromPileButton;
    this.knockButton = knockButton;
    this.endTurnButton = endTurnButton;
    this.gameInstance = gameInstance;

    // Store a reference to the discard pile
    this.discardPile = this.deckContainer
      .getContainer()
      .getChildByName("discardPileContainer");

    // Initialize Player 2 controller
    this.player2Controller = new Player2Controller(
      app,
      gameContainer,
      gameState,
      deck,
      deckContainer,
      player2HandContainer,
      this.discardPile,
      cardAnimator,
      pointsCalculator,
      this
    );

    // Add turn-based game state flags
    this.gameState.currentPlayerIndex = 0;
    this.gameState.player1HasDrawn = false;
    this.gameState.player1HasDiscarded = false;
    this.gameState.player2HasDrawn = false;
    this.gameState.player2HasDiscarded = false;
  }

  async addCardToDiscardPile(cardSprite) {
    if (!cardSprite) {
      return;
    }

    // Use the stored reference to the discard pile
    if (!this.discardPile) {
      return;
    }

    // Set the card to non-interactive
    cardSprite.interactive = false;

    this.discardPile.addChild(cardSprite);
  }

  async addCardToDiscardPileFromDeck() {
    if (this.deckContainer.getContainer().children.length > 0) {
      const card = this.deck.drawCard();
      const cardFromDeck = this.deckContainer
        .getContainer()
        .removeChildAt(this.deckContainer.getContainer().children.length - 1);
      cardFromDeck.position.set(
        this.deckContainer.getContainer().x,
        this.deckContainer.getContainer().y
      );
      this.gameContainer.addChild(cardFromDeck);

      // Load the front texture for the card
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

      // Assign the card to the cardSprite for later reference
      cardFromDeck.card = card;

      const offset = 1; // Adjust this value to control the overlap
      const targetPositionX =
        this.discardPile.position.x + this.discardPile.children.length * offset;
      const targetPositionY =
        this.discardPile.position.y + this.discardPile.children.length * offset;

      // Animate the card moving to the discard pile
      let flipping = true;
      let flipProgress = 0;
      const flipSpeed = 0.12; // Adjust this value to control the speed of the flip

      this.app.ticker.add(() => {
        if (flipping) {
          flipProgress += flipSpeed;
          const scaleX = Math.abs(Math.cos(flipProgress));
          cardFromDeck.scale.set(0.145); // Maintain the original scale
          cardFromDeck.scale.x = 0.145 * scaleX;

          // Move the card towards the target position
          cardFromDeck.position.x += targetPositionX / 100 + 6;

          // Gradually adjust the rotation to ensure the card stays vertical
          cardFromDeck.rotation += (0 - cardFromDeck.rotation) * 0.1;

          if (flipProgress >= Math.PI / 2 && flipProgress < Math.PI) {
            cardFromDeck.texture = frontCardTexture; // Swap texture at halfway point
            cardFromDeck.width = 100; // Explicitly set the width of the front card
            cardFromDeck.height = 140; // Explicitly set the height of the front card
          }

          if (flipProgress >= Math.PI) {
            cardFromDeck.scale.set(0.145); // Ensure the card returns to normal width and height
            cardFromDeck.width = 100; // Explicitly set the width of the front card
            cardFromDeck.height = 140; // Explicitly set the height of the front card
            cardFromDeck.rotation = 0; // Ensure the card stays in a straight vertical position
            flipping = false;

            // Add the card to the discard pile container
            this.addCardToDiscardPile(cardFromDeck);
            cardFromDeck.position.set(targetPositionX, targetPositionY); // Set the position within the discard pile container
            cardFromDeck.zIndex = this.discardPile.children.length; // Set the zIndex to stack from bottom to top

            // Add the card to the game state discard pile
            this.gameState.discardPile.push(cardFromDeck.card);
          }
        }
      });
    }
  }

  async dealCardsOneByOne() {
    // Disable the draw buttons
    this.drawCardActionButton.setInteractive(false);
    this.drawFromPileButton.setInteractive(false);
    this.knockButton.setInteractive(false);
    this.endTurnButton.setInteractive(false);
    let cardCount = 0;
    const totalCards = 6;
    const flipSpeed = 0.08;

    const interval = setInterval(async () => {
      if (
        cardCount < totalCards &&
        this.deckContainer.getContainer().children.length > 0
      ) {
        const currentPlayer = this.gameState.players[cardCount % 2];
        const card = this.deck.drawCard();
        currentPlayer.hand.push(card);

        const cardFromDeck = this.deckContainer
          .getContainer()
          .removeChildAt(this.deckContainer.getContainer().children.length - 1);
        cardFromDeck.position.set(
          this.deckContainer.getContainer().x,
          this.deckContainer.getContainer().y
        );
        this.gameContainer.addChild(cardFromDeck);

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

        const isPlayer1Turn = cardCount % 2 === 0;
        const targetHand = isPlayer1Turn
          ? this.player1HandContainer.getContainer()
          : this.player2HandContainer.getContainer();
        const cardIndex = Math.floor(cardCount / 2);
        const targetPositionX = targetHand.position.x + cardIndex * 60;
        const targetPositionY = targetHand.position.y;

        // Animate the card moving to the position of the hand container
        let flipping = true;
        let flipProgress = 0;

        // Smoother movement speed with easing
        const moveSpeed = 0.075;

        this.app.ticker.add(() => {
          if (flipping) {
            flipProgress += flipSpeed;
            const scaleX = Math.abs(Math.cos(flipProgress));
            cardFromDeck.scale.set(0.145); // Maintain the original scale
            cardFromDeck.scale.x = 0.145 * scaleX;

            // Use easing for smoother movement
            cardFromDeck.position.x +=
              (targetPositionX - cardFromDeck.position.x) * moveSpeed;
            cardFromDeck.position.y +=
              (targetPositionY - cardFromDeck.position.y) * moveSpeed;

            // Gradually adjust the rotation to ensure the card stays vertical
            cardFromDeck.rotation += (0 - cardFromDeck.rotation) * 0.1;

            if (isPlayer1Turn) {
              if (flipProgress >= Math.PI / 2 && flipProgress < Math.PI) {
                cardFromDeck.texture = frontCardTexture; // Swap texture at halfway point
                cardFromDeck.width = 100; // Explicitly set the width of the front card
                cardFromDeck.height = 140; // Explicitly set the height of the front card
              }

              if (flipProgress >= Math.PI) {
                cardFromDeck.scale.set(0.145); // Ensure the card returns to normal width and height
                cardFromDeck.width = 100; // Explicitly set the width of the front card
                cardFromDeck.height = 140; // Explicitly set the height of the front card
                cardFromDeck.rotation = 0; // Ensure the card stays in a straight vertical position
                flipping = false;

                // Add the card to the target hand container
                targetHand.addChild(cardFromDeck);
                cardFromDeck.position.set(cardIndex * 60, 0); // Set the position within the hand container
                cardFromDeck.zIndex = cardIndex; // Set the zIndex to stack from left to right

                // Set the original position for the card
                cardFromDeck.originalPosition = {
                  x: cardFromDeck.position.x,
                  y: cardFromDeck.position.y,
                };
                cardFromDeck.originalZIndex = cardFromDeck.zIndex;

                // Assign the card to the cardSprite for later reference
                cardFromDeck.card = card;
                // Make card visible for Player 1 so AI can estimate hand strength
                cardFromDeck.card.visible = true;

                // Make the card movable for player 1
                if (isPlayer1Turn) {
                  makeCardMovable(cardFromDeck, targetHand);
                }
              }
            } else {
              // For player 2, just move the card without flipping
              cardFromDeck.scale.set(0.145); // Ensure the card returns to normal width and height
              cardFromDeck.rotation = 0; // Ensure the card stays in a straight vertical position
              cardFromDeck.position.x +=
                (targetPositionX - cardFromDeck.position.x) * 0.1;
              cardFromDeck.position.y +=
                (targetPositionY - cardFromDeck.position.y) * 0.1;

              if (flipProgress >= Math.PI) {
                flipping = false;

                // Add the card to the target hand container
                targetHand.addChild(cardFromDeck);
                cardFromDeck.position.set(cardIndex * 60, 0); // Set the position within the hand container
                cardFromDeck.zIndex = cardIndex; // Set the zIndex to stack from left to right

                // Set the original position for the card
                cardFromDeck.originalPosition = {
                  x: cardFromDeck.position.x,
                  y: cardFromDeck.position.y,
                };
                cardFromDeck.originalZIndex = cardFromDeck.zIndex;

                // Assign the card to the cardSprite for later reference
                cardFromDeck.card = card;
              }
            }
          }
        });

        cardCount++;
      } else {
        clearInterval(interval);
        this.pointsCalculator.updateTotalPoints(); // Update total points after all cards are dealt
        
        // Update points for Player 2 as well
        this.pointsCalculator.updatePlayer2TotalPoints();
        
        await this.addCardToDiscardPileFromDeck(); // Ensure the last card is added to the discard pile
        
        // Animation is now complete, update the Game's animation flags
        this.gameInstance.isDealingCards = false;
        this.gameInstance.isAnimating = false;
        
        // Enable all controls for Player 1
        this.drawCardActionButton.setInteractive(true);
        this.drawFromPileButton.setInteractive(true);
        
        // Enable knock and end turn buttons unconditionally for Player 1
        this.knockButton.setInteractive(true);
        this.endTurnButton.setInteractive(true);
        
        console.log("Start game animation completed, buttons enabled");
      }
    }, 250);
  }

  async drawCardForPlayer1() {
    if (
      this.gameState.player1HasDrawn ||
      this.gameState.currentPlayerIndex !== 0 ||
      this.gameInstance.isAnimating
    ) {
      return;
    }

    if (this.deckContainer.getContainer().children.length > 0) {
      // Set animation flag
      this.gameInstance.isAnimating = true;
      
      // Disable all buttons during animation
      this.gameInstance.disableAllButtons();
      
      const card = this.deck.drawCard();
      this.gameState.players[0].hand.push(card); // Add card to player 1's hand

      const cardFromDeck = this.deckContainer
        .getContainer()
        .removeChildAt(this.deckContainer.getContainer().children.length - 1);
      cardFromDeck.position.set(
        this.deckContainer.getContainer().x,
        this.deckContainer.getContainer().y
      );
      this.gameContainer.addChild(cardFromDeck);

      // Load the front texture for the card
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

      // Assign the card to the cardSprite for later reference
      cardFromDeck.card = card;

      // Determine the target hand container and position
      const targetHand = this.player1HandContainer.getContainer();
      const cardIndex = targetHand.children.length;
      const targetPositionX = targetHand.position.x + cardIndex * 60;
      const targetPositionY = targetHand.position.y;

      // Animate the card moving to the position of the hand container
      let moving = true;
      let flipProgress = 0;
      const flipSpeed = 0.08; // Match the dealing animation speed
      const moveSpeed = 0.075; // Match the dealing animation for consistent feel

      this.app.ticker.add(() => {
        if (moving) {
          flipProgress += flipSpeed;
          const scaleX = Math.abs(Math.cos(flipProgress));
          cardFromDeck.scale.set(0.145); // Maintain the original scale
          cardFromDeck.scale.x = 0.145 * scaleX;

          // Use easing for smoother movement
          cardFromDeck.position.x +=
            (targetPositionX - cardFromDeck.position.x) * moveSpeed;
          cardFromDeck.position.y +=
            (targetPositionY - cardFromDeck.position.y) * moveSpeed;

          // Gradually adjust the rotation to ensure the card stays vertical
          cardFromDeck.rotation += (0 - cardFromDeck.rotation) * 0.1;

          if (flipProgress >= Math.PI / 2 && flipProgress < Math.PI) {
            cardFromDeck.texture = frontCardTexture; // Swap texture at halfway point
            cardFromDeck.width = 100; // Explicitly set the width of the front card
            cardFromDeck.height = 140; // Explicitly set the height of the front card
          }

          if (flipProgress >= Math.PI) {
            cardFromDeck.scale.set(0.145); // Ensure the card returns to normal width and height
            cardFromDeck.width = 100; // Explicitly set the width of the front card
            cardFromDeck.height = 140; // Explicitly set the height of the front card
            cardFromDeck.rotation = 0; // Ensure the card stays in a straight vertical position
            moving = false;

            // Add the card to the target hand container
            targetHand.addChild(cardFromDeck);
            cardFromDeck.position.set(cardIndex * 60, 0); // Set the position within the hand container
            cardFromDeck.zIndex = cardIndex; // Set the zIndex to stack from left to right

            // Set the original position for the card
            cardFromDeck.originalPosition = {
              x: cardFromDeck.position.x,
              y: cardFromDeck.position.y,
            };
            cardFromDeck.originalZIndex = cardFromDeck.zIndex;

            // Make the card movable
            makeCardMovable(cardFromDeck, targetHand);

            this.gameState.player1HasDrawn = true;
            this.gameState.player1HasDiscarded = false;

            this.pointsCalculator.updateTotalPoints();

            // Clear animation flag
            this.gameInstance.isAnimating = false;
            
            // Update button states after animation completes
            this.gameInstance.updateButtonStates();
          }
        }
      });
    }
  }

  async drawCardFromDiscardPile() {
    if (
      this.gameState.player1HasDrawn ||
      this.gameState.currentPlayerIndex !== 0 ||
      this.gameInstance.isAnimating
    ) {
      return;
    }

    if (this.discardPile.children.length > 0) {
      // Set animation flag
      this.gameInstance.isAnimating = true;
      
      // Disable all buttons during animation
      this.gameInstance.disableAllButtons();
      
      const cardSprite = this.discardPile.removeChildAt(
        this.discardPile.children.length - 1
      );

      const card = this.gameState.discardPile.pop();

      this.gameState.players[0].hand.push(card); // Add card to player 1's hand

      // Assign the card to the cardSprite for later reference
      cardSprite.card = card;

      // Set the initial position of the card (if needed)
      cardSprite.position.set(
        this.discardPile.position.x,
        this.discardPile.position.y
      );

      // Ensure the card is added to the display list
      if (!cardSprite.parent) {
        this.gameContainer.addChild(cardSprite);
      }

      // Determine the target hand container and position
      const targetHand = this.player1HandContainer.getContainer();
      const cardIndex = targetHand.children.length;

      // Animate the card moving to the position of the hand container
      await this.cardAnimator.animateCardFromDiscardPileToHand(
        cardSprite,
        targetHand,
        cardIndex
      );

      // Ensure the card is added to the target hand container
      targetHand.addChild(cardSprite);
      cardSprite.position.set(cardIndex * 60, 0); // Set the position within the hand container
      cardSprite.zIndex = cardIndex; // Set the zIndex to stack from left to right

      // Set the original position for the card
      cardSprite.originalPosition = {
        x: cardSprite.position.x,
        y: cardSprite.position.y,
      };
      cardSprite.originalZIndex = cardSprite.zIndex;

      // Make the card movable
      makeCardMovable(cardSprite, targetHand);

      // Set the flag to indicate that player 1 has drawn a card
      this.gameState.player1HasDrawn = true;
      this.gameState.player1HasDiscarded = false; // Reset the discard flag

      this.pointsCalculator.updateTotalPoints();

      // Clear animation flag
      this.gameInstance.isAnimating = false;
      
      // Update button states after animation completes
      this.gameInstance.updateButtonStates();
    }
  }

  async discardCard(cardSprite) {
    if (
      !this.gameState.player1HasDrawn ||
      this.gameState.player1HasDiscarded ||
      this.gameState.currentPlayerIndex !== 0 ||
      this.gameInstance.isAnimating
    ) {
      return;
    }

    // Set animation flag
    this.gameInstance.isAnimating = true;
    
    // Disable all buttons during animation
    this.gameInstance.disableAllButtons();

    const offset = 1; // Adjust this value to control the overlap
    const targetPositionX =
      this.discardPile.position.x + this.discardPile.children.length * offset;
    const targetPositionY =
      this.discardPile.position.y + this.discardPile.children.length * offset;

    // Ensure game container can sort children by zIndex
    this.gameContainer.sortableChildren = true;

    // Get the card's global position before removing it from player's hand
    const originalPosition = cardSprite.getGlobalPosition();
    const player1Hand = this.player1HandContainer.getContainer();

    // Remove from player's hand and add to game container to appear above everything
    player1Hand.removeChild(cardSprite);
    this.gameContainer.addChild(cardSprite);

    // Restore position in global coordinates and set high zIndex
    cardSprite.position.set(originalPosition.x, originalPosition.y);
    cardSprite.zIndex = 1000;

    // Get the final target position in global coordinates (where the card should end in the discard pile)
    const discardPileGlobalPosition = this.discardPile.getGlobalPosition();
    const finalGlobalX = discardPileGlobalPosition.x + targetPositionX;
    const finalGlobalY = discardPileGlobalPosition.y + targetPositionY;

    // Create a single smooth animation from the card's current position to the final position in the discard pile
    const startX = cardSprite.position.x;
    const startY = cardSprite.position.y;
    const totalDistance = Math.sqrt(
      Math.pow(finalGlobalX - startX, 2) + Math.pow(finalGlobalY - startY, 2)
    );

    // Use a consistent animation speed - slower for smoother movement
    const animationSpeed = 8;
    const steps = totalDistance / animationSpeed;
    let step = 0;

    return new Promise((resolve) => {
      const ticker = new Ticker();
      ticker.add(() => {
        if (step < steps) {
          const progress = step / steps;

          // Use easeInOut for a smooth acceleration/deceleration
          const easeProgress =
            progress < 0.5
              ? 2 * progress * progress
              : -1 + (4 - 2 * progress) * progress;

          cardSprite.position.x =
            startX + (finalGlobalX - startX) * easeProgress;
          cardSprite.position.y =
            startY + (finalGlobalY - startY) * easeProgress;
          step++;
        } else {
          // Animation complete
          ticker.stop();

          // Remove card from game container
          this.gameContainer.removeChild(cardSprite);

          // Add the card to the discard pile container with correct position
          this.addCardToDiscardPile(cardSprite);
          cardSprite.position.set(targetPositionX, targetPositionY);
          cardSprite.zIndex = this.discardPile.children.length;

          // Add the card to the game state discard pile
          this.gameState.discardPile.push(cardSprite.card);

          // Set flags and update UI
          this.gameState.player1HasDiscarded = true;
          this.pointsCalculator.updateTotalPoints();

          // Adjust positions of remaining cards in player 1's hand
          player1Hand.children.forEach((card, index) => {
            card.position.set(index * 60, 0);
            card.zIndex = index;
            card.originalPosition = { x: card.position.x, y: card.position.y };
            card.originalZIndex = card.zIndex;
          });

          // Clear animation flag
          this.gameInstance.isAnimating = false;
          
          // Update button states after animation completes
          this.gameInstance.updateButtonStates();

          resolve();
        }
      });
      ticker.start();
    });
  }

  updateKnockButtonState() {
    const player1Hand = this.player1HandContainer.getContainer();
    
    // Allow knocking if Player 1 has exactly 3 cards and it's their turn
    if (player1Hand.children.length === 3 && 
        this.gameState.currentPlayerIndex === 0) {
      this.knockButton.setInteractive(true);
    } else {
      this.knockButton.setInteractive(false);
    }
  }
  
  updateEndTurnButtonState() {
    // Get Player 1's hand
    const player1Hand = this.player1HandContainer.getContainer();
    
    // Enable end turn button if it's Player 1's turn AND they don't have 4 cards in hand
    if (this.gameState.currentPlayerIndex === 0 && player1Hand.children.length !== 4) {
      this.endTurnButton.setInteractive(true);
    } else {
      this.endTurnButton.setInteractive(false);
    }
  }
}
