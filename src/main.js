/**
 * main.js
 *
 * The entry point for the card game application. This file is responsible for:
 * - Initializing the PIXI.js application
 * - Setting up the canvas and DOM elements
 * - Loading the background image or creating a fallback
 * - Creating the main Game instance
 * - Handling application-level setup and configuration
 *
 * This file serves as the bootstrap for the entire application, setting up the
 * foundation upon which all other game components will be built.
 */

import { Application, Sprite, Assets, Graphics } from "pixi.js";
import { Game } from "./game/Game";

(async () => {
  const app = new Application();

  await app.init({
    resizeTo: window,
  });

  app.canvas.style.position = "absolute";
  document.body.appendChild(app.canvas);

  try {
    // Load the green casino background image
    const backgroundTexture = await Assets.load("assets/green-casino.png");
    const backgroundSprite = new Sprite(backgroundTexture);
    backgroundSprite.width = app.screen.width;
    backgroundSprite.height = app.screen.height;
    app.stage.addChild(backgroundSprite);
  } catch (error) {
    console.error("Error loading background image:", error);
    // Fallback to a green background if the image fails to load
    const background = new Graphics();
    background.beginFill(0x006400); // Dark green color
    background.drawRect(0, 0, app.screen.width, app.screen.height);
    background.endFill();
    app.stage.addChild(background);
  }

  const game = new Game(app);
})();
