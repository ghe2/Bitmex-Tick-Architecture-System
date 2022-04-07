/** Interfaces and types for conmponentDefinition.ts */
type AdvancedProperty = ObjectProperty|ArrayProperty|ViewStateProperty|DataSourceProperty;

interface ArrayProperty extends BaseProperty {
	type: "array" | "readOnlyArray",
	options?: {
		hidden?:boolean,
		collapsed?:boolean
	},
	items?: ObjectProperty | StringObject & {
		id?:string,
		options?: {
			keep_oneof_values?: boolean
		},
		headerTemplate?: string,
		oneOf?: OneOfProperty[]
	},
	default?: Array<string>
}
// For datasource column options since ObjectProperty type
//  is object not string
interface StringObject {
	type: "string"
} 

interface BaseProperty {
	//type?: any,
	format?: string,
	propertyOrder?:number,
	title?: string,
	options?: {
		hidden?:boolean
	},
	watch?: {
		[index:string]: string
	}
}

interface BooleanProperty extends BaseProperty {
	type: "boolean",
	format?: "checkbox",
	default?: boolean
}

interface DataSourceProperty extends BaseProperty {
	type: "data"
}

interface ComponentDefinition {
	id:number,
	componentName:string,
	componentDescription:string,
	appArgs: {
		json: any,
		schema: ObjectProperty
	}
}

interface ObjectProperty extends BaseProperty {
	type: "object",
	options?: {
		hidden?:boolean,
		collapsed?:boolean
	},
    properties: { [index: string]: PrimitiveProperty | AdvancedProperty | ObjectProperty},
	additionalProperties?:boolean
}

interface OneOfProperty {
	title: string,
	options: {
		linked_oneof_property: {
			property: string,
			value: string
		}
	},
	properties: {[index:string]: PrimitiveProperty|AdvancedProperty}
}

interface NumberProperty extends BaseProperty {
	type: "number",
	format?: "number"|"range",
	default?: number | null,
	minimum?: number,
	maximum?: number,
	step?: number
}

type PrimitiveProperty = StringProperty|BooleanProperty|NumberProperty;

interface StringProperty extends BaseProperty {
    type: "string" | "gradient" | "customDropdown",
	enum?: string[],
	enumSource?: string,
    options?: {
        hidden?: boolean,
        gradient?: boolean,
        noColor?: boolean
	},
	default?: string | null
}

interface Upgrade { version:string|number, fn:(...args:any[])=>void }

interface ViewStateProperty extends BaseProperty {
	type: "viewstate"
}