/**
 * Player2Controller.js
 *
 * Handles the automated gameplay for Player 2 (computer opponent). This class is responsible for:
 * - Managing Player 2's turn sequence
 * - Animating card drawing and discarding
 * - Integrating with the AIPlayer's decision-making logic
 * - Coordinating gameplay actions with the main GameController
 *
 * This controller ensures the computer player follows the same rules and
 * animation sequences as the human player for a consistent experience.
 */

import { Assets, Ticker } from "pixi.js";
import { AIPlayer } from "./AIPlayer";
import { generateCardTexture } from "../utils";

export class Player2Controller {
  constructor(
    app,
    gameContainer,
    gameState,
    deck,
    deckContainer,
    player2HandContainer,
    discardPileContainer,
    cardAnimator,
    pointsCalculator,
    gameController
  ) {
    this.app = app;
    this.gameContainer = gameContainer;
    this.gameState = gameState;
    this.deck = deck;
    this.deckContainer = deckContainer;
    this.player2HandContainer = player2HandContainer;
    this.discardPileContainer = discardPileContainer;
    this.cardAnimator = cardAnimator;
    this.pointsCalculator = pointsCalculator;
    this.gameController = gameController;

    this.aiPlayer = new AIPlayer(gameState);
    this.isProcessingTurn = false;
  }

  /**
   * Performs Player 2's turn (draw + discard)
   */
  async performTurn() {
    if (this.isProcessingTurn) return;

    this.isProcessingTurn = true;
    console.log("Player 2 starting turn");

    // Check if Player 2 should knock at the start of their turn (this is for when they already have a very strong hand)
    const player2Hand = this.gameState.players[1].hand;

    // Only check initial knock if they have exactly 3 cards (the starting hand size)
    if (player2Hand.length === 3) {
      // Calculate current points
      this.pointsCalculator.updatePlayer2TotalPoints();

      // Check if Player 2 should knock with their current hand
      const shouldKnockImmediately = this.aiPlayer.shouldKnock();
      console.log("Player 2 initial knock decision:", shouldKnockImmediately);

      if (shouldKnockImmediately) {
        // Knock without drawing or discarding
        console.log(
          "Player 2 chose to knock immediately with strong initial hand!"
        );
        await this.knockAction();

        // End turn after knocking
        this.isProcessingTurn = false;
        return;
      }
    }

    // If not knocking immediately, draw a card
    await this.drawCard();

    // Wait a moment before deciding next action
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Force recalculation of points after drawing
    this.pointsCalculator.updatePlayer2TotalPoints();

    // Check if Player 2 should knock based on hand strength after drawing
    const shouldKnock = this.aiPlayer.shouldKnock();
    console.log("Player 2 knock decision after drawing:", shouldKnock);

    if (shouldKnock) {
      // Knock instead of discarding
      console.log("Player 2 chose to knock after drawing!");
      await this.knockAction();

      // If Player 2 knocks, their turn ends differently
      this.isProcessingTurn = false;
      return;
    } else {
      // Proceed with normal discard
      console.log("Player 2 chose to discard");
      await this.discardCard();
    }

    // Flag that Player 2's turn is complete
    this.gameState.player2HasDrawn = false;
    this.gameState.player2HasDiscarded = true;
    this.gameState.currentPlayerIndex = 0; // Set back to Player 1

    // Trigger turn change callback if exists
    if (this.gameState._turnChangeCallback) {
      this.gameState._turnChangeCallback();
    }

    this.isProcessingTurn = false;

    // Re-enable Player 1's controls
    this.gameController.drawCardActionButton.setInteractive(true);
    this.gameController.drawFromPileButton.setInteractive(true);
    this.gameController.knockButton.setInteractive(false); // Start with knock disabled
    this.gameController.endTurnButton.setInteractive(false); // Start with end turn disabled

    // Force an update of button states
    this.gameController.updateKnockButtonState();
    this.gameController.updateEndTurnButtonState();
  }

  /**
   * Executes the knock action when Player 2 decides to knock
   */
  async knockAction() {
    console.log("Player 2 has knocked!");

    // Update game state to indicate Player 2 has knocked
    this.gameState.knockedPlayer = 1; // Player 2's index

    // Disable all buttons to prevent further input
    this.gameController.drawCardActionButton.setInteractive(false);
    this.gameController.drawFromPileButton.setInteractive(false);
    this.gameController.knockButton.setInteractive(false);
    this.gameController.endTurnButton.setInteractive(false);

    // Update turn indicator
    if (this.gameState._turnChangeCallback) {
      this.gameState._turnChangeCallback();
    }

    // Calculate and display points
    this.pointsCalculator.updateTotalPoints();
    this.pointsCalculator.updatePlayer2TotalPoints();

    // Call the knock callback
    if (this.gameState._knockCallback) {
      this.gameState._knockCallback(1); // Pass Player 2's index
    }

    return new Promise((resolve) => {
      // Allow time for any animations or notifications
      setTimeout(resolve, 500);
    });
  }

