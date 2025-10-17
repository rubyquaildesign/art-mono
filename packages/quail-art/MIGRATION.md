# Migration Guide: Quail-Art Reorganization

This guide helps you migrate existing artworks to the new modular structure.

## Summary of Changes

The library has been reorganized from a flat structure with automatic global injection into a modular, explicit structure with optional creative coding convenience.

### What Changed

1. **No automatic globals** - You must explicitly import or use creative-coding mode
2. **New directory structure** - Files moved to `core/`, `geometry/`, `canvas/`, `webgpu/`
3. **Explicit setup functions** - `setupCanvas2D()`, `setupWebGPU()` replace auto-execution
4. **Subpath exports** - Import specific modules instead of entire library
5. **Proper TypeScript** - Better types, no implicit any

### What Stayed the Same

- All the same functions and classes exist
- Vec, Matrix, draw functions work identically
- Global convenience mode still available via creative-coding imports

## Quick Migration Paths

### Path 1: Minimal Changes (Keep Global Style)

If you want to keep your existing code mostly the same with minimal changes:

**Before:**
```typescript
import '../packages/quail-art/src/canvas/canvas.js';
// canvas, ctx, width, height automatically available
```

**After:**
```typescript
import '@rubyquail-art/quail-art/canvas/creative-coding';
// canvas, ctx, width, height, r, d, vec, sin, cos, etc. available as globals
```

That's it! Your existing code should work with just this import change.

### Path 2: Gradual Migration (Explicit + Convenience)

Mix explicit imports with creative coding mode:

**Before:**
```typescript
import '../packages/quail-art/src/canvas/canvas.js';
import { Vec } from '../packages/quail-art/src/lib/vec.js';
```

**After:**
```typescript
import '@rubyquail-art/quail-art/canvas/creative-coding';
// OR import explicitly:
import { Vec, setupCanvas2D } from '@rubyquail-art/quail-art';
```

### Path 3: Full Refactor (Explicit Only)

For production code or libraries, use fully explicit imports:

**Before:**
```typescript
import '../packages/quail-art/src/canvas/canvas.js';
// Implicit globals
ctx.fillRect(0, 0, width, height);
```

**After:**
```typescript
import { setupCanvas2D, Vec } from '@rubyquail-art/quail-art';

const { canvas, ctx, width, height, r } = setupCanvas2D();
ctx.fillRect(0, 0, width, height);
```

## Detailed Migration Examples

### Canvas 2D Artwork

**Old Code:**
```typescript
// sketch.ts
import '../packages/quail-art/src/canvas/canvas.js';
import { Vec } from '../packages/quail-art/src/lib/vec.js';
import * as draw from '../packages/quail-art/src/lib/draw.js';

function setup() {
  canvas.width = 800;
  canvas.height = 800;
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  const center = new Vec(width / 2, height / 2);
  draw.drawDot([center.x, center.y], 10, ctx, 'fill');
}
```

**New Code (Creative Coding Mode):**
```typescript
// sketch.ts
import '@rubyquail-art/quail-art/canvas/creative-coding';
import { setSize } from '@rubyquail-art/quail-art/canvas/creative-coding';

function setup() {
  setSize(800, 800);
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  const center = vec(width / 2, height / 2);
  d.drawDot([center.x, center.y], 10, ctx, 'fill');
}
```

**New Code (Explicit Mode):**
```typescript
// sketch.ts
import { setupCanvas2D, setCanvasSize, Vec, drawDot } from '@rubyquail-art/quail-art';

const canvasCtx = setupCanvas2D();

function setup() {
  setCanvasSize(canvasCtx, 800, 800);
}

function render() {
  const { ctx, width, height } = canvasCtx;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  const center = new Vec(width / 2, height / 2);
  drawDot([center.x, center.y], 10, ctx, 'fill');
}
```

### WebGPU Artwork

**Old Code:**
```typescript
// gpu-sketch.ts
import '../packages/quail-art/src/webgpu/webgpu.js';

const pipeline = device.createRenderPipeline({
  vertex: { ... },
  fragment: { ... }
});
```

**New Code (Creative Coding Mode):**
```typescript
// gpu-sketch.ts
import '@rubyquail-art/quail-art/webgpu/creative-coding';

const pipeline = device.createRenderPipeline({
  vertex: { ... },
  fragment: { ... }
});
```

**New Code (Explicit Mode):**
```typescript
// gpu-sketch.ts
import { setupWebGPUCanvas } from '@rubyquail-art/quail-art/webgpu';

const gpu = await setupWebGPUCanvas();
const { device, queue, renderTarget } = gpu;

const pipeline = device.createRenderPipeline({
  vertex: { ... },
  fragment: { ... }
});
```

## Import Path Reference

### Module Imports

| What You Need | Import Path |
|---------------|-------------|
| Everything | `@rubyquail-art/quail-art` |
| Vec, Matrix, colors | `@rubyquail-art/quail-art/core` |
| Draw functions | `@rubyquail-art/quail-art/geometry` |
| Canvas setup | `@rubyquail-art/quail-art/canvas` |
| WebGPU setup | `@rubyquail-art/quail-art/webgpu` |
| Math globals (sin, cos, vec, etc.) | `@rubyquail-art/quail-art/creative-coding` |
| Canvas + math globals | `@rubyquail-art/quail-art/canvas/creative-coding` |
| WebGPU + math globals | `@rubyquail-art/quail-art/webgpu/creative-coding` |

### Specific Class/Function Imports

```typescript
// Core
import { Vec, Matrix } from '@rubyquail-art/quail-art/core';
import * as colour from '@rubyquail-art/quail-art/core';

// Geometry
import { drawLoop, drawShape, bSpline } from '@rubyquail-art/quail-art/geometry';

// Canvas
import { setupCanvas2D, setCanvasSize } from '@rubyquail-art/quail-art/canvas';

// WebGPU
import { setupWebGPU, setupWebGPUCanvas, resizeWebGPUCanvas } from '@rubyquail-art/quail-art/webgpu';
```

## Common Issues

### Issue: "canvas is not defined"

**Problem:** You're trying to use global `canvas` without importing creative-coding mode.

**Solution:**
```typescript
// Add this import at the top
import '@rubyquail-art/quail-art/canvas/creative-coding';
```

### Issue: "Vec is not a constructor"

**Problem:** You need to import Vec explicitly or use the global `vec` function.

**Solution:**
```typescript
// Option 1: Import Vec class
import { Vec } from '@rubyquail-art/quail-art';
const v = new Vec(10, 20);

// Option 2: Use creative-coding mode and vec function
import '@rubyquail-art/quail-art/creative-coding';
const v = vec(10, 20); // Returns a Vec instance
```

### Issue: TypeScript errors after migration

**Problem:** Old global declarations conflicting with new structure.

**Solution:** Remove any custom global type declarations you added for the old structure. The new modules provide their own types.

## Benefits of Migration

1. **Better IntelliSense**: Explicit imports give you better autocomplete
2. **Smaller bundles**: Import only what you use
3. **Multiple contexts**: Run multiple canvases/contexts in one app
4. **Testing**: Easier to test without globals
5. **Production ready**: Explicit mode suitable for production apps
6. **Still convenient**: Creative coding mode when you want it

## Need Help?

If you encounter issues during migration:
1. Check the [README.md](./README.md) for API documentation
2. Look at example artworks in `/apps` directory
3. Review this guide's examples
4. File an issue on GitHub

## Rollback

If you need to rollback temporarily, the old structure still exists in the `lib/`, `entry/`, old `canvas/canvas.ts`, and old `webgpu/webgpu.ts` files. However, these are deprecated and may be removed in future versions.
