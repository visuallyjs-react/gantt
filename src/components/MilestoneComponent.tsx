import {BAR_HEIGHT} from "../constants"
import {JsxWrapperProps} from "@visuallyjs/browser-ui-react";
import {Node} from "@visuallyjs/browser-ui";

export default function MilestoneComponent(p:{ctx:JsxWrapperProps<Node>,removeTask:(id:string) => any}) {

    const { data } = p.ctx


    return <div className="vjs-gantt-milestone" data-vjs-target="true" style={{left:`${data.left}px`,width:`${BAR_HEIGHT}px`, height:`${BAR_HEIGHT}px`}} data-vjs-y-resize="false" data-vjs-x-resize="false">
        <div className="vjs-gantt-milestone-body" style={{backgroundColor:data.color}}/>
        <div className="vjs-gantt-connect" data-vjs-source="true">+</div>
    </div>

}
