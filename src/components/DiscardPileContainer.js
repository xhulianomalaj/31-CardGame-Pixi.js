/**
 * DiscardPileContainer.js
 *
 * Manages the visual representation of the discard pile in the game. This class is responsible for:
 * - Creating and positioning a container for discarded cards
 * - Adding discarded cards to the pile with proper positioning
 * - Managing the interactivity state of cards in the discard pile
 * - Providing access to the underlying PIXI.js container
 *
 * The DiscardPileContainer represents the area where players discard unwanted
 * cards, and from which they can potentially draw cards during gameplay.
 */

import { Container } from "pixi.js";

export class DiscardPileContainer {
  constructor(app, gameContainer) {
    this.container = new Container();
    this.container.label = "discardPileContainer";
    this.container.sortableChildren = true; // Enable sorting by zIndex
    this.container.position.set(100, 0);
    gameContainer.addChild(this.container);
  }

  getContainer() {
    return this.container;
  }

  addCard(cardSprite) {
    cardSprite.interactive = false; // Make the card non-interactive
    this.container.addChild(cardSprite);
  }
}
