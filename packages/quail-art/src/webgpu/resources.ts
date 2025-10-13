class ResourceUsage extends Number {
  constructor(value = 0) {
    super(value);
  }
  protected new(number = 0) {
    return new (this.constructor as new (number: number) => this)(number);
  }
  protected or(number: number): this {
    return this.new(this.v | number);
  }
  protected c(): this {
    return this.new(this.v);
  }
  get v() {
    return this.valueOf();
  }
}

export class TexUse extends ResourceUsage {
  constructor(value = 0) {
    super(value);
  }
  get copyRead() {
    return this.or(GPUTextureUsage.COPY_SRC);
  }
  get copyWrite() {
    return this.or(GPUTextureUsage.COPY_DST);
  }
  get copyBoth() {
    return this.c().copyRead.copyWrite;
  }
  get bindable() {
    return this.or(GPUTextureUsage.TEXTURE_BINDING);
  }
  get storage() {
    return this.or(GPUTextureUsage.STORAGE_BINDING);
  }
  get renderTarget() {
    return this.or(GPUTextureUsage.RENDER_ATTACHMENT);
  }
}

export class BufUse extends ResourceUsage {
  constructor(value = 0) {
    super(value);
  }
  get mapRead() {
    return this.or(GPUBufferUsage.MAP_READ);
  }
  get mapWrite() {
    return this.or(GPUBufferUsage.MAP_WRITE);
  }
  get mapBoth() {
    return this.c().mapRead.mapWrite;
  }
  get copySrc() {
    return this.or(GPUBufferUsage.COPY_SRC);
  }
  get copyDest() {
    return this.or(GPUBufferUsage.COPY_DST);
  }
  get copyBoth() {
    return this.c().copySrc.copyDest;
  }
  get query() {
    return this.or(GPUBufferUsage.QUERY_RESOLVE);
  }
  get index() {
    return this.or(GPUBufferUsage.INDEX);
  }
  get indirect() {
    return this.or(GPUBufferUsage.INDIRECT);
  }
  get stor() {
    return this.or(GPUBufferUsage.STORAGE);
  }
  get uni() {
    return this.or(GPUBufferUsage.UNIFORM);
  }
  get vert() {
    return this.or(GPUBufferUsage.VERTEX);
  }
}

function hasGlobalDevice(
  deviceToCheck: GPUDevice | unknown = typeof device !== 'undefined'
    ? device
    : globalThis.device
): deviceToCheck is GPUDevice {
  return deviceToCheck instanceof GPUDevice;
}

export function deviceOrThrow(fallback?: unknown): GPUDevice {
  const deviceToCheck: GPUDevice | unknown =
    typeof device !== 'undefined' ? device : globalThis.device;
  if (hasGlobalDevice(deviceToCheck)) return deviceToCheck;
  else if (hasGlobalDevice(fallback)) return fallback;
  throw new Error(`no device in scope, or provided to function`);
}

export function newTex(
  label: string,
  size: GPUExtent3D,
  format: GPUTextureFormat,
  usage: GPUTextureUsageFlags,
  type: GPUTextureDimension = '2d',
  extras: Partial<GPUTextureDescriptor> = {},
  dev?: GPUDevice
) {
  const device = deviceOrThrow(dev);
  return device.createTexture({
    ...extras,
    format,
    label,
    size,
    usage,
    dimension: type,
  });
}

export function newBuff(
  label: string,
  size: number,
  usage: GPUBufferUsageFlags,
  mappedAtCreation = false,
  dev?: GPUDevice
) {
  const device = deviceOrThrow(dev);
  return device.createBuffer({
    label,
    size,
    usage,
    mappedAtCreation,
  });
}
