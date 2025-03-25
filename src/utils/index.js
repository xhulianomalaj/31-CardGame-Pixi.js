import { Graphics, Text, TextStyle, Container } from "pixi.js";
import { getSuitSymbol } from "../cardSwapping";

// Utility function to generate card textures programmatically
export function generateCardTexture(app, card) {
  // Create a graphics object for the card
  const cardGraphics = new Graphics();

  // Draw card background (white)
  cardGraphics.beginFill(0xffffff);
  cardGraphics.drawRect(0, 0, 100, 140);
  cardGraphics.endFill();

  // Draw card border
  cardGraphics.lineStyle(2, 0x000000);
  cardGraphics.drawRect(0, 0, 100, 140);

  // Set text style for card info
  const textStyle = new TextStyle({
    fontFamily: "Arial",
    fontSize: 20,
    fontWeight: "bold",
    fill:
      card.suit === "hearts" || card.suit === "diamonds" ? 0xff0000 : 0x000000,
  });

  // Add rank to top-left and bottom-right
  const rankText =
    card.rank === "10" ? "10" : card.rank.charAt(0).toUpperCase();
  const topRankText = new Text(rankText, textStyle);
  topRankText.position.set(5, 5);

  const bottomRankText = new Text(rankText, textStyle);
  bottomRankText.position.set(
    95 - bottomRankText.width,
    135 - bottomRankText.height
  );

  // Add suit symbol
  const suitSymbolObj = getSuitSymbol(card.suit);
  const suitText = new Text(suitSymbolObj.symbol, {
    ...textStyle,
    fontSize: 40,
  });
  suitText.position.set(
    (100 - suitText.width) / 2,
    (140 - suitText.height) / 2
  );

  // Create a container to hold all elements
  const cardContainer = new Container();
  cardContainer.addChild(cardGraphics);
  cardContainer.addChild(topRankText);
  cardContainer.addChild(bottomRankText);
  cardContainer.addChild(suitText);

  // Generate texture from the container
  return app.renderer.generateTexture(cardContainer);
}

// Utility function to generate card back texture
export function generateCardBackTexture(app) {
  const cardBackGraphics = new Graphics();
  cardBackGraphics.beginFill(0x0000aa); // Dark blue background
  cardBackGraphics.drawRect(0, 0, 100, 140);
  cardBackGraphics.endFill();

  // Add a decorative pattern
  cardBackGraphics.lineStyle(2, 0xffffff);
  cardBackGraphics.drawRect(5, 5, 90, 130);
  cardBackGraphics.beginFill(0xffffff);
  cardBackGraphics.drawCircle(50, 70, 30);
  cardBackGraphics.endFill();

  return app.renderer.generateTexture(cardBackGraphics);
}
