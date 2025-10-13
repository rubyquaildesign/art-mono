# Art Mono

A TypeScript monorepo for generative art and creative coding, powered by Moon build system and featuring a comprehensive WebGPU-enabled art library.

## Quick Start

```bash
# Install dependencies
pnpm install

# Create a new artwork
moon generate template artwork my-new-piece

# Start development server for an artwork
cd apps/my-new-piece
pnpm dev

# Build all projects
moon run :build
```

## Project Structure

- `packages/quail-art/` - Core art library with math, drawing, and WebGPU utilities
- `apps/` - Individual artwork projects
- `templates/` - Project templates for new artworks and libraries
- `tooling/` - Shared build configurations (Vite, etc.)

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 10+
- Moon CLI (`npm install -g @moonrepo/cli`)

### Installation

```bash
# Clone and install
git clone <repo-url>
cd art-mono
pnpm install
```

## Creating Artwork

### Method 1: Using Templates (Recommended)

```bash
# Generate new artwork from template
moon generate template artwork my-piece-name

# Navigate and start development
cd apps/my-piece-name
pnpm dev  # Starts Vite dev server on port 3000
```

### Method 2: Manual Setup

```bash
# Create app directory
mkdir apps/my-artwork
cd apps/my-artwork

# Copy template files or create manually
# Add moon.yml, package.json, src/index.ts, etc.
```

## Development Workflow

### Running Projects

```bash
# Start dev server for specific artwork
cd apps/artwork-name
pnpm dev

# Or using Moon from root
moon run artwork-name:dev
```

### Code Quality

```bash
# Format all code
biome format --write .

# Lint and fix
biome check --write .

# TypeScript build check
tsc --build
```

## Art Library Usage

The quail-art library provides global functions for creative coding:

```typescript
// Math functions
sin(PI/4)  // Math functions in global scope
cos(TAU)   // TAU = 2*PI
vec(100, 50)  // Vector creation

// Drawing utilities
c.hsl(0.6, 0.8, 0.5)  // Color functions
range(10).map(i => vec(i*10, 50))  // D3 range utilities

// Canvas operations
// WebGPU rendering pipeline
// Post-processing effects
```

## Todos for Artwork Iteration Setup

### Infrastructure
- [ ] **Hot Reload Enhancement**: Configure Vite for instant shader/canvas updates
- [ ] **Asset Pipeline**: Set up automatic image/texture loading from `assets/` folders
- [ ] **Export System**: Create unified export commands for high-res renders (PNG/SVG/video)
- [ ] **Shader Development**: Add shader hot-reload and error overlay
- [ ] **Canvas Scaling**: Implement responsive canvas sizing utilities

### Developer Experience  
- [ ] **Live Parameter Control**: Add dat.GUI or similar for real-time parameter tweaking
- [ ] **Preset Management**: Create save/load system for parameter configurations
- [ ] **Animation Recording**: Set up canvas-to-video recording utilities
- [ ] **Screenshot Automation**: One-command high-resolution screenshot export
- [ ] **Performance Monitoring**: Add FPS counter and render time metrics

### Library Enhancements
- [ ] **Color Palette Tools**: Expand color utilities with palette generation
- [ ] **Noise Library**: Add comprehensive noise functions (Perlin, simplex, etc.)
- [ ] **Animation Helpers**: Create easing functions and timeline utilities  
- [ ] **Geometry Primitives**: Add more complex shape generation utilities
- [ ] **Texture Management**: Streamline texture loading and caching

### Project Templates
- [ ] **Canvas 2D Template**: Basic template with 2D canvas setup
- [ ] **WebGL Template**: Template with WebGL/shader boilerplate
- [ ] **Animation Template**: Template with animation loop and controls
- [ ] **Interactive Template**: Template with mouse/keyboard interaction
- [ ] **Generative Template**: Template for algorithm-based art generation

### Workflow Optimization
- [ ] **Gallery Generation**: Auto-generate static gallery from artwork outputs
- [ ] **Batch Processing**: Scripts for generating artwork variations
- [ ] **Version Control**: Git hooks for artwork versioning and thumbnails
- [ ] **Documentation**: Auto-generate docs from artwork parameters
- [ ] **Deployment**: One-command deployment to web hosting

### Advanced Features
- [ ] **Multi-canvas Support**: Framework for multi-panel artworks
- [ ] **Physics Integration**: Add physics engine for dynamic simulations
- [ ] **Audio Reactivity**: Audio analysis and visualization utilities
- [ ] **Machine Learning**: Integration with TensorFlow.js for AI-assisted art
- [ ] **NFT Metadata**: Generate blockchain-compatible metadata

## Commands Reference

```bash
# Development
pnpm dev                    # Start dev server (in artwork directory)
moon run project:dev        # Start specific project dev server

# Building
moon run :build             # Build all projects
moon run project:build      # Build specific project
tsc --build                 # TypeScript compilation

# Code Quality
biome format --write .      # Format code
biome lint --write .        # Lint and fix
biome check --write .       # Format + lint

# Project Management
moon generate template artwork <name>  # Create new artwork
moon check                             # Validate all projects
```

## Architecture

- **Moon**: Project orchestration and task running
- **pnpm**: Package management with workspace support
- **Biome**: Code formatting and linting
- **Vite**: Development server and bundling
- **TypeScript**: Type-safe development with project references
- **WebGPU**: GPU-accelerated graphics rendering