  /**
   * Draws a card from either the deck or discard pile based on AI decision
   */
  async drawCard() {
    // Get the discardPile from the gameController
    const discardPile = this.gameController.discardPile;

    let topDiscardCard = null;

    // Check if there's a card in the discard pile
    if (this.gameState.discardPile.length > 0) {
      topDiscardCard =
        this.gameState.discardPile[this.gameState.discardPile.length - 1];
    }

    // Let the AI decide where to draw from
    const drawFromDiscard =
      this.aiPlayer.shouldDrawFromDiscardPile(topDiscardCard);
    console.log("Player 2 drawing from discard:", drawFromDiscard);

    if (drawFromDiscard && discardPile.children.length > 0) {
      await this.drawFromDiscardPile();
    } else {
      await this.drawFromDeck();
    }

    this.gameState.player2HasDrawn = true;
    this.gameState.player2HasDiscarded = false;

    // Update points calculation
    this.pointsCalculator.updatePlayer2TotalPoints();
  }

  /**
   * Draws a card from the deck
   */
  async drawFromDeck() {
    if (this.deckContainer.getContainer().children.length <= 0) return;

    // Draw a card from the deck
    const card = this.deck.drawCard();
    this.gameState.players[1].hand.push(card);

    // Get the last card sprite from the deck
    const cardFromDeck = this.deckContainer
      .getContainer()
      .removeChildAt(this.deckContainer.getContainer().children.length - 1);

    // Set the card's initial position to the deck
    cardFromDeck.position.set(
      this.deckContainer.getContainer().x,
      this.deckContainer.getContainer().y
    );

    // Make a clean reset of all transformations
    cardFromDeck.scale.set(1, 1);
    cardFromDeck.angle = 0;
    cardFromDeck.skew.set(0, 0);
    cardFromDeck.pivot.set(0, 0);
    cardFromDeck.width = 100;
    cardFromDeck.height = 140;

    // Add to game container for animation
    this.gameContainer.addChild(cardFromDeck);

    // Assign the card data to the sprite
    cardFromDeck.card = card;

    // Determine target position in Player 2's hand
    const player2Hand = this.player2HandContainer.getContainer();
    const cardIndex = player2Hand.children.length;
    const targetPositionX = player2Hand.position.x + cardIndex * 60;
    const targetPositionY = player2Hand.position.y;

    // Get the existing card's dimensions for reference (if there are any)
    let referenceCard = null;
    if (player2Hand.children.length > 0) {
      referenceCard = player2Hand.children[0];
    }

    // Set the dimensions to match reference card BEFORE loading texture
    if (referenceCard) {
      cardFromDeck.scale.set(referenceCard.scale.x, referenceCard.scale.y);
      cardFromDeck.width = referenceCard.width;
      cardFromDeck.height = referenceCard.height;
    }

    // Load back card texture and apply it immediately (no flip)
    try {
      const backCardTexture = await Assets.load("assets/back_card.jpg");
      cardFromDeck.texture = backCardTexture;

      // Apply reference dimensions again after texture change
      if (referenceCard) {
        cardFromDeck.scale.set(referenceCard.scale.x, referenceCard.scale.y);
        cardFromDeck.width = referenceCard.width;
        cardFromDeck.height = referenceCard.height;
      } else {
        cardFromDeck.scale.set(1, 1);
        cardFromDeck.width = 100;
        cardFromDeck.height = 140;
      }

      // Standard animation without flipping
      let moving = true;
      const startX = cardFromDeck.position.x;
      const startY = cardFromDeck.position.y;
      const endX = targetPositionX;
      const endY = targetPositionY;
      const steps = 30;
      let step = 0;

      return new Promise((resolve) => {
        const ticker = new Ticker();
        ticker.add(() => {
          if (moving && step < steps) {
            // Apply reference dimensions during each frame of animation
            if (referenceCard) {
              cardFromDeck.scale.set(
                referenceCard.scale.x,
                referenceCard.scale.y
              );
              cardFromDeck.width = referenceCard.width;
              cardFromDeck.height = referenceCard.height;
            } else {
              cardFromDeck.scale.set(1, 1);
              cardFromDeck.width = 100;
              cardFromDeck.height = 140;
            }

            const progress = step / steps;
            const easeProgress =
              progress < 0.5
                ? 2 * progress * progress
                : -1 + (4 - 2 * progress) * progress;

            cardFromDeck.position.x = startX + (endX - startX) * easeProgress;
            cardFromDeck.position.y = startY + (endY - startY) * easeProgress;
            step++;
          } else {
            // Animation complete - set final dimensions BEFORE removing from container
            if (referenceCard) {
              cardFromDeck.scale.set(
                referenceCard.scale.x,
                referenceCard.scale.y
              );
              cardFromDeck.width = referenceCard.width;
              cardFromDeck.height = referenceCard.height;
            } else {
              cardFromDeck.scale.set(1, 1);
              cardFromDeck.width = 100;
              cardFromDeck.height = 140;
            }

            // Remove from game container
            this.gameContainer.removeChild(cardFromDeck);

            // Create a new local reference to the final card appearance
            const finalCard = cardFromDeck;

            // Apply dimensions one final time
            if (referenceCard) {
              finalCard.scale.set(referenceCard.scale.x, referenceCard.scale.y);
              finalCard.width = referenceCard.width;
              finalCard.height = referenceCard.height;
            } else {
              finalCard.scale.set(1, 1);
              finalCard.width = 100;
              finalCard.height = 140;
            }

            player2Hand.addChild(finalCard);
            finalCard.position.set(cardIndex * 60, 0);
            finalCard.zIndex = cardIndex;

            finalCard.originalPosition = {
              x: finalCard.position.x,
              y: finalCard.position.y,
            };
            finalCard.originalZIndex = finalCard.zIndex;

            moving = false;
            ticker.stop();
            resolve();
          }
        });
        ticker.start();
      });
    } catch (error) {
      console.error("Error loading back card texture:", error);

      // Fallback to the original non-flipping animation if texture loading fails
      let moving = true;
      const startX = cardFromDeck.position.x;
      const startY = cardFromDeck.position.y;
      const endX = targetPositionX;
      const endY = targetPositionY;
      const steps = 30;
      let step = 0;

      return new Promise((resolve) => {
        const ticker = new Ticker();
        ticker.add(() => {
          if (moving && step < steps) {
            // Apply reference dimensions during each frame
            if (referenceCard) {
              cardFromDeck.scale.set(
                referenceCard.scale.x,
                referenceCard.scale.y
              );
              cardFromDeck.width = referenceCard.width;
              cardFromDeck.height = referenceCard.height;
            } else {
              cardFromDeck.scale.set(1, 1);
              cardFromDeck.width = 100;
              cardFromDeck.height = 140;
            }

            const progress = step / steps;
            const easeProgress =
              progress < 0.5
                ? 2 * progress * progress
                : -1 + (4 - 2 * progress) * progress;

            cardFromDeck.position.x = startX + (endX - startX) * easeProgress;
            cardFromDeck.position.y = startY + (endY - startY) * easeProgress;
            step++;
          } else {
            // Animation complete - set final dimensions BEFORE removing from container
            if (referenceCard) {
              cardFromDeck.scale.set(
                referenceCard.scale.x,
                referenceCard.scale.y
              );
              cardFromDeck.width = referenceCard.width;
              cardFromDeck.height = referenceCard.height;
            } else {
              cardFromDeck.scale.set(1, 1);
              cardFromDeck.width = 100;
              cardFromDeck.height = 140;
            }

            this.gameContainer.removeChild(cardFromDeck);

            // Create a new local reference to the final card appearance
            const finalCard = cardFromDeck;

            // Apply dimensions one final time
            if (referenceCard) {
              finalCard.scale.set(referenceCard.scale.x, referenceCard.scale.y);
              finalCard.width = referenceCard.width;
              finalCard.height = referenceCard.height;
            } else {
              finalCard.scale.set(1, 1);
              finalCard.width = 100;
              finalCard.height = 140;
            }

            player2Hand.addChild(finalCard);
            finalCard.position.set(cardIndex * 60, 0);
            finalCard.zIndex = cardIndex;

            finalCard.originalPosition = {
              x: finalCard.position.x,
              y: finalCard.position.y,
            };
            finalCard.originalZIndex = finalCard.zIndex;

            moving = false;
            ticker.stop();
            resolve();
          }
        });
        ticker.start();
      });
    }
  }

