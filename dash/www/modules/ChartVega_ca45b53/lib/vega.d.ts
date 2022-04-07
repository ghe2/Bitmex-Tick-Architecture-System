declare namespace vega {

	declare class View {
		constructor(runtime: Runtime, options?: IOptions);
		
		initialize(domId: string): View;
		finalize(): View;
		hover(): View;
		resize(): any;
		run(): any;
		runAsync(): any;
		width(width: number): View;
		height(height: number): View;
	}

	declare class Runtime {
	}

	declare interface IOptions {
		loader?: any;
		logLevel?: any;
		renderer?: "canvas" | "svg";
		container?: string;
		hover?: boolean;
	}	

	export function loader(options?: any): any;
	export function parse(json: any): Runtime;

	export function Debug(options?: any): any;
	export function Error(options?: any): any;
	export function Info(options?: any): any;
	export function None(options?: any): any;
	export function Warn(options?: any): any;
}
