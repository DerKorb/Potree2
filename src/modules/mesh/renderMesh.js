
import { render as renderNormal, NormalMaterial } from "./NormalMaterial.js";
import { render as renderPhong, PhongMaterial } from "./PhongMaterial.js";
import * as Timer from "../../renderer/Timer.js";


export function renderMeshes(args = {}){

	let meshes = args.in;
	let target = args.target;
	let drawstate = args.drawstate;
	let {renderer, camera} = drawstate;
	let {device} = renderer;

	let firstDraw = target.version < renderer.frameCounter;
	let view = target.colorAttachments[0].texture.createView();
	let loadValue = firstDraw ? { r: 0.1, g: 0.2, b: 0.3, a: 1.0 } : "load";
	let depthLoadValue = firstDraw ? 0 : "load";
	let renderPassDescriptor = {
		colorAttachments: [{view, loadValue}],
		depthStencilAttachment: {
			view: target.depth.texture.createView(),
			depthLoadValue: depthLoadValue,
			depthStoreOp: "store",
			stencilLoadValue: 0,
			stencilStoreOp: "store",
		},
		sampleCount: 1,
	};
	target.version = renderer.frameCounter;

	const commandEncoder = renderer.device.createCommandEncoder();
	const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
	const pass = {commandEncoder, passEncoder, renderPassDescriptor};

	for(let mesh of meshes){
		if(mesh.material instanceof NormalMaterial){
			renderNormal(pass, mesh, drawstate);
		}else if(mesh.material instanceof PhongMaterial){
			renderPhong(pass, mesh, drawstate);
		}
	}

	passEncoder.endPass();
	let commandBuffer = commandEncoder.finish();
	renderer.device.queue.submit([commandBuffer]);

}