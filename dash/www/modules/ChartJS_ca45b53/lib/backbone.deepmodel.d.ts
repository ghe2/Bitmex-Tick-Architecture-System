import * as Backbone from "../../../../_build/node_modules/@types/backbone";

declare module "../../../../_build/node_modules/@types/backbone" {
    export class DeepModel extends Backbone.Model {
        toFlat(flattenArrays: boolean);
    }
}
