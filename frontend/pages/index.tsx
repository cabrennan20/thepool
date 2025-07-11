"use client";

import { useState } from "react";
import { useChat } from "ai/react";

export default function Home() {
  const [picks, setPicks] = useState({});
  const { messages, input, handleInputChange, handleSubmit } = useChat({ api: "/api/chat" });

  const games = [
    { id: 1, home: "Patriots", away: "Jets" },
    { id: 2, home: "Bills", away: "Dolphins" },
  ];

  const submitPicks = async () => {
    await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(picks),
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">NFL Picks - Week 1</h1>
      {games.map((game) => (
        <div key={game.id} className="mb-4">
          <p>{game.away} @ {game.home}</p>
          <select
            className="border p-2"
            onChange={(e) => setPicks({ ...picks, [game.id]: e.target.value })}
          >
            <option value="">Select a team</option>
            <option value={game.home}>{game.home}</option>
            <option value={game.away}>{game.away}</option>
          </select>
        </div>
      ))}
      <button onClick={submitPicks} className="bg-blue-600 text-white px-4 py-2 rounded mt-4">
        Submit Picks
      </button>
      <hr className="my-6" />
      <form onSubmit={handleSubmit}>
        <input
          className="border p-2 w-full mb-2"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about your picks..."
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded">Ask</button>
      </form>
      <div className="mt-4">
        {messages.map((m, idx) => (
          <div key={idx} className="mb-2">
            <strong>{m.role}</strong>: {m.content}
          </div>
        ))}
      </div>
    </div>
  );
}
