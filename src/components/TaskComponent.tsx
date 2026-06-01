import {BAR_HEIGHT} from "../constants"
import {JsxWrapperProps} from "@visuallyjs/browser-ui-react";
import {Node} from "@visuallyjs/browser-ui"

export default function TaskComponent(p:{ctx:JsxWrapperProps<Node>, showProgress?:boolean,  removeTask:(id:string) => any}) {

    const { data } = p.ctx


    return <div className="vjs-gantt-task" data-vjs-target="true" style={{left:`${data.left}px`,width:`${data.size}px`, height:`${BAR_HEIGHT}px`, backgroundColor:`${data.color}`}} data-vjs-y-resize="false" data-vjs-show-progress={p.showProgress}>
                <div className="vjs-gantt-progress-value">{data.progress}</div>
                <div className="vjs-gantt-progress-gauge" style={{width:`${data.progress}%`}}/>
                <div className="vjs-gantt-connect" data-vjs-source="true">+</div>
            </div>

}
