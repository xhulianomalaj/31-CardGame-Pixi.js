/**
 * DeckContainer.js
 *
 * Manages the visual representation of the card deck in the game. This class is responsible for:
 * - Creating and positioning a visual container for the deck
 * - Initializing card sprites for the deck with back-facing textures
 * - Loading card textures from assets or generating fallback textures
 * - Creating a visual stack effect for cards in the deck
 * - Managing the discard pile as a sub-container
 * - Providing access to the underlying PIXI.js container
 *
 * The DeckContainer provides the visual representation of the card deck that
 * players can interact with during gameplay, serving as the source from which
 * new cards are drawn.
 */

import { Container, Sprite, Assets } from "pixi.js";
import { generateCardBackTexture } from "../utils";

export class DeckContainer {
  constructor(app, gameContainer, deck) {
    this.app = app;
    this.container = new Container();
    this.container.label = "deckContainer";
    this.container.sortableChildren = true;
    this.initDeck(deck);
    this.container.position.set(
      (app.screen.width - 100) / 2,
      (app.screen.height - 150) / 2 - 30
    );
    gameContainer.addChild(this.container);
  }

  async initDeck(deck) {
    try {
      // Load the back card texture from the assets folder
      const backCardTexture = await Assets.load("assets/back_card.jpg");

      for (let i = 0; i < deck.length; i++) {
        const stackedCardSprite = new Sprite(backCardTexture);
        stackedCardSprite.width = 100;
        stackedCardSprite.height = 140;
        stackedCardSprite.position.set(i * 0.7, i * 0.2);
        stackedCardSprite.zIndex = i;
        this.container.addChild(stackedCardSprite);
      }
    } catch (error) {
      console.error("Error loading back card texture:", error);
      // Fallback to generated texture if loading fails
      const backCardTexture = generateCardBackTexture(this.app);

      for (let i = 0; i < deck.length; i++) {
        const stackedCardSprite = new Sprite(backCardTexture);
        stackedCardSprite.width = 100;
        stackedCardSprite.height = 140;
        stackedCardSprite.position.set(i * 0.7, i * 0.2);
        stackedCardSprite.zIndex = i;
        this.container.addChild(stackedCardSprite);
      }
    }
  }

  getContainer() {
    return this.container;
  }

  addDiscardPile(discardPileContainer) {
    this.container.addChild(discardPileContainer.getContainer());
  }
}
