import {Edge, VisuallyJsModel, Node} from "@visuallyjs/browser-ui"
import {Gantt,GanttExporterParameters, SerializedTask} from "./defs"
import {TYPE_MILESTONE} from "./constants"

/**
 * Find the upstream dependencies for this task, if any
 * @param entry
 */
function getDependencies(model:VisuallyJsModel, entry:Node):Array<string> {

    return model.getAllEdgesFor(entry, (e:Edge) => e.target === entry).map(e => e.source.id)
}

export function GanttExporter(model:VisuallyJsModel, parameters: GanttExporterParameters) {

    const out:Array<SerializedTask> = []

    const gantt:Gantt = parameters.gantt

    const _one = (entry:Node, parent?:Node) => {
        const t:SerializedTask = {
            id:entry.id,
            name:entry.data.name,
            color:entry.data.color,
            parent:parent == null ? null : parent.id,
            dependency:getDependencies(model, entry),
            progress:entry.data.progress == null ? 0 : entry.data.progress,
            type:entry.type,
            milestone:entry.type === TYPE_MILESTONE,
            start:entry.data.start,
            end:entry.data.end
        }

        out.push(t)

        gantt.listSubtasks(entry).forEach(st => {
            _one(st, entry)
        })
    }

    gantt.listTopLevelTasks().forEach(e => {
        _one(e, undefined)
    })

    return out

}
