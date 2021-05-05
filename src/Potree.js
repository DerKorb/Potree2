
import {PotreeLoader} from "./potree/PotreeLoader.js";
import {render} from "./potree/renderQuads.js";


async function load(url, args = {}){
	let octree = await PotreeLoader.load(url);

	octree.name = args.name ?? "octree";

	return octree;
}


const pickQueue = [];

function pick(x, y, callback){
	pickQueue.push({x, y, callback});
}

export * from "./math/math.js";
export * from "./core/Geometry.js";
export * from "./core/RenderTarget.js";
export * from "./scene/Scene.js";
export * from "./scene/SceneNode.js";
export * from "./modules/mesh/Mesh.js";
export * from "./scene/Camera.js";
export * from "./navigation/OrbitControls.js";
export * from "./renderer/Renderer.js";
export * from "./modules/points/Points.js";
export * as Timer from "./renderer/Timer.js";
export * from "./potree/PointCloudOctree.js";
export * from "./potree/PointCloudOctreeNode.js";
export * from "./modules/mesh/renderMesh.js";
export {load as loadGLB} from "./misc/GLBLoader.js";

export {render as renderPoints} from "./prototyping/renderPoints.js";
export {render as renderPointsCompute} from "./prototyping/renderPointsCompute.js";
export {render as renderPointsOctree}  from "./potree/renderPointsOctree.js";
export {dilate}  from "./potree/dilate.js";
export {EDL}  from "./potree/EDL.js";


import {createPointsData} from "./modules/geometries/points.js";
import {cube} from "./modules/geometries/cube.js";
export const geometries = {createPointsData, cube};

import {init} from "./init.js";

// export async function init(){

// 	return new Promise( (resolve) => {

// 		initGUI();

// 		resolve();
// 	});
	
// }

export let Potree = {
	load: load,
	render: render,
	pick: pick, pickQueue,
	init: init,
};



