
import {render as renderPoints}  from "./renderPoints.js";
import {RenderTarget} from "../core/RenderTarget.js";
import * as Timer from "../renderer/Timer.js";
import {readPixels} from "../renderer/readPixels.js";


let vs = `
	const pos : array<vec2<f32>, 6> = array<vec2<f32>, 6>(
		vec2<f32>(0.0, 0.0),
		vec2<f32>(0.1, 0.0),
		vec2<f32>(0.1, 0.1),
		vec2<f32>(0.0, 0.0),
		vec2<f32>(0.1, 0.1),
		vec2<f32>(0.0, 0.1)
	);

	const uv : array<vec2<f32>, 6> = array<vec2<f32>, 6>(
		vec2<f32>(0.0, 1.0),
		vec2<f32>(1.0, 1.0),
		vec2<f32>(1.0, 0.0),
		vec2<f32>(0.0, 1.0),
		vec2<f32>(1.0, 0.0),
		vec2<f32>(0.0, 0.0)
	);

	[[block]] struct Uniforms {
		uTest : u32;
		x : f32;
		y : f32;
		width : f32;
		height : f32;
		near : f32;
	};

	[[binding(0), set(0)]] var<uniform> uniforms : Uniforms;

	struct VertexInput {
		[[builtin(vertex_idx)]] index : i32;
	};

	struct VertexOutput {
		[[builtin(position)]] position : vec4<f32>;
		[[location(0)]] uv : vec2<f32>;
	};

	[[stage(vertex)]]
	fn main(vertex : VertexInput) -> VertexOutput {

		var output : VertexOutput;

		output.position = vec4<f32>(pos[vertex.index], 0.999, 1.0);
		output.uv = uv[vertex.index];

		var x : f32 = uniforms.x * 2.0 - 1.0;
		var y : f32 = uniforms.y * 2.0 - 1.0;
		var width : f32 = uniforms.width * 2.0;
		var height : f32 = uniforms.height * 2.0;

		var vi : i32 = vertex.index;
		
		if(vi == 0 || vi == 3 || vi == 5){
			output.position.x = x;
		}else{
			output.position.x = x + width;
		}

		if(vi == 0 || vi == 1 || vi == 3){
			output.position.y = y;
		}else{
			output.position.y = y + height;
		}

		return output;
	}
`;

let fs = `

	[[binding(1), set(0)]] var mySampler: sampler;
	[[binding(2), set(0)]] var myTexture: texture_2d<f32>;
	[[binding(3), set(0)]] var myDepth: texture_2d<f32>;

	[[block]] struct Uniforms {
		uTest   : u32;
		x       : f32;
		y       : f32;
		width   : f32;
		height  : f32;
		near    : f32;
		window  : i32;
	};
	
	[[binding(0), set(0)]] var<uniform> uniforms : Uniforms;

	struct FragmentInput {
		[[builtin(position)]] fragCoord : vec4<f32>;
		[[location(0)]] uv: vec2<f32>;
	};

	struct FragmentOutput{
		[[builtin(frag_depth)]] depth : f32;
		[[location(0)]] color : vec4<f32>;
	};

	fn toLinear(depth: f32, near: f32) -> f32{
		return near / depth;
	}

	[[stage(fragment)]]
	fn main(input : FragmentInput) -> FragmentOutput {

		var output : FragmentOutput;

		var avg : vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);

		var window : i32 = uniforms.window;
		var closest : f32 = 0.0;

		for(var i : i32 = -window; i <= window; i = i + 1){
		for(var j : i32 = -window; j <= window; j = j + 1){
			var coords : vec2<i32>;
			coords.x = i32(input.fragCoord.x) + i;
			coords.y = i32(input.fragCoord.y) + j;

			var d : f32 = textureLoad(myDepth, coords, 0).x;

			closest = max(closest, d);
		}
		}

		var closestLinear : f32 = toLinear(closest, uniforms.near);
		
		for(var i : i32 = -window; i <= window; i = i + 1){
		for(var j : i32 = -window; j <= window; j = j + 1){
			var coords : vec2<i32>;
			coords.x = i32(input.fragCoord.x) + i;
			coords.y = i32(input.fragCoord.y) + j;

			var d : f32 = textureLoad(myDepth, coords, 0).x;
			var linearD : f32 = toLinear(d, uniforms.near);

			var isBackground : bool = d == 0.0;
			var isInRange : bool = linearD <= closestLinear * 1.01;

			if(isInRange && !isBackground){
				var manhattanDistance : f32 = f32(abs(i) + abs(j));

				var weight : f32 = 1.0;

				if(manhattanDistance <= 0.0){
					weight = 10.0;
				}elseif(manhattanDistance <= 1.0){
					weight = 0.3;
				}elseif(manhattanDistance <= 2.0){
					weight = 0.01;
				}else{
					weight = 0.001;
				}
				
				var color : vec4<f32> = textureLoad(myTexture, coords, 0);
				color.x = color.x * weight;
				color.y = color.y * weight;
				color.z = color.z * weight;
				color.w = color.w * weight;

				avg = avg + color;
			}
		}
		}

		if(avg.w == 0.0){
			output.color = vec4<f32>(0.1, 0.2, 0.3, 1.0);
			output.depth = 0.0;
		}else{
			// avg = avg / avg.w;
			avg.x = avg.x / avg.w;
			avg.y = avg.y / avg.w;
			avg.z = avg.z / avg.w;
			avg.w = 1.0;

			output.color = avg;
			output.depth = closest;
		}

		return output;
	}
`;

let pipeline = null;
let uniformBindGroup = null;
let uniformBuffer = null;

let _target_1 = null;
let _target_2 = null;

