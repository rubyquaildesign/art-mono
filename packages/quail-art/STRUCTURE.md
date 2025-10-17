# Quail-Art Package Structure

This document provides an overview of the reorganized package structure.

## Directory Layout

```
packages/quail-art/
├── src/
│   ├── index.ts                    # Main entry point - exports all public APIs
│   ├── creative-coding.ts          # Optional global scope injection (math only)
│   │
│   ├── core/                       # Core mathematical utilities
│   │   ├── index.ts                # Core module exports
│   │   ├── vec.ts                  # Vec class for 2D vectors
│   │   ├── matrices.ts             # Matrix operations
│   │   ├── colour.ts               # Color palettes and utilities
│   │   ├── xy-point-helpers.ts     # Point helper functions
│   │   └── maths.ts                # Mathematical utilities (re-exports)
│   │
│   ├── geometry/                   # Geometry and drawing utilities
│   │   ├── index.ts                # Geometry module exports
│   │   ├── draw.ts                 # Drawing functions (drawLoop, drawShape, etc.)
│   │   ├── path.ts                 # B-spline and path operations
│   │   ├── line.ts                 # Line utilities
│   │   ├── clipping.ts             # Clipping operations
│   │   ├── pg.ts                   # Polygon geometry
│   │   └── djikstra.ts             # Pathfinding algorithm
│   │
│   ├── canvas/                     # 2D Canvas rendering
│   │   ├── index.ts                # Canvas module exports
│   │   ├── setup.ts                # Explicit canvas setup functions
│   │   ├── creative-coding.ts      # Canvas + globals (convenience mode)
│   │   └── canvas.ts               # (Old file - deprecated)
│   │
│   ├── webgpu/                     # WebGPU rendering
│   │   ├── index.ts                # WebGPU module exports
│   │   ├── context-setup.ts        # Explicit WebGPU setup functions
│   │   ├── creative-coding.ts      # WebGPU + globals (convenience mode)
│   │   ├── webgpu-utils.ts         # WebGPU utilities
│   │   ├── resources.ts            # Resource management
│   │   ├── createPipeline.ts       # Pipeline creation helpers
│   │   ├── blur-filter.ts          # Blur post-processing
│   │   ├── color-correction.ts     # Color correction
│   │   ├── copy-pass.ts            # Copy operations
│   │   ├── post-processing.ts      # Post-processing pipeline
│   │   ├── usage-enums.ts          # Usage enumeration helpers
│   │   ├── vert-module.ts          # Vertex shader module
│   │   ├── shaders/                # Shader code
│   │   ├── setup.ts                # (Old file - deprecated)
│   │   └── webgpu.ts               # (Old file - deprecated)
│   │
│   ├── lib/                        # (Old structure - deprecated)
│   ├── entry/                      # (Old structure - deprecated)
│   └── clip/                       # Clipping utilities
│
├── package.json                    # Package configuration with subpath exports
├── README.md                       # Main documentation
├── MIGRATION.md                    # Migration guide
└── STRUCTURE.md                    # This file
```

## Module Organization

### Core Module (`/core`)

**Purpose:** Fundamental mathematical types and utilities

**Exports:**
- `Vec` - 2D vector class with arithmetic, rotation, normalization
- `Matrix` - Matrix operations and transformations
- Color constants and palettes
- XY point helper functions
- Mathematical utilities (mod, etc.)

**When to use:** When you need vectors, matrices, or mathematical operations

### Geometry Module (`/geometry`)

**Purpose:** Drawing and geometric operations

**Exports:**
- Drawing functions: `drawLoop`, `drawShape`, `drawLine`, `drawDot`
- Bezier operations: `drawBezierLoop`, `drawBezierShape`
- B-spline functions: `bSpline`, `bsplineMat`
- Path operations and clipping
- Dijkstra pathfinding

**When to use:** When you need to draw shapes or work with paths

### Canvas Module (`/canvas`)

**Purpose:** 2D canvas rendering setup and utilities

**Exports:**
- `setupCanvas2D()` - Initialize canvas context
- `setCanvasSize()` - Resize canvas
- `Canvas2DContext` type
- Creative coding mode with globals

**When to use:** For 2D canvas-based artworks

### WebGPU Module (`/webgpu`)

**Purpose:** WebGPU rendering setup and utilities

