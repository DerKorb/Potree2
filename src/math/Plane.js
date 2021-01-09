
import {Vector3} from "./Vector3.js";

export class Plane{

	constructor( normal, constant ) {

		// normal is assumed to be normalized

		this.normal = normal ?? new Vector3( 1, 0, 0 );
		this.constant = constant ?? 0;

	}

	setComponents( x, y, z, w ) {

		this.normal.set( x, y, z );
		this.constant = w;

		return this;

	}

	distanceToPoint( point ) {

		return this.normal.dot( point ) + this.constant;

	}

};