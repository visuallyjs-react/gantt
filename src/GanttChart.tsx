import {GanttOptions} from "./defs"
import {useContext, useEffect, useRef} from "react"

import {
    registerParser, registerExporter,
    newInstance,
    EVENT_NODE_UPDATED, VERTEX_UPDATE_REASON_MOVED, Surface,
    VertexUpdatedParams, RandomColorGenerator,
    EVENT_UNDO,
    EVENT_REDO,
    Node
} from "@visuallyjs/browser-ui"

import {GanttParser} from "./parser"
import {
    GANTT,
    ONE_DAY_IN_MILLISECONDS,
    STEP_WIDTH,
    TYPE_TASK_GROUP
} from "./constants"
import {GanttExporter} from "./exporter"

import {
    millisecondsToDays,
    pixelsToMilliseconds,
    removeTask,
    today
} from "./util"
import {BrowserUIReactModel, SurfaceComponent, SurfaceComponentRef} from "@visuallyjs/browser-ui-react"

import {subtaskDataset} from "./data-generator"
import {GanttContext} from "./GanttProvider"
import {generateView} from "./view"
import { createRenderOptions } from "./render-options"
import modelOptions from "./model-options.ts";
import {createGantt} from "./gantt.ts";

export default function GanttChart(props:GanttOptions) {

    registerParser(GANTT, GanttParser)
    registerExporter(GANTT, GanttExporter)

    const model = useRef<BrowserUIReactModel>(newInstance(modelOptions))

    useEffect(() => {
        const m = model.current
        const undoSub = () => {
            _computeExtents()
            surface.current!.relayout()
        }

        const redoSub = () => {
            _computeExtents()
            surface.current!.relayout()
        }

        m.bind(EVENT_UNDO, undoSub)
        m.bind(EVENT_REDO, redoSub)

        return () => {
            m.unbind(EVENT_UNDO, undoSub)
            m.unbind(EVENT_REDO, redoSub)
        }
    })

    const surfaceComponent = useRef<SurfaceComponentRef>(null)
    const surface = useRef<Surface>(null)

    const initialized = useRef(false)

    function _taskMoved(p:VertexUpdatedParams) {
        const startMillis = minValue.current + pixelsToMilliseconds(p.vertex.data['left'])
        const endMillis = startMillis + pixelsToMilliseconds(p.vertex.data['size'])
        const dayRange = millisecondsToDays(endMillis - startMillis)

        minValue.current = Math.min(startMillis, minValue.current)
        maxValue.current = Math.max(endMillis, maxValue.current)

        model.current!.updateNode(p.vertex, {
            start:startMillis,
            end:endMillis,
            dayRange
        })
        _recalc(p.vertex)
        surface.current!.relayout()
    }

    function _recalculateTaskDuration(taskGroupId:string) {

        const node = gantt.getTask(taskGroupId),
            // @ts-ignore
            subtasks = gantt.listSubtasks(node)

        // @ts-ignore
        let start = node.data['type'] === TYPE_TASK_GROUP ? Infinity : node.data['start']
        // @ts-ignore
        let end = node.data['type'] === TYPE_TASK_GROUP ? -Infinity : node.data['end']

        if (subtasks && subtasks.length > 0) {

            subtasks.forEach(st => {
                const std = _recalculateTaskDuration(st.id)
                start = Math.min(start, std.start)
                end = Math.max(end, std.end)
            })
        }

        return {start, end}
    }

    function _recalc(vertex:Node) {
        let taskGroupId = vertex.data['parent']
        while (taskGroupId != null) {
            const {start, end} = _recalculateTaskDuration(taskGroupId)
            const dayRange = Math.floor((end - start) / ONE_DAY_IN_MILLISECONDS)
            model.current!.updateNode(taskGroupId, {
                start,
                end,
                dayRange,
                left:((start - minValue.current) / ONE_DAY_IN_MILLISECONDS) * STEP_WIDTH,
                size:dayRange * STEP_WIDTH
            })

            const taskGroup = model.current!.getNode(taskGroupId)
            taskGroupId = taskGroup.data['parent']
        }

        _computeExtents()

    }

    function _computeExtents() {
        let _min = minValue.current, _max = maxValue.current
        const _one = function(entry:Node) {
            _min = Math.min(_min, entry.data['start'])
            _max = Math.max(_max, entry.data['end'])
            gantt.listSubtasks(entry).forEach(_one)
        }

        gantt.listTopLevelTasks().forEach(_one)

        minValue.current = _min
        maxValue.current = _max
    }

    const options:GanttOptions = Object.assign({}, props || {})

    const colorGenerator = useRef(options.colorGenerator || new RandomColorGenerator())

    const minValue = useRef(today())
    const maxValue = useRef(-today())
    const rangeInDays = useRef(0)

    // create a Gantt chart
    const gantt = createGantt(options, model.current, () => surface.current!, colorGenerator.current)

    // store the gantt object on the context
    useContext(GanttContext).set(gantt)

    function load(data:any) {

        if (surface.current) {

            minValue.current = today()
            maxValue.current = today()
            rangeInDays.current = 0

            surface.current.model.load({
                data,
                type: GANTT,
                onload: () => {
                    _computeExtents()
                },
                parameters: {
                    gantt
                }
            })
        }
    }

    useEffect(() => {
        if(!initialized.current) {
            initialized.current = true
            surface.current = surfaceComponent.current!.getSurface()

            model.current!.bind<VertexUpdatedParams>(EVENT_NODE_UPDATED, (p) => {
                if(p.reason === VERTEX_UPDATE_REASON_MOVED) {
                    _taskMoved(p)
                }
            })

            load(subtaskDataset())
        }
    })

    const viewOptions = generateView((id) => removeTask(gantt, surface.current!, id))
    const renderOptions = createRenderOptions(minValue, _recalc)

    return <SurfaceComponent viewOptions={viewOptions}
                          renderOptions={renderOptions}
                          ref={surfaceComponent}
                          model={model.current!} className="vjs-gantt-canvas"/>

}
