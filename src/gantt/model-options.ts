import {Vertex} from "@visuallyjs/browser-ui";

const modelOptions = {
    beforeConnect:(source:Vertex, target:Vertex) => {
        return source.id !== target.id
    }
}

export default modelOptions
