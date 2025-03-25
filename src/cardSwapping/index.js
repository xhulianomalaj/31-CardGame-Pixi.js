import { Ticker } from "pixi.js";

export function makeCardMovable(cardSprite, handContainer) {
  cardSprite.interactive = true;
  cardSprite.buttonMode = true;

  cardSprite
    .on("pointerdown", onDragStart)
    .on("pointerup", onDragEnd)
    .on("pointerupoutside", onDragEnd)
    .on("pointermove", onDragMove)
    .on("rightclick", () => {
      const event = new CustomEvent("discardCard", { detail: { cardSprite } });
      window.dispatchEvent(event);
    });

  function onDragStart(event) {
    this.data = event.data;
    this.dragging = true;
    this.dragged = false;
    this.zIndex = 1000;
  }

  function onDragEnd() {
    if (this.dragged) {
      snapCardToPosition(this, handContainer);
    } else {
      // Reset position if not dragged
      animateCardToPosition(
        this,
        this.originalPosition.x,
        this.originalPosition.y
      ).then(() => {
        this.zIndex = this.originalZIndex;
      });
    }
    this.dragging = false;
    this.data = null;
  }

  function onDragMove() {
    if (this.dragging) {
      const newPosition = this.data.getLocalPosition(this.parent);
      this.position.x = newPosition.x - this.width / 2;
      this.position.y = newPosition.y - this.height / 2;
      this.dragged = true;
    }
  }
}

export function snapCardToPosition(cardSprite, handContainer) {
  const cardIndex = Math.round(cardSprite.position.x / 60);
  const clampedIndex = Math.max(
    0,
    Math.min(handContainer.children.length - 1, cardIndex)
  );

  handContainer.addChildAt(cardSprite, clampedIndex);

  handContainer.children.forEach((card, index) => {
    animateCardToPosition(card, index * 60, 0).then(() => {
      card.zIndex = index;
      card.originalPosition = { x: card.position.x, y: card.position.y };
      card.originalZIndex = card.zIndex;
    });
  });
}

function animateCardToPosition(card, targetX, targetY, speed = 5) {
  const startX = card.position.x;
  const startY = card.position.y;
  const deltaX = targetX - startX;
  const deltaY = targetY - startY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const steps = distance / speed;
  let step = 0;

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

export function getSuitSymbol(suit) {
  switch (suit) {
    case "hearts":
      return { symbol: "♥" };
    case "diamonds":
      return { symbol: "♦" };
    case "flowers":
      return { symbol: "♣" };
    case "spades":
      return { symbol: "♠" };
    default:
      return { symbol: "" };
  }
}

export const rankOrder = {
  A: 11,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 10,
  Q: 10,
  K: 10,
};

export const getSortedCards = (cards) => {
  return cards.sort((a, b) => rankOrder[a.rank] - rankOrder[b.rank]);
};
