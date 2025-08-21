import React from "react";
import Card from "./Card";

const cards = [
  {
    title: "Get Funds",
    description: "Get testnet funds from the Faucet",
    link: "https://faucet.rootstock.io/",
  },
  {
    title: "Smart Contract",
    description: "Tinker with your smart contract using the Debug Contract tab.",
    link: "/debug",
  },

  {
    title: "Explorer",
    description: "Explore your transactions with the Block Explorer tab.",
    link: "https://explorer.rootstock.io/",
  },
  {
    title: "Rootstock",
    description: "Learn more about Rootstock.",
    link: "https://dev.rootstock.io/",
  },
];

function CardContainer() {
  return (
    <div className="mt-16 flex gap-6 justify-between w-full">
      {cards.map((card, index) => (
        <Card key={card.title} {...card} index={index} />
      ))}
    </div>
  );
}

export default CardContainer;
