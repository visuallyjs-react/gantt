import {Gantt, GanttOptions, ParsedTask} from "./defs";
import {BAR_HEIGHT, GANTT, ROW_HEIGHT} from "./constants";
import {
    _recalc,
    addTask,
    exportToConsole,
    millisecondsToDays,
    pixelsToMilliseconds,
    relayoutTasks,
    removeTask,
    toggleCollapse
} from "./util";
import {
    BrowserUIModel,
    EVENT_NODE_UPDATED, EVENT_REDO, EVENT_UNDO,
    Node, RandomColorGenerator,
    Surface, VERTEX_UPDATE_REASON_MOVED,
    type VertexUpdatedParams
} from "@visuallyjs/browser-ui";

export function createGantt(options:GanttOptions, model: BrowserUIModel, getSurface:() => Surface):Gantt {

    const colorGenerator = options.colorGenerator || new RandomColorGenerator()

    const gantt:Gantt = {
        assignColor:() => colorGenerator.generate(),
        barHeight:options.barHeight || BAR_HEIGHT,
        maxValue: () => Math.max(...model.getNodes().filter(n => n.type === "task").map(n => n.data.end)),
        minValue: () => Math.min(...model.getNodes().filter(n => n.type === "task").map(n => n.data.start)),
        rowHeight:options.rowHeight || ROW_HEIGHT,
        addTask:(data:ParsedTask) => addTask(gantt, model, data),
        showDays:options.timeline ? options.timeline.showDays !== false : true,
        showWeekOfYear:options.timeline ? options.timeline.showWeekOfYear !== false : true,
        showMonthNames:options.timeline ? options.timeline.showMonthNames !== false : true,
        showQuarter:options.timeline ? options.timeline.showQuarters !== false : true,
        showDayName:options.timeline ? options.timeline.showDayName !== false : true,
        showDayNumber:options.timeline ? options.timeline.showDayNumber !== false : true,
        dayNameFormat:options.timeline ? options.timeline.dayNameFormat || "short" : "short",
        exportToConsole:() => exportToConsole(gantt, model),
        model,
        getSurface:getSurface,
        relayoutTasks:() => relayoutTasks(gantt),
        headerSize:0,
        toggleCollapse:(id:string) => toggleCollapse(gantt, id),
        removeTask:(id:string) => removeTask(gantt, id),
        listTopLevelTasks():Array<Node> {
            return model.getNodes().filter(n => n.data.parent == null)
        },
        listSubtasks(entry: Node): Array<Node> {
            const t = model.getNodes().filter(n => n.data.parent == entry.id)
            t.sort((a,b) => a.data.top - b.data.top)
            return t
        },
        getTask(id:string) {
            return model.getNode(id)
        },
        zoomIn: () => getSurface()?.zoomIn(),
        zoomOut: () => getSurface()?.zoomOut(),
        getZoom:() => getSurface()?.getZoom() || 1,
        load:(data:any, onload?:() => any) => {
            model.load({
                data,
                type: GANTT,
                onload,
                parameters: {
                    gantt
                }
            })
        }
    }

    model.bind<VertexUpdatedParams>(EVENT_NODE_UPDATED, (p) => {
        if(p.reason === VERTEX_UPDATE_REASON_MOVED) {
            _taskMoved(p)
        }
    })

    function _taskMoved(p:VertexUpdatedParams) {
        const minValue = gantt.minValue()
        const startMillis = minValue + pixelsToMilliseconds(p.vertex.data['left'])
        const endMillis = startMillis + pixelsToMilliseconds(p.vertex.data['size'])
        const dayRange = millisecondsToDays(endMillis - startMillis)

        model.updateNode(p.vertex, {
            start:startMillis,
            end:endMillis,
            dayRange
        })
        _recalc(gantt, p.vertex)
        getSurface()?.relayout()
    }

    const undoSub = () => {
        getSurface()?.relayout()
    }

    const redoSub = () => {
        getSurface()?.relayout()
    }

    model.bind(EVENT_UNDO, undoSub)
    model.bind(EVENT_REDO, redoSub)

    return gantt
}
