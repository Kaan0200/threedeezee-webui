import React, { useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';

import { Splash } from './pages/Splash';
import { Stack } from './pages/Stack';

function App() {
  return (
    <div>
      {/* Header */}
      <header>
        <div className="text-4xl text-center leading-relaxed">
          Vite 🚀 + React 🧱 + Typescript 📘 & <br />
          Tailwindcss 🌠 + React Router & <br />
          Eslint 🔥 + Prettier 💄
        </div>
        <div className="w-full border-b-2">
          <Link className="p-4" to="/">
            Splash & Instructions
          </Link>
          <Link className="p-4" to="/stack">
            Tech Stack
          </Link>
        </div>
      </header>
      {/* Body */}
      <div className="body">
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/stack" element={<Stack />} />
        </Routes>
      </div>
      {/* Footer */}
      <div className="text-center">
        <p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          {' | '}
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </div>
    </div>
  );
}

export default App;
