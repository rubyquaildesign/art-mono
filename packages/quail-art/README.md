# @rubyquail-art/quail-art

A creative coding library for generative art with TypeScript, providing mathematical utilities, drawing functions, canvas operations, WebGPU rendering, and color manipulation tools.

## Installation

```bash
pnpm add @rubyquail-art/quail-art
```

## New Modular Architecture

The library has been reorganized into clear, modular components:

```
@rubyquail-art/quail-art
├── core/          # Mathematical utilities (Vec, Matrix, color)
├── geometry/      # Drawing and path functions
├── canvas/        # 2D Canvas rendering
└── webgpu/        # WebGPU rendering
```

## Usage

### Option 1: Explicit Imports (Recommended for Production)

Import only what you need with clear, explicit imports:

```typescript
import { Vec, setupCanvas2D } from '@rubyquail-art/quail-art';

// Setup canvas explicitly
const { canvas, ctx, width, height } = setupCanvas2D();

// Use Vec class
const v = new Vec(100, 200);
```

### Option 2: Creative Coding Mode (Convenient for Sketches)

For quick sketches and creative coding, use the convenience imports that inject common functions into global scope:

```typescript
// For Canvas 2D sketches
import '@rubyquail-art/quail-art/canvas/creative-coding';

// Now you have globals: canvas, ctx, width, height, r, d, vec, sin, cos, etc.
const position = vec(width / 2, height / 2);
ctx.fillStyle = c.red;
```

```typescript
// For WebGPU sketches
import '@rubyquail-art/quail-art/webgpu/creative-coding';

// Now you have globals: device, adapter, canvas, ctx, width, height, renderTarget, etc.
const pipeline = device.createRenderPipeline({...});
```

## Subpath Exports

The library provides multiple entry points:

```typescript
// Main entry - all exports
import { Vec, setupCanvas2D, setupWebGPU } from '@rubyquail-art/quail-art';

// Core utilities only
import { Vec, Matrix } from '@rubyquail-art/quail-art/core';

// Geometry and drawing
import { drawLoop, drawShape } from '@rubyquail-art/quail-art/geometry';

// Canvas 2D
import { setupCanvas2D } from '@rubyquail-art/quail-art/canvas';

// WebGPU
import { setupWebGPU, setupWebGPUCanvas } from '@rubyquail-art/quail-art/webgpu';

// Creative coding (global scope injection)
import '@rubyquail-art/quail-art/creative-coding'; // Math functions only
import '@rubyquail-art/quail-art/canvas/creative-coding'; // Canvas + math
import '@rubyquail-art/quail-art/webgpu/creative-coding'; // WebGPU + math
```

## API Examples

### Canvas 2D

```typescript
import { setupCanvas2D, Vec, drawLoop } from '@rubyquail-art/quail-art';

// Explicit setup
const { canvas, ctx, width, height } = setupCanvas2D({
  canvasSelector: '#my-canvas',
  width: 800,
  height: 600
});

// Draw something
ctx.fillStyle = '#ff6188';
const points: [number, number][] = [
  [100, 100],
  [200, 150],
  [150, 200]
];
drawLoop(points, true, ctx, 'fill');
```

### WebGPU

```typescript
import { setupWebGPUCanvas } from '@rubyquail-art/quail-art';

// Setup WebGPU
const gpu = await setupWebGPUCanvas({
  canvasSelector: '#canvas',
  width: 800,
  height: 600
});

// Use the context
const { device, renderTarget, queue } = gpu;

// Create render pipeline
const pipeline = device.createRenderPipeline({...});
```

### Vector Mathematics

```typescript
import { Vec } from '@rubyquail-art/quail-art';

const v1 = new Vec(100, 50);
const v2 = new Vec(50, 100);

const sum = v1.add(v2);
const normalized = v1.norm();
const rotated = v1.rotate(Math.PI / 4);
const distance = v1.dist(v2);
```

## Migration Guide

### From Old Structure

**Old (global injection everywhere):**
```typescript
import '../lib/canvas/canvas.js';
// Globals automatically injected: canvas, ctx, width, height, etc.
```

**New (explicit control):**
```typescript
// Option 1: Explicit (recommended)
import { setupCanvas2D } from '@rubyquail-art/quail-art/canvas';
const { canvas, ctx, width, height } = setupCanvas2D();

// Option 2: Creative coding mode (convenience)
import '@rubyquail-art/quail-art/canvas/creative-coding';
// Globals available: canvas, ctx, width, height, r, d, vec, sin, cos, etc.
```

### Import Path Changes

| Old | New |
|-----|-----|
| `from '../lib/index.js'` | `from '@rubyquail-art/quail-art'` |
| `from '../lib/vec.js'` | `from '@rubyquail-art/quail-art/core'` |
| `from '../lib/draw.js'` | `from '@rubyquail-art/quail-art/geometry'` |
| `from '../canvas/canvas.js'` | `from '@rubyquail-art/quail-art/canvas/creative-coding'` |
| `from '../webgpu/webgpu.js'` | `from '@rubyquail-art/quail-art/webgpu/creative-coding'` |

## Key Benefits

1. **Modular**: Import only what you need
2. **Explicit**: No hidden global state by default
3. **Flexible**: Choose between explicit or creative coding style
4. **Type-safe**: Full TypeScript support with proper types
5. **Testable**: Easier to test without global pollution
6. **Reusable**: Use the library in multiple contexts simultaneously

## Architecture

### Core Module (`/core`)
- `Vec` - 2D vector class with operations
- `Matrix` - Matrix operations
- Color utilities and palettes
- Mathematical helpers

### Geometry Module (`/geometry`)
- Drawing functions (`drawLoop`, `drawShape`, `drawBezierLoop`, etc.)
- Path operations and B-splines
- Line and clipping utilities
- Dijkstra pathfinding

### Canvas Module (`/canvas`)
- `setupCanvas2D()` - Initialize 2D canvas context
- `setCanvasSize()` - Resize canvas
- Creative coding mode available

### WebGPU Module (`/webgpu`)
- `setupWebGPU()` - Initialize WebGPU device
- `setupWebGPUCanvas()` - Full WebGPU canvas setup
- `resizeWebGPUCanvas()` - Handle resizing
- Pipeline utilities and post-processing
- Blur filters, color correction
- Creative coding mode available

## Development

This package is part of the art-mono monorepo managed by Moon and pnpm.

```bash
# Install dependencies
pnpm install

# Build
moon run quail-art:build

# Type check
tsc --build
```

## License

MIT