  /**
   * Draws a card from the discard pile
   */
  async drawFromDiscardPile() {
    // Get the discardPile from the gameController
    const discardPile = this.gameController.discardPile;

    if (discardPile.children.length <= 0) return;

    // Get the top card from the discard pile
    const cardSprite = discardPile.removeChildAt(
      discardPile.children.length - 1
    );

    // Get the card data
    const card = this.gameState.discardPile.pop();
    this.gameState.players[1].hand.push(card);

    // Assign the card to the cardSprite for reference
    cardSprite.card = card;

    // Determine target position in Player 2's hand
    const player2Hand = this.player2HandContainer.getContainer();
    const cardIndex = player2Hand.children.length;

    // Get the existing card's dimensions for reference (if there are any)
    let referenceCard = null;
    if (player2Hand.children.length > 0) {
      referenceCard = player2Hand.children[0];
    }

    // Match the existing card dimensions if available before animation
    if (referenceCard) {
      // Keep exact same scale and dimensions as reference
      cardSprite.scale.set(referenceCard.scale.x, referenceCard.scale.y);
      cardSprite.width = referenceCard.width;
      cardSprite.height = referenceCard.height;
    } else {
      // Standard dimensions
      cardSprite.scale.set(1, 1);
      cardSprite.width = 100;
      cardSprite.height = 140;
    }

    // Animate the card from discard pile to Player 2's hand
    await this.cardAnimator.animateCardFromDiscardPileToHand(
      cardSprite,
      player2Hand,
      cardIndex
    );

    // Reapply reference dimensions before texture change
    if (referenceCard) {
      cardSprite.scale.set(referenceCard.scale.x, referenceCard.scale.y);
      cardSprite.width = referenceCard.width;
      cardSprite.height = referenceCard.height;
    } else {
      cardSprite.scale.set(1, 1);
      cardSprite.width = 100;
      cardSprite.height = 140;
    }

    // Load the back card texture to hide the card's face
    try {
      const backCardTexture = await Assets.load("assets/back_card.jpg");

      // Add flip animation when changing to back texture
      let flipping = true;
      let flipProgress = 0;
      const flipSpeed = 0.08; // Same as player 1 flip speed

      await new Promise((resolveFlip) => {
        const flipTicker = new Ticker();
        flipTicker.add(() => {
          if (flipping) {
            flipProgress += flipSpeed;
            const scaleX = Math.abs(Math.cos(flipProgress));

            // Use reference scale for consistent appearance
            if (referenceCard) {
              cardSprite.scale.set(
                referenceCard.scale.x,
                referenceCard.scale.y
              );
              cardSprite.scale.x = referenceCard.scale.x * scaleX;
            } else {
              cardSprite.scale.set(0.145);
              cardSprite.scale.x = 0.145 * scaleX;
            }

            if (flipProgress >= Math.PI / 2 && flipProgress < Math.PI) {
              cardSprite.texture = backCardTexture;

              // Apply reference dimensions at texture swap
              if (referenceCard) {
                cardSprite.width = referenceCard.width;
                cardSprite.height = referenceCard.height;
              } else {
                cardSprite.width = 100;
                cardSprite.height = 140;
              }
            }

            if (flipProgress >= Math.PI) {
              // Set final scale after flip
              if (referenceCard) {
                cardSprite.scale.set(
                  referenceCard.scale.x,
                  referenceCard.scale.y
                );
                cardSprite.width = referenceCard.width;
                cardSprite.height = referenceCard.height;
              } else {
                cardSprite.scale.set(0.145);
                cardSprite.width = 100;
                cardSprite.height = 140;
              }

              flipping = false;
              flipTicker.stop();
              resolveFlip();
            }
          }
        });
        flipTicker.start();
      });

      // Match dimensions again after flip animation
      if (referenceCard) {
        cardSprite.scale.set(referenceCard.scale.x, referenceCard.scale.y);
        cardSprite.width = referenceCard.width;
        cardSprite.height = referenceCard.height;
      } else {
        cardSprite.scale.set(1, 1);
        cardSprite.width = 100;
        cardSprite.height = 140;
      }
    } catch (error) {
      console.error("Error loading card back texture:", error);
    }

    // Create a new local reference to the final card for the hand
    const finalCard = cardSprite;

    // Ensure card is added to Player 2's hand with exact reference dimensions
    player2Hand.addChild(finalCard);

    // Apply final dimensions one more time to ensure consistency
    if (referenceCard) {
      finalCard.scale.set(referenceCard.scale.x, referenceCard.scale.y);
      finalCard.width = referenceCard.width;
      finalCard.height = referenceCard.height;
    } else {
      finalCard.scale.set(1, 1);
      finalCard.width = 100;
      finalCard.height = 140;
    }

    finalCard.position.set(cardIndex * 60, 0);
    finalCard.zIndex = cardIndex;
    finalCard.originalPosition = {
      x: finalCard.position.x,
      y: finalCard.position.y,
    };
    finalCard.originalZIndex = finalCard.zIndex;
  }

