import {Gantt, GanttOptions, InternalTask, ParsedTask} from "./defs"
import {useContext, useEffect, useRef} from "react"

import {
    registerParser, registerExporter,
    newInstance,
    APPEND_TO_CURRENT,
    EVENT_NODE_UPDATED, VERTEX_UPDATE_REASON_MOVED, Surface,
    VertexUpdatedParams, RandomColorGenerator,
    EVENT_UNDO,
    EVENT_REDO,
    Node
} from "@visuallyjs/browser-ui"

import {GanttParser} from "./parser"
import {
    BAR_HEIGHT,
    GANTT,
    ONE_DAY_IN_MILLISECONDS,
    ROW_HEIGHT,
    STEP_WIDTH,
    TYPE_TASK,
    TYPE_TASK_GROUP
} from "./constants"
import {GanttExporter} from "./exporter"

import {confirmTaskDeletion, millisecondsToDays, pixelsToMilliseconds, today} from "./util"
import {BrowserUIReactModel, SurfaceComponent, SurfaceComponentRef} from "@visuallyjs/browser-ui-react"

import {subtaskDataset} from "./data-generator"
import {GanttContext} from "./GanttProvider"
import {generateView} from "./view"
import { createRenderOptions } from "./render-options"
import modelOptions from "./model-options.ts";

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

    function exportToConsole() {
        console.log(JSON.stringify(model.current!.exportData({type:GANTT, parameters:{gantt}}), null, 2))
    }

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

    const options = Object.assign({}, props || {})

    const colorGenerator = useRef(options.colorGenerator || new RandomColorGenerator())

    const minValue = useRef(today())
    const maxValue = useRef(-today())
    const rangeInDays = useRef(0)

    function toggleCollapse(taskId:string) {
        const node = model.current!.getNode(taskId)
        if (node) {
            model.current!.updateNode(taskId, {
                collapsed: !node.data['collapsed']
            })
            _relayoutTasks()
        }
    }

    const gantt:Gantt = {
        // zoomToFit:() => zoomToFit(),
        assignColor:() => colorGenerator.current.generate(),
        barHeight:options.barHeight || BAR_HEIGHT,
        maxValue: () => Math.max(...model.current.getNodes().filter(n => n.type === "task").map(n => n.data.end)),
        minValue: () => Math.min(...model.current.getNodes().filter(n => n.type === "task").map(n => n.data.start)),
        rowHeight:options.rowHeight || ROW_HEIGHT,
        addTask,
        showDays:options.timeline ? options.timeline.showDays !== false : true,
        showWeekOfYear:options.timeline ? options.timeline.showWeekOfYear !== false : true,
        showMonthNames:options.timeline ? options.timeline.showMonthNames !== false : true,
        showQuarter:options.timeline ? options.timeline.showQuarters !== false : true,
        showDayName:options.timeline ? options.timeline.showDayName !== false : true,
        showDayNumber:options.timeline ? options.timeline.showDayNumber !== false : true,
        dayNameFormat:options.timeline ? options.timeline.dayNameFormat || "short" : "short",
        exportToConsole,
        model:model.current,
        relayoutTasks:_relayoutTasks,
        headerSize:0,
        toggleCollapse,
        removeTask,
        listTopLevelTasks():Array<Node> {
            return model.current.getNodes().filter(n => n.data.parent == null)
        },
        listSubtasks(entry: Node): Array<Node> {
            const t = model.current.getNodes().filter(n => n.data.parent == entry.id)
            t.sort((a,b) => a.data.top - b.data.top)
            return t
        },
        getTask(id:string) {
            return model.current.getNode(id)
        },
        zoomIn: () => surface.current?.zoomIn(),
        zoomOut: () => surface.current?.zoomOut(),
        getZoom:() => surface.current?.getZoom() || 1
    }

    // store the gantt object on the context
    useContext(GanttContext).set(gantt)

    function zoomToFit():void {
        // const dec = surface.current!.getDecorator(GANTT) as GanttDecorator
        // dec.zoomToVisible()
    }

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
                    setTimeout(zoomToFit, 250)
                },
                parameters: {
                    gantt
                }
            })
        }
    }

    function addTask(data:ParsedTask) {
        if (data.parent != null && gantt.getTask(data.parent) == null) {
            throw `Cannot add subtask ${data.name} to parent ${data.parent}; parent does not exist`
        }

        const dayRange = Math.floor((data.end - data.start) / ONE_DAY_IN_MILLISECONDS)
        const t:InternalTask = Object.assign(data as any, {
            dayRange,
            size:dayRange * STEP_WIDTH
        })

        model.current!.addNode(t)
    }

    function removeTask(taskId:string, noNeedToConfirm?:boolean) {
        const entry = gantt.getTask(taskId)
        if(entry != null) {

            const confirmationMessage = entry.type === TYPE_TASK ?
                `Delete task ${entry.data['name']} ?` :
                entry.type === TYPE_TASK_GROUP ?
                    `Delete task group ${entry.data['name']} ? Group and all subtasks will be deleted!` :
                    `Delete milestone ${entry.data['name']} ?`

            const proceed = () => {
                const tasks:Array<Node> = [], groups:Array<Node> = []

                const _one = (entry:Node) => {
                    if (entry.type === TYPE_TASK) {
                        tasks.unshift(entry)
                    } else {
                        groups.unshift(entry)
                    }
                    gantt.listSubtasks(entry).forEach(st => _one(st))
                }

                _one(entry)

                model.current!.transaction(() => {
                    tasks.forEach(t => model.current!.removeNode(t))
                    groups.forEach(t => model.current!.removeNode(t))
                    _relayoutTasks()
                })


            }

            if (noNeedToConfirm) {
                proceed()
            } else {
                confirmTaskDeletion("Delete", confirmationMessage, proceed)
            }
        }
    }

    function _relayoutTasks() {
        let y = 0
        model.current!.transaction(() => {
            const _one = (node: Node, visible: boolean) => {
                const isCollapsed = node.data['collapsed'] === true

                surface.current!.setVisible(node, visible)
                node.getEdges().forEach(edge => {
                    // An edge should be visible only if both its source and target are visible.
                    // However, setVisible(node, false) usually handles attached edges.
                    // To be safe and meet the requirement "ensure that all edges connected to some hidden task element are correctly hidden":
                    const sourceVisible = surface.current!.isVisible(edge.source)
                    const targetVisible = surface.current!.isVisible(edge.target)
                    surface.current!.setVisible(edge, sourceVisible && targetVisible)
                })

                if (visible) {
                    model.current!.updateNode(node.id, {
                        top: y + ((gantt.rowHeight - gantt.barHeight) / 2)
                    })
                    y += gantt.rowHeight
                }

                gantt.listSubtasks(node).forEach(st => _one(st, visible && !isCollapsed))
            }

            gantt.listTopLevelTasks().forEach(e => _one(e, true))
        }, APPEND_TO_CURRENT)

        surface.current!.relayout()

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

    const viewOptions = generateView(removeTask)
    const renderOptions = createRenderOptions(minValue, _recalc)

    return <SurfaceComponent viewOptions={viewOptions}
                          renderOptions={renderOptions}
                          ref={surfaceComponent}
                          model={model.current!} className="vjs-gantt-canvas"/>

}
