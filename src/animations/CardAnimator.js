/**
 * CardAnimator.js
 *
 * Handles all card animations throughout the game. This class is responsible for:
 * - Moving cards smoothly between different positions on the screen
 * - Creating flip animations when cards are revealed
 * - Animating cards from the deck to player hands
 * - Animating discarded cards to the discard pile
 * - Providing animation utilities for other game components
 *
 * The CardAnimator creates a more engaging visual experience by smoothly
 * transitioning cards between different states and locations rather than
 * having them instantly appear in their new positions.
 */

import { Ticker } from "pixi.js";

export class CardAnimator {
  constructor(app, gameContainer, deckContainer) {
    this.app = app;
    this.gameContainer = gameContainer;
    this.deckContainer = deckContainer;
  }

  async moveTo(card, targetX, targetY, speed = 3) {
    const startX = card.position.x;
    const startY = card.position.y;
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const steps = distance / speed;
    let step = 0;

    // Ensure the card is added to the display list
    if (!card.parent) {
      this.gameContainer.addChild(card);
    }

    // Bring the card to front in its parent container
    if (card.parent) {
      const parent = card.parent;
      parent.removeChild(card);
      parent.addChild(card);
    }

    return new Promise((resolve) => {
      const ticker = new Ticker();
      ticker.add(() => {
        if (step < steps) {
          const progress = step / steps;
          card.position.x = startX + deltaX * progress;
          card.position.y = startY + deltaY * progress;
          step++;
        } else {
          card.position.set(targetX, targetY);
          ticker.stop();
          resolve();
        }
      });
      ticker.start();
    });
  }

  async animateCardToDiscardPile(card, discardPile) {
    // Temporarily reparent the card to the game container for animation
    if (card.parent) {
      const originalParent = card.parent;
      const globalPosition = card.getGlobalPosition();
      originalParent.removeChild(card);
      this.gameContainer.addChild(card);
      card.position.set(globalPosition.x, globalPosition.y);
    }

    // Set a high zIndex to ensure the card appears above the discard pile during animation
    card.zIndex = 1000;

    // Get the discard pile's global position for accurate targeting
    const discardPileGlobalPosition = discardPile.getGlobalPosition();

    // Target position should be the center of the discard pile in global coordinates
    const targetPositionX = discardPileGlobalPosition.x + 50; // Add half width of card (100/2)
    const targetPositionY = discardPileGlobalPosition.y + 70; // Add half height of card (140/2)

    // Slower animation speed
    await this.moveTo(card, targetPositionX, targetPositionY, 12);
  }

  async animateCardFromDiscardPileToHand(card, targetHand, cardIndex) {
    const discardPile = this.deckContainer
      .getContainer()
      .getChildByName("discardPileContainer");

    const discardPileGlobalPosition = discardPile.getGlobalPosition();
    card.position.set(discardPileGlobalPosition.x, discardPileGlobalPosition.y);

    // Ensure the card is added to the display list
    if (!card.parent) {
      this.gameContainer.addChild(card);
    }

    // Get a reference card from target hand if possible
    let referenceCard = null;
    if (targetHand.children.length > 0) {
      referenceCard = targetHand.children[0];
    }

    // Set high zIndex and enforce size
    card.zIndex = 1000;
    
    // Use reference card dimensions if available
    if (referenceCard) {
      card.scale.set(referenceCard.scale.x, referenceCard.scale.y);
      card.width = referenceCard.width;
      card.height = referenceCard.height;
    } else {
      // Standard dimensions
      card.scale.set(1, 1);
      card.width = 100;
      card.height = 140;
    }

    const targetHandGlobalPosition = targetHand.getGlobalPosition();
    const targetPositionX = targetHandGlobalPosition.x + cardIndex * 60;
    const targetPositionY = targetHandGlobalPosition.y;

    card.position.x = targetPositionX + 60;
    
    // Custom animation that enforces card size
    const startX = card.position.x;
    const startY = card.position.y;
    const deltaX = targetPositionX - startX;
    const deltaY = targetPositionY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const speed = 12;
    const steps = distance / speed;
    let step = 0;

    return new Promise((resolve) => {
      const ticker = new Ticker();
      ticker.add(() => {
        if (step < steps) {
          // Enforce consistent size during each animation frame
          if (referenceCard) {
            card.scale.set(referenceCard.scale.x, referenceCard.scale.y);
            card.width = referenceCard.width;
            card.height = referenceCard.height;
          } else {
            card.scale.set(1, 1);
            card.width = 100;
            card.height = 140;
          }
          
          const progress = step / steps;
          card.position.x = startX + deltaX * progress;
          card.position.y = startY + deltaY * progress;
          step++;
        } else {
          // Final position and size enforcement
          card.position.set(targetPositionX, targetPositionY);
          
          if (referenceCard) {
            card.scale.set(referenceCard.scale.x, referenceCard.scale.y);
            card.width = referenceCard.width;
            card.height = referenceCard.height;
          } else {
            card.scale.set(1, 1);
            card.width = 100;
            card.height = 140;
          }
          
          ticker.stop();
          resolve();
        }
      });
      ticker.start();
    });
  }

  async flipCard(card, frontTexture, flipSpeed = 0.08) {
    let flipping = true;
    let flipProgress = 0;

    return new Promise((resolve) => {
      this.app.ticker.add(() => {
        if (flipping) {
          flipProgress += flipSpeed; // Slower flip animation (0.08 instead of 0.12)
          const scaleX = Math.abs(Math.cos(flipProgress));
          card.scale.set(0.145);
          card.scale.x = 0.145 * scaleX;

          if (flipProgress >= Math.PI / 2 && flipProgress < Math.PI) {
            card.texture = frontTexture;
            card.width = 100;
            card.height = 140;
          }

          if (flipProgress >= Math.PI) {
            card.scale.set(0.145);
            card.width = 100;
            card.height = 140;
            flipping = false;
            resolve();
          }
        }
      });
    });
  }
}
