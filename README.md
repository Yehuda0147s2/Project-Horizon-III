# Project Horizon III

PLAY HORIZON III (DUNGEONS & POWERS)

A browser-based 3D action adventure prototype built with React, Vite, TypeScript, and Three.js. The project blends a stylized HUD, building system, inventory workflows, procedural world elements, and a frontier-inspired game loop into a single playable experience.

## Overview

Project Horizon III is a lightweight game prototype focused on:

- 3D player movement and combat feel
- Procedural and handcrafted terrain-inspired world generation
- Build mode and blueprint placement
- Inventory/resource management
- HUD, minimap, hotbar, and game-state UI
- Frontier / dungeon-inspired fantasy presentation

## Features

- 3D world rendering with Three.js
- Player mesh and motion systems
- World generation with terrain-like structures and environment variation
- Hotbar and build blueprint selection
- Inventory and crafting interface
- Standard Frontier gameplay theme
- HUD overlays for stats, resources, and active equipment
- Responsive UI built with React and Tailwind styling

## Tech Stack

- React 19
- TypeScript
- Vite
- Three.js
- Tailwind CSS
- Lucide icons
- Motion UI helpers

## Project Structure

```text
Project-Horizon-III/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/
│   └── game/
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run dev -- --host localhost --port 3000
```

Then open:

```text
http://localhost:3000
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview -- --host localhost --port 4173
```

## Recommended Local Setup (Kali Linux)

```bash
sudo apt update
sudo apt install -y curl ca-certificates build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
cd /path/to/Project-Horizon-III
npm install
npm run dev -- --host localhost --port 3000
```

## Important Note

Use `localhost` instead of a raw LAN IP such as `10.x.x.x` for local browser access. Browsers treat non-local network addresses as insecure and may show a security warning.

## Gameplay Notes

This project is designed as a stylized game prototype and may continue evolving with:

- more biome-based world zones
- richer terrain generation
- improved asset and lighting quality
- deeper combat and progression systems
- more advanced dungeon and frontier integration

## License

This project is currently distributed without a formal license file. If you plan to publish or share it publicly, consider adding a license such as MIT.

## Contributing

Contributions are welcome. Suggested areas include:

- terrain generation improvements
- rendering polish and lighting
- UI/UX enhancements
- gameplay balancing
- world scene transitions and progression

## Contact / Repository

Repository:

```text
https://github.com/Yehuda0147s2/Project-Horizon-III
```

