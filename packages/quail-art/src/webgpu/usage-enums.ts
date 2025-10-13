import './setup.js';
const t = GPUTextureUsage;
/** @enum {GPUFlagsConstant} */
const TexUsage = {
	...t,
	all:
		t.COPY_SRC |
		t.COPY_DST |
		t.TEXTURE_BINDING |
		t.STORAGE_BINDING |
		t.RENDER_ATTACHMENT,
	allButStorage:
		t.COPY_SRC | t.COPY_DST | t.TEXTURE_BINDING | t.RENDER_ATTACHMENT,
	allCopy: t.COPY_DST | t.COPY_SRC,
	texAndRender: t.TEXTURE_BINDING | t.RENDER_ATTACHMENT,
} as const;
const b = GPUBufferUsage;

/** @enum {GPUFlagsConstant} */
const BufUsage = {
	...b,
	allCopy: b.COPY_DST | b.COPY_SRC,
	allMap: b.MAP_READ | b.MAP_WRITE,
	uniCopy: b.COPY_DST | b.COPY_SRC | b.UNIFORM,
	storCopy: b.COPY_DST | b.COPY_SRC | b.STORAGE,
};
export { TexUsage, BufUsage };
