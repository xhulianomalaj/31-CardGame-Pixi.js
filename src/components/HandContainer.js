/**
 * HandContainer.js
 *
 * Manages the visual representation of a player's hand of cards. This class is responsible for:
 * - Creating a container to hold card sprites for a player
 * - Positioning the hand container at the appropriate screen location
 * - Providing access to the underlying PIXI.js container
 * - Serving as a visual grouping for a player's cards
 *
 * The HandContainer creates a designated area on the screen where a player's
 * cards are displayed and managed as a cohesive unit.
 */

import { Container } from "pixi.js";

export class HandContainer {
  constructor(label, app, gameContainer, x, y) {
    this.container = new Container();
    this.container.label = label;
    this.container.sortableChildren = true;
    this.container.position.set(x, y);
    gameContainer.addChild(this.container);
  }

  getContainer() {
    return this.container;
  }
}