**Exports:**
- `setupWebGPU()` - Initialize WebGPU device
- `setupWebGPUCanvas()` - Full canvas + WebGPU setup
- `resizeWebGPUCanvas()` - Resize handling
- Pipeline utilities
- Post-processing filters
- Creative coding mode with globals

**When to use:** For WebGPU-based artworks or 3D rendering

## Import Patterns

### Pattern 1: Main Entry (Kitchen Sink)

Import everything from the main entry point:

```typescript
import { Vec, setupCanvas2D, drawLoop } from '@rubyquail-art/quail-art';
```

**Pros:** Simple, one import
**Cons:** Larger bundle if you only need a few things
**Best for:** Small projects, prototypes

### Pattern 2: Module-Specific Imports

Import from specific modules:

```typescript
import { Vec } from '@rubyquail-art/quail-art/core';
import { drawLoop } from '@rubyquail-art/quail-art/geometry';
import { setupCanvas2D } from '@rubyquail-art/quail-art/canvas';
```

**Pros:** Explicit, tree-shakeable, clear dependencies
**Cons:** More imports
**Best for:** Production code, libraries

### Pattern 3: Creative Coding Mode

Use side-effect imports for global scope:

```typescript
import '@rubyquail-art/quail-art/canvas/creative-coding';
// Globals: canvas, ctx, width, height, r, d, vec, sin, cos, etc.
```

**Pros:** Minimal boilerplate, p5.js-like convenience
**Cons:** Global scope pollution, not suitable for libraries
**Best for:** Quick sketches, creative coding experiments

## Design Principles

### 1. Explicit by Default

All functionality is explicitly exported and imported. No hidden global state or automatic setup.

### 2. Opt-in Convenience

Global scope injection is available but must be explicitly imported via creative-coding modules.

### 3. Modular

Clear separation of concerns:
- Core: Math and primitives
- Geometry: Drawing operations
- Canvas: 2D rendering system
- WebGPU: 3D/compute rendering system

### 4. TypeScript First

Full type definitions for all modules and functions. No implicit `any` types.

### 5. Backward Compatible (Transitional)

Old structure still exists (deprecated) to ease migration. Will be removed in v1.0.

## Entry Points

The package.json defines these entry points:

```json
{
  "exports": {
    ".": "./src/index.ts",                              // Main entry
    "./core": "./src/core/index.ts",                    // Core utilities
    "./geometry": "./src/geometry/index.ts",            // Geometry/drawing
    "./canvas": "./src/canvas/index.ts",                // Canvas setup
    "./webgpu": "./src/webgpu/index.ts",                // WebGPU setup
    "./creative-coding": "./src/creative-coding.ts",    // Global math
    "./canvas/creative-coding": "./src/canvas/creative-coding.ts",   // Canvas + globals
    "./webgpu/creative-coding": "./src/webgpu/creative-coding.ts"    // WebGPU + globals
  }
}
```

## Future Improvements

Potential areas for further cleanup:

1. **Remove deprecated files** - Remove old `lib/`, `entry/` directories in v1.0
2. **Build pipeline** - Add build step to compile to JS for distribution
3. **Tree shaking** - Ensure optimal tree-shaking for production builds
4. **Documentation** - Add JSDoc comments to all public APIs
5. **Examples** - Create example projects for each usage pattern
6. **Tests** - Add unit tests for core functionality
7. **Clip module** - Integrate or reorganize clip/ directory
8. **CommonJS** - Consider dual ESM/CJS distribution if needed

## File Naming Conventions

- **index.ts** - Module entry point, barrel exports
- **setup.ts** - Setup and initialization functions
- **creative-coding.ts** - Global scope injection (convenience mode)
- **kebab-case.ts** - Regular module files
- **PascalCase.ts** - Files exporting primarily a single class

## Dependencies

### Runtime Dependencies
- `d3` - For ranges, paths, and utilities
- `mathjs` - For matrix operations

### Dev Dependencies
- `@types/d3` - TypeScript types for D3
- `@webgpu/types` - TypeScript types for WebGPU
- `webgpu-utils` - WebGPU utility library
- `rollup` - For bundling
- `wesl-plugin` - For WGSL shader loading

## Compatibility

- **TypeScript:** 5.0+
- **Node.js:** 18+ (ESM only)
- **Browsers:** Modern browsers with ES2020+ support
- **WebGPU:** Chrome 113+, Edge 113+, Safari TP (for WebGPU features)
