import {InternalTask} from "./defs"
import {ROW_HEIGHT, STEP_WIDTH} from "./constants"

import { CONNECTOR_TYPE_ORTHOGONAL,
    ResizingToolsPlugin,
    EVENT_CANVAS_CLICK,
    Surface,
PointXY, Size, Node } from "@visuallyjs/browser-ui"
import {millisecondsToDays, pixelsToMilliseconds} from "./util"
import {RefObject} from "react"
import {ReactSurfaceRenderOptions} from "@visuallyjs/browser-ui-react";

export function createRenderOptions(minValue:RefObject<number>, recalcTask:(task:Node) => void):ReactSurfaceRenderOptions {
    return {
        activeFiltering:true,

        edges:{
            anchors:[
                "Right", "Left"
            ],
            connector:{
                type:CONNECTOR_TYPE_ORTHOGONAL,
                options:{
                    stub:15,
                    alwaysRespectStubs:true,
                    cornerRadius:5
                }
            }
        },
        dragOptions:{
            autoPan:false,
            // this drag constrain function constrains the node to only drag in the X axis.
            // @ts-ignore
            constrainFunction:(desiredLoc: PointXY, dragEl: HTMLElement, constrainRect: Size, size: Size, currentLoc: PointXY) => {
                return {x:Math.max(0, desiredLoc.x), y:currentLoc.y}
            },
            cssFilter:".vjs-gantt-day-stripe, .vjs-gantt-day-stripe-alt, .vjs-gantt-day-stripes"
        },
        consumeRightClick:false,
        plugins:[
            {
                type:ResizingToolsPlugin.type,
                options:{
                    widthAttribute:"size",
                    // @ts-ignore
                    payloadGenerator:(node:Node, payload:InternalTask) => {
                        const newStart = minValue.current + pixelsToMilliseconds(payload.left)
                        const newEnd = newStart + pixelsToMilliseconds(payload.size)
                        return {
                            start:newStart,
                            end:newEnd,
                            dayRange:Math.floor(millisecondsToDays(newEnd - newStart))
                        }
                    },
                    onEdit:(task:Node, surface:Surface) => {
                        recalcTask(task)
                        surface.relayout()
                    },
                   resizeY:false,
                    resizeMethod:"borders"
                }
            }
        ],
        pan:{
            enabled:false
        },
        zoom:{
            wheel:false,
            fixedTransformOrigin:{x:0, y:0},
        },
        grid:{
            size:{width:STEP_WIDTH, height:ROW_HEIGHT}
        },
        events:{
            [EVENT_CANVAS_CLICK]:(surface:Surface) => {
                surface.model.clearSelection()
            }
        }
    }
}
