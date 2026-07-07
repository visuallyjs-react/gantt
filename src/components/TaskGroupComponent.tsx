import {BAR_HEIGHT} from "../gantt/constants"
import {JsxWrapperProps} from "@visuallyjs/browser-ui-react";
import {Node} from "@visuallyjs/browser-ui";

export default function TaskGroupComponent(p:{ctx:JsxWrapperProps<Node>, removeTask:(id:string) => any}) {

    const { data } = p.ctx

    return <div className="vjs-gantt-task-group" data-vjs-target="true" style={{left:`${data.left}px`,width:`${data.size}px`,height:`${BAR_HEIGHT}px`, backgroundColor:data.color}} data-vjs-resizable="false" data-vjs-not-draggable={true}>
        </div>

}
