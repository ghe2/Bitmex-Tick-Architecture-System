// TODO: https://github.com/chartjs/chartjs-color/blob/master/index.js

declare class Color {
    constructor(attributes?, options?);
    alpha(opacity: number): Color;
    rgbaString(): string;
    hexString(): string;
}
