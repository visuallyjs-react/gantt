import {Gantt, GanttOptions, ParsedTask} from "./defs.ts";
import {BAR_HEIGHT, ROW_HEIGHT} from "./constants.ts";
import {addTask, exportToConsole, relayoutTasks, removeTask, toggleCollapse} from "./util.ts";
import {BrowserUIModel, ColorGenerator, Node, Surface} from "@visuallyjs/browser-ui";

export function createGantt(options:GanttOptions, model:BrowserUIModel, getSurface:() => Surface, colorGenerator:ColorGenerator):Gantt {
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
        relayoutTasks:() => relayoutTasks(gantt, getSurface()),
        headerSize:0,
        toggleCollapse:(id:string) => toggleCollapse(gantt, getSurface(), id),
        removeTask:(id:string) => removeTask(gantt, getSurface(), id),
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
        zoomIn: () => getSurface().zoomIn(),
        zoomOut: () => getSurface().zoomOut(),
        getZoom:() => getSurface().getZoom() || 1
    }

    return gantt
}
