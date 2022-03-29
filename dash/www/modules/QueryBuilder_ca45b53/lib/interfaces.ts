interface Analytic {
    name: string;
    parameters?: DCDS | Analytic[];
    type?: string;
}

interface AnalyticObj {
    children: string;
    groupName: string;
}

interface Analytics {
    length?: number;
    analyticAlias?: string;
    class?: string;
    deafultConnection?: string;
    descripton?: string;
    groups?: string[];
    name: string;
    parameters: DCDS | Analytic[];
    required?: string;
    returnType?: string;
    streaming?: boolean;
    type?: string;
    value?: string;
}

interface DCDS {
    class: string;
    columns: Array<string>;
    meta: Meta;
    rows: Analytic[];
}

interface EdgeCollection {
    [index: string]: Array<string>;
}

interface Form {
    $el: JQuery;
    model: any;
    value: any;
}

interface Meta {
    [key: string]: number;
}

interface Node {
    children: string;
}

interface NodeCollection {
    [index: string]: GraphNode;
}

interface Obj {
    rows?: object | null | undefined;
    parameters: number;
}

interface P {
    value: any;
    name: any;
}

interface Parameter {
    name: any;
    type: string;
}

interface Sources {
    [key: string]: string[] | string | boolean;
}

interface State {
    selected: boolean;
}

interface SubParameters {
    name: string;
    type: string;
}

interface Table {
    name: string;
    type: string;
    streaming: boolean;
    partition: any;
    partitionValues: any[];
    parameters: Parameter[];
}

interface TableDS {
    rows: TableDSRow[];
}

interface TableDSRow {
    [key: string]: string;
}

interface TreeData {
    id: string;
    text: string;
    state: State;
    children: TreeData[];
    type: string;
}

interface TreeNode {
    id: string;
    text: string;
    state: State;
    children: TreeNode[];
    type: string;
}