function getTarget1(renderer){
	if(_target_1 === null){

		let size = [128, 128, 1];
		_target_1 = new RenderTarget(renderer, {
			size: size,
			colorDescriptors: [{
				size: size,
				format: renderer.swapChainFormat,
				usage: GPUTextureUsage.SAMPLED 
					| GPUTextureUsage.COPY_SRC 
					| GPUTextureUsage.COPY_DST 
					| GPUTextureUsage.RENDER_ATTACHMENT,
			}],
			depthDescriptor: {
				size: size,
				format: "depth32float",
				usage: GPUTextureUsage.SAMPLED 
					| GPUTextureUsage.COPY_SRC 
					| GPUTextureUsage.COPY_DST 
					| GPUTextureUsage.RENDER_ATTACHMENT,
			}
		});
	}

	return _target_1;
}

function getTarget2(renderer){
	if(_target_2 === null){

		let size = [128, 128, 1];
		_target_2 = new RenderTarget(renderer, {
			size: size,
			colorDescriptors: [{
				size: size,
				format: renderer.swapChainFormat,
				usage: GPUTextureUsage.SAMPLED 
					| GPUTextureUsage.COPY_SRC 
					| GPUTextureUsage.COPY_DST 
					| GPUTextureUsage.RENDER_ATTACHMENT,
			}],
			depthDescriptor: {
				size: size,
				format: "depth32float",
				usage: GPUTextureUsage.SAMPLED 
					| GPUTextureUsage.COPY_SRC 
					| GPUTextureUsage.COPY_DST 
					| GPUTextureUsage.RENDER_ATTACHMENT,
			}
		});
	}

	return _target_2;
}

function init(renderer){

	if(pipeline === null){
		let {device, swapChainFormat} = renderer;

		pipeline = device.createRenderPipeline({
			vertex: {
				module: device.createShaderModule({code: vs}),
				entryPoint: "main",
			},
			fragment: {
				module: device.createShaderModule({code: fs}),
				entryPoint: "main",
				targets: [{format: "bgra8unorm"}],
			},
			primitive: {
				topology: 'triangle-list',
				cullMode: 'none',
			},
			depthStencil: {
					depthWriteEnabled: true,
					depthCompare: "greater",
					format: "depth32float",
			},
		});

		let uniformBufferSize = 256;
		uniformBuffer = device.createBuffer({
			size: uniformBufferSize,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

	}


}

export function renderDilate(renderer, pass, pointclouds, camera){

	init(renderer);

	let size = renderer.getSize();

	{ // PASS 1: Draw points to a texture
		let target = getTarget1(renderer);
		target.setSize(size.width, size.height);

		let sampler = renderer.device.createSampler({
			magFilter: "linear",
			minFilter: "linear",
		});

		// TODO: possible issue: re-creating bind group every frame
		// doing that because the render target attachments may change after resize
		uniformBindGroup = renderer.device.createBindGroup({
			layout: pipeline.getBindGroupLayout(0),
			entries: [
				{binding: 0, resource: {buffer: uniformBuffer}},
				{binding: 1, resource: sampler},
				{binding: 2, resource: target.colorAttachments[0].texture.createView()},
				{binding: 3, resource: target.depth.texture.createView({aspect: "depth-only"})}
			],
		});

		let renderPassDescriptor = {
			colorAttachments: [
				{
					view: target.colorAttachments[0].texture.createView(),
					loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
				},
			],
			depthStencilAttachment: {
				view: target.depth.texture.createView({aspect: "depth-only"}),
				depthLoadValue: 0.0,
				depthStoreOp: "store",
				stencilLoadValue: 0,
				stencilStoreOp: "store",
			},
			sampleCount: 1,
		};

		const commandEncoder = renderer.device.createCommandEncoder();
		const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

		Timer.timestamp(passEncoder,"dilate-pass1-start");

		let pass = {commandEncoder, passEncoder, renderPassDescriptor};

		for(let pointcloud of pointclouds){
			renderPoints(renderer, pass, pointcloud, camera);
		}

		Timer.timestamp(passEncoder,"dilate-pass1-end");

		pass.passEncoder.endPass();
		
		Timer.resolve(renderer, commandEncoder);

		let commandBuffer = pass.commandEncoder.finish();
		renderer.device.queue.submit([commandBuffer]);

		// if((renderer.frameCounter % 100) === 0){
		// 	renderer.readPixels(target.depth.texture, 0, 0, 60, 60).then(result => {
		// 	// renderer.readPixels(target.colorAttachments[0].texture, 0, 0, 60, 60).then(result => {
		// 		console.log(new Float32Array(result));
		// 		// console.log(new Uint8Array(result));
		// 	});
		// }

		if((renderer.frameCounter % 100) === 0){
			readPixels(renderer, target.colorAttachments[0].texture, 0, 0, 4, 4);
		}
	}

	{ // PASS 2: Dilate and write result to main framebuffer

		let {passEncoder} = pass;

		Timer.timestamp(passEncoder,"dilate-pass2-start");

		passEncoder.setPipeline(pipeline);

		{
			let source = new ArrayBuffer(32);
			let view = new DataView(source);

			let size = Number(guiContent["point size"]);
			let window = Math.round((size - 1) / 2);

			view.setUint32(0, 5, true);
			view.setFloat32(4, 0, true);
			view.setFloat32(8, 0, true);
			view.setFloat32(12, 1, true);
			view.setFloat32(16, 1, true);
			view.setFloat32(20, camera.near, true);
			view.setInt32(24, window, true);
			
			renderer.device.queue.writeBuffer(
				uniformBuffer, 0,
				source, 0, source.byteLength
			);

			passEncoder.setBindGroup(0, uniformBindGroup);
		}

		passEncoder.draw(6, 1, 0, 0);

		Timer.timestamp(passEncoder,"dilate-pass2-end");
	}

	return getTarget2(renderer);
}