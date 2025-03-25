const suits = ["hearts", "diamonds", "flowers", "spades"];
const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function Card(suitSymbol, suit, rank, id) {
  this.suitSymbol = suitSymbol;
  this.suit = suit;
  this.rank = rank;
  this.id = id;
}

function Player(name) {
  this.name = name;
  this.hand = [];
}

function GameState() {
  this.deck = [];
  this.discardPile = [];
  this.players = [];
  this.currentPlayerIndex = 0;
}

export { suits, ranks, Card, Player, GameState };
