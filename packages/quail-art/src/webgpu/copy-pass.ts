import { makeShaderDataDefinitions } from 'webgpu-utils';
import { createPPPipelineAndLayouts } from './createPipeline.js';
import './setup.js';
import { code } from './shaders/copy-frag.wgsl';
const copyModule = device.createShaderModule({
  code,
  label: 'copy-shader-module',
});

function createCopyPass(
  passName: string,
  inputView: GPUTextureView,
  outputFormat: GPUTextureFormat,
  defaultOutputTexture: GPUTextureView
) {
  const { bindGroupLayouts, renderPipeline } = createPPPipelineAndLayouts(
    {
      codeModule: copyModule,
      dataDefinition: makeShaderDataDefinitions(code),
      entry: 'frag',
    },
    outputFormat,
    passName
  );
  const sam = device.createSampler({
    minFilter: 'linear',
    magFilter: 'linear',
    mipmapFilter: 'linear',
  });
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayouts[0],
    entries: [
      {
        binding: 0,
        resource: sam,
      },
      {
        binding: 1,
        resource: inputView,
      },
    ],
  });
  return {
    renderPass: (enc: GPUCommandEncoder, target?: GPUTextureView) => {
      const pass = enc.beginRenderPass({
        label: `pass-${passName}`,
        colorAttachments: [
          {
            loadOp: 'clear',
            storeOp: 'store',
            view: target ?? defaultOutputTexture,
          },
        ],
      });
      pass.setPipeline(renderPipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(3);
      pass.end();
    },
  };
}

export { createCopyPass };
