import {
    JsxWrapperProps,
    ReactSurfaceViewOptions
} from "@visuallyjs/browser-ui-react"

import {Node, EVENT_TAP, PlainArrowOverlay, NodeEventCallbackPayload, EdgeEventCallbackPayload} from "@visuallyjs/browser-ui"

import {confirmTaskDeletion} from "./util"
import {TYPE_MILESTONE, TYPE_TASK, TYPE_TASK_GROUP} from "./constants"
import TaskComponent from "./components/TaskComponent"
import TaskGroupComponent from "./components/TaskGroupComponent"
import MilestoneComponent from "./components/MilestoneComponent"


/**
 * Generates the view for the canvas - maps node types to JSX, sets up tap to select for nodes,
 * and configures edges.
 * @param model
 * @param removeTask
 */
export function generateView(removeTask:(id:string)=> void):ReactSurfaceViewOptions {

    return {
        nodes:{
            selectable:{
                events:{
                    [EVENT_TAP]:(p:NodeEventCallbackPayload<any>) => {
                        p.model.setSelection(p.obj)
                    }
                }
            },
            [TYPE_TASK]:{
                jsx:(ctx:JsxWrapperProps<Node>) => <TaskComponent ctx={ctx} removeTask={removeTask}/>,
                parent:"selectable"
            },
            [TYPE_TASK_GROUP]:{
                jsx:(ctx:JsxWrapperProps<Node>) => <TaskGroupComponent ctx={ctx} removeTask={removeTask}/>,
                parent:"selectable"
            },
            [TYPE_MILESTONE]:{
                jsx:(ctx:JsxWrapperProps<Node>) => <MilestoneComponent ctx={ctx} removeTask={removeTask}/>,
                parent:"selectable"
            }
        },
        edges:{
            default:{
                overlays:[
                {
                    type:PlainArrowOverlay.type,
                    options:{
                        location:1,
                        width:8,
                        length:8
                    }
                }
            ],
                events:{
                [EVENT_TAP]:(e:EdgeEventCallbackPayload) => {
                    confirmTaskDeletion("Delete", `Delete dependency?`, () => {
                        e.model.removeEdge(e.obj)
                    })
                }
            }
        }
    }
}

}
