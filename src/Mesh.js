


export class Mesh{
	constructor(n, position, color){
		this.n = n;
		this.position = position;
		this.color = color;
	}

	static createBox(){

		let position = new Float32Array([
			// bottom
			-1, -1, -1,    1, -1, -1,    1, 1, -1,
			-1, -1, -1,    1, 1, -1,    -1, 1, -1,

			// top
			-1, -1, 1,    1, -1, 1,    1, 1, 1,
			-1, -1, 1,    1, 1, 1,    -1, 1, 1,

			// back
			-1, 1, -1,    1, 1, -1,    1, 1, 1,
			-1, 1, -1,    1, 1, 1,    -1, 1, 1,

			// front
			-1, -1, -1,    1, -1, -1,    1, -1, 1,
			-1, -1, -1,    1, -1, 1,    -1, -1, 1,

			// left
			-1, -1, -1,    -1, 1, -1,    -1, 1, 1,
			-1, -1, -1,    -1, 1, 1,    -1, -1, 1,

			// right
			1, -1, -1,    1, 1, -1,    1, 1, 1,
			1, -1, -1,    1, 1, 1,    1, -1, 1,
		]);

		let colorValues = [];
		for(let i = 0; i < position.length; i += 3){
			let red = position[i + 0] < 0 ? 0 : 255;
			let green = position[i + 1] < 0 ? 0 : 255;
			let blue = position[i + 2] < 0 ? 0 : 255;

			colorValues.push(red, green, blue, 255);
		}
		let color = new Uint8Array(colorValues);

		let n = position.length / 3;

		let mesh = new Mesh(n, position, color);

		return mesh;
	}
}



export function createTestMesh(renderer){
	let n = 10_000;

	let position = new Float32Array(3 * n);
	let color = new Uint8Array(4 * n);

	for(let i = 0; i < n; i++){
		let x = Math.random() - 0.5;
		let y = Math.random() - 0.5;
		let z = Math.random() - 0.5;

		let r = Math.random() * 255;
		let g = Math.random() * 255;
		let b = Math.random() * 255;

		position[3 * i + 0] = x;
		position[3 * i + 1] = y;
		position[3 * i + 2] = z;

		color[4 * i + 0] = r;
		color[4 * i + 1] = g;
		color[4 * i + 2] = b;
		color[4 * i + 3] = 255;
	}



	let mesh = new Mesh(n, position, color);

	return mesh;
}



