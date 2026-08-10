import React from 'react';

export function Stack(): JSX.Element {
  return (
    <div>
      <div className="text-2xl">Dev Space</div>
      <ul>
        <li>Vite - One of the speediest TS builders</li>
        <li>pnpm - Magnitude faster package manager</li>
        <li>ESLint - Code linting and code de-smellifier</li>
        <li>Prettier - A standard opinion on code shaping</li>
      </ul>
      <div className="text-2xl">Included Libraries</div>
      <ul>
        <li>React - For a front-end made of easily manageable blocks</li>
        <li>Tailwind CSS - For some slick, easy, styles!</li>
        <li>React Router - For powerful browser-integrated pathing!</li>
      </ul>
    </div>
  );
}
