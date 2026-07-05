import {GanttOptions} from "./gantt/defs"
import {useContext, useEffect, useMemo, useRef} from "react"

import {
    registerParser, registerExporter,
    newInstance,
    EVENT_NODE_UPDATED, VERTEX_UPDATE_REASON_MOVED, Surface,
    VertexUpdatedParams, RandomColorGenerator,
    EVENT_UNDO,
    EVENT_REDO,
    Node
} from "@visuallyjs/browser-ui"

import {GanttParser} from "./gantt/parser"
import {
    GANTT,
    ONE_DAY_IN_MILLISECONDS,
    STEP_WIDTH
} from "./gantt/constants"
import {GanttExporter} from "./gantt/exporter"

import {
    _recalculateTaskDuration,
    millisecondsToDays,
    pixelsToMilliseconds,
    removeTask
} from "./gantt/util"
import {
    BrowserUIReactModel,
    ReactSurfaceRenderOptions,
    SurfaceComponent,
    SurfaceComponentRef
} from "@visuallyjs/browser-ui-react"

import {subtaskDataset} from "./gantt/data-generator"
import {GanttContext} from "./GanttProvider"
import {generateView} from "./view"
import { createRenderOptions } from "./gantt/render-options"
import modelOptions from "./gantt/model-options.ts";
import {createGantt} from "./gantt/gantt.ts";

export default function GanttChart(props:GanttOptions) {

    registerParser(GANTT, GanttParser)
    registerExporter(GANTT, GanttExporter)

    const model = useRef<BrowserUIReactModel>(newInstance(modelOptions))
    const surfaceComponent = useRef<SurfaceComponentRef>(null)
    const surface = useRef<Surface>(null)
    const initialized = useRef(false)

    const options:GanttOptions = Object.assign({}, props || {})

    const colorGenerator = useRef(options.colorGenerator || new RandomColorGenerator())


    useEffect(() => {
        const m = model.current
        const undoSub = () => {
            surface.current!.relayout()
        }

        const redoSub = () => {
            surface.current!.relayout()
        }

        m.bind(EVENT_UNDO, undoSub)
        m.bind(EVENT_REDO, redoSub)

        return () => {
            m.unbind(EVENT_UNDO, undoSub)
            m.unbind(EVENT_REDO, redoSub)
        }
    })

    function _taskMoved(p:VertexUpdatedParams) {
        const startMillis = gantt.minValue() + pixelsToMilliseconds(p.vertex.data['left'])
        const endMillis = startMillis + pixelsToMilliseconds(p.vertex.data['size'])
        const dayRange = millisecondsToDays(endMillis - startMillis)


        model.current!.updateNode(p.vertex, {
            start:startMillis,
            end:endMillis,
            dayRange
        })
        _recalc(p.vertex)
        surface.current!.relayout()
    }



    function _recalc(vertex:Node) {
        let taskGroupId = vertex.data['parent']
        while (taskGroupId != null) {
            const {start, end} = _recalculateTaskDuration(gantt, taskGroupId)
            const dayRange = Math.floor((end - start) / ONE_DAY_IN_MILLISECONDS)
            model.current!.updateNode(taskGroupId, {
                start,
                end,
                dayRange,
                left:((start - gantt.minValue()) / ONE_DAY_IN_MILLISECONDS) * STEP_WIDTH,
                size:dayRange * STEP_WIDTH
            })

            const taskGroup = model.current!.getNode(taskGroupId)
            taskGroupId = taskGroup.data['parent']
        }

    }

    // create a Gantt chart
    const gantt = useMemo(() => createGantt(options, model.current, () => surface.current!, colorGenerator.current), [])

    // store the gantt object on the context
    useContext(GanttContext).set(gantt)

    useEffect(() => {
        if(!initialized.current) {
            initialized.current = true
            surface.current = surfaceComponent.current!.getSurface()

            model.current!.bind<VertexUpdatedParams>(EVENT_NODE_UPDATED, (p) => {
                if(p.reason === VERTEX_UPDATE_REASON_MOVED) {
                    _taskMoved(p)
                }
            })

            gantt.load(subtaskDataset())
        }
    })

    const viewOptions = generateView((id) => removeTask(gantt, surface.current!, id))
    const renderOptions:ReactSurfaceRenderOptions = createRenderOptions(() => gantt.minValue(), _recalc)

    return <SurfaceComponent viewOptions={viewOptions}
                          renderOptions={renderOptions}
                          ref={surfaceComponent}
                          model={model.current!} className="vjs-gantt-canvas"/>

}