  /**
   * Discards a card from Player 2's hand
   */
  async discardCard() {
    const player2Hand = this.player2HandContainer.getContainer();
    if (player2Hand.children.length <= 0) return;

    // Get all cards in Player 2's hand
    const handCards = this.gameState.players[1].hand;

    // Let the AI decide which card to discard
    const cardIndexToDiscard = this.aiPlayer.selectCardToDiscard(handCards);

    if (cardIndexToDiscard === -1) return;

    // Get the card sprite to discard
    const cardSprite = player2Hand.children[cardIndexToDiscard];

    // Ensure game container can sort children by zIndex
    this.gameContainer.sortableChildren = true;

    // Get the card's position before removing from hand
    const originalPosition = cardSprite.getGlobalPosition();

    // Remove from Player 2's hand and add to game container for animation
    player2Hand.removeChild(cardSprite);
    this.gameContainer.addChild(cardSprite);

    // Restore position and set high zIndex to appear above everything
    cardSprite.position.set(originalPosition.x, originalPosition.y);
    cardSprite.zIndex = 1000;

    // Load the front texture for the card being discarded (reveal it)
    let frontCardTexture;
    try {
      frontCardTexture = await Assets.load(
        `assets/${cardSprite.card.rank}_of_${cardSprite.card.suit}.jpg`
      );

      // First flip the card to reveal it
      let flipping = true;
      let flipProgress = 0;
      const flipSpeed = 0.08; // Same as player 1 flip speed

      await new Promise((resolveFlip) => {
        const flipTicker = new Ticker();
        flipTicker.add(() => {
          if (flipping) {
            flipProgress += flipSpeed;
            const scaleX = Math.abs(Math.cos(flipProgress));
            cardSprite.scale.set(0.145);
            cardSprite.scale.x = 0.145 * scaleX;

            if (flipProgress >= Math.PI / 2 && flipProgress < Math.PI) {
              cardSprite.texture = frontCardTexture;
              cardSprite.width = 100;
              cardSprite.height = 140;
            }

            if (flipProgress >= Math.PI) {
              cardSprite.scale.set(0.145);
              cardSprite.width = 100;
              cardSprite.height = 140;
              flipping = false;
              flipTicker.stop();
              resolveFlip();
            }
          }
        });
        flipTicker.start();
      });
    } catch (error) {
      console.error("Error loading card texture:", error);
      frontCardTexture = generateCardTexture(this.app, cardSprite.card);
      cardSprite.texture = frontCardTexture;
    }

    // Set card dimensions after changing texture
    cardSprite.width = 100;
    cardSprite.height = 140;

    // Get the discardPile from the gameController
    const discardPile = this.gameController.discardPile;

    // Calculate target position in discard pile
    const offset = 1;
    const targetPositionX =
      discardPile.position.x + discardPile.children.length * offset;
    const targetPositionY =
      discardPile.position.y + discardPile.children.length * offset;

    // Get final target in global coordinates
    const discardPileGlobalPosition = discardPile.getGlobalPosition();
    const finalGlobalX = discardPileGlobalPosition.x + targetPositionX;
    const finalGlobalY = discardPileGlobalPosition.y + targetPositionY;

    // Create a smooth animation
    const startX = cardSprite.position.x;
    const startY = cardSprite.position.y;
    const totalDistance = Math.sqrt(
      Math.pow(finalGlobalX - startX, 2) + Math.pow(finalGlobalY - startY, 2)
    );

    // Use a consistent animation speed
    const animationSpeed = 8;
    const steps = totalDistance / animationSpeed;
    let step = 0;

    return new Promise((resolve) => {
      const ticker = new Ticker();
      ticker.add(() => {
        if (step < steps) {
          const progress = step / steps;

          // Use easeInOut for smooth acceleration/deceleration
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

          // Add to discard pile
          this.gameController.addCardToDiscardPile(cardSprite);
          cardSprite.position.set(targetPositionX, targetPositionY);
          cardSprite.zIndex = discardPile.children.length;

          // Remove card from Player 2's hand array
          this.gameState.players[1].hand.splice(cardIndexToDiscard, 1);

          // Add card to the game state discard pile
          this.gameState.discardPile.push(cardSprite.card);

          // Adjust positions of remaining cards in Player 2's hand
          player2Hand.children.forEach((card, index) => {
            card.position.set(index * 60, 0);
            card.zIndex = index;
            card.originalPosition = { x: card.position.x, y: card.position.y };
            card.originalZIndex = card.zIndex;
          });

          resolve();
        }
      });
      ticker.start();
    });
  }
}
