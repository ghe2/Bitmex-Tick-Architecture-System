// TODO: https://github.com/chartjs/chartjs-color/blob/master/index.js

declare class Color  {
	constructor(attributes?: any, options?: any);
	alpha(opacity: number) : Color;
	rgbaString(): string;
	hexString(): string;
}


