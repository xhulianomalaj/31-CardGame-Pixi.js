/**
 * Button.js
 *
 * Creates interactive button components for the game UI. This class is responsible for:
 * - Creating visually styled buttons with customizable labels
 * - Managing button interactivity states (enabled/disabled)
 * - Handling button visibility
 * - Processing click events and executing corresponding callbacks
 * - Providing consistent button styling throughout the game
 *
 * The Button class provides a reusable component for creating interactive
 * elements that players can click to perform various game actions.
 */

import { Graphics, Text, TextStyle } from "pixi.js";

export class Button {
  constructor(label, x, y, onClick, width = 130, color = "white") {
    this.button = new Graphics();
    this.button.fill(color);
    this.button.roundRect(0, 0, width, 30, 10);
    this.button.fill();
    this.button.position.set(x, y);
    this.button.interactive = true;
    this.button.buttonMode = true;
    this.button.visible = false;

    const textStyle = new TextStyle({
      fill: "black",
      fontSize: 20,
    });
    const buttonText = new Text(label, textStyle);
    buttonText.anchor.set(0.5);
    buttonText.position.set(this.button.width / 2, this.button.height / 2);

    this.button.addChild(buttonText);
    this.button.on("pointerdown", onClick);
  }

  getButton() {
    return this.button;
  }

  setVisible(visible) {
    this.button.visible = visible;
  }

  setInteractive(interactive) {
    this.button.interactive = interactive;
  }
}
