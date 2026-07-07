import {GANTT, ONE_DAY_IN_MILLISECONDS, STEP_WIDTH, TYPE_MILESTONE, TYPE_TASK, TYPE_TASK_GROUP} from "./constants"

import {Gantt, InternalTask, ParsedTask} from "./defs"
import {APPEND_TO_CURRENT, Node, Surface, uuid, VisuallyJsModel} from "@visuallyjs/browser-ui"
import {Dialogs} from "./dialogs";
import {RefObject} from "@visuallyjs/browser-ui-svelte";

export const NARROW_DAY_FORMAT = new Intl.DateTimeFormat("default", { weekday: "narrow" })
export const SHORT_DAY_FORMAT = new Intl.DateTimeFormat("default", { weekday: "short" })
export const MONTH_FORMAT = new Intl.DateTimeFormat("default", { month: "short" })

/**
 * Returns the milliseconds value corresponding to the beginning of today's date (12am).
 */
export function today():number {
    const d2 = new Date()
    d2.setUTCHours(0)
    d2.setUTCMinutes(0)
    d2.setUTCSeconds(0)
    d2.setUTCMilliseconds(0)
    return d2.getTime()
}

export function aFewDaysAgo():number {
    return today() - (3 * ONE_DAY_IN_MILLISECONDS)
}

export function todayAsString() {
    return serializeDate(new Date(today()))
}

export function todayPlus(days:number) {
    const d = today(), d2 = new Date(d + (days * ONE_DAY_IN_MILLISECONDS))
    return d2.getTime()
}

export function todayPlusAsString(days:number):string {
    // @ts-ignore
    return serializeDate(new Date(todayPlus(days)))
}

export function datePlus(date:number, days:number) {
    return date + (days * ONE_DAY_IN_MILLISECONDS)
}

/**
 * returns the first week of the year in which the given date falls, according to ISO 8601. Also gives you
 * the start date for that week which may of course be in the previous year.
 * @param dateInMillis
 */
export function getWeekOfYear(dateInMillis:number) {
    const date = new Date(dateInMillis)

    // ISO week date weeks start on Monday, so correct the day number
    const nDay = (date.getDay() + 6) % 7;

    // ISO 8601 states that week 1 is the week with the first Thursday of that year
    // Set the target date to the Thursday in the target week
    date.setDate(date.getDate() - nDay + 3);

    // Store the millisecond value of the target date
    const n1stThursday = date.valueOf();

    // Set the target to the first Thursday of the year
    // First, set the target to January 1st
    date.setMonth(0, 1);

    // Not a Thursday? Correct the date to the next Thursday
    if (date.getDay() !== 4) {
        date.setMonth(0, 1 + ((4 - date.getDay()) + 7) % 7);
    }

    const startOfFirstWeek = new Date(date.getTime() - (3 * ONE_DAY_IN_MILLISECONDS))

    // The week number is the number of weeks between the first Thursday of the year
    // and the Thursday in the target week (604800000 = 7 * 24 * 3600 * 1000)
    const weekOfYear = 1 + Math.ceil((n1stThursday - date.getTime()) / 604800000)
    const startOfThisWeek = n1stThursday - (3 * ONE_DAY_IN_MILLISECONDS)
    return [ weekOfYear, startOfThisWeek, startOfFirstWeek.getTime()]
}

const dateRe=/([0-9]{4,4})([0-9]{2,2})([0-9]{2,2})/

export function parseDate(date:string|number):number {

    if (typeof date === 'string') {


        const parts = date.match(dateRe),
          // @ts-ignore
            y = parseInt(parts[1], 10),
          // @ts-ignore
            mo = parseInt(parts[2], 10),
          // @ts-ignore
            day = parseInt(parts[3], 10)

        const d = new Date()
        d.setMilliseconds(0)
        d.setFullYear(y)
        d.setMonth(mo - 1)
        d.setDate(day)
        d.setHours(0)
        d.setMinutes(0)
        d.setSeconds(0)
        return d.getTime()
    } else {
        return date
    }
}

export function padNumber(n:number):string {
    return (n < 10 ? "0" : "" ) + n
}


/**
 * Serialize the given date into yyyyMMdd format.
 * @param d
 */
export function serializeDate(d:Date):string {
    return `${d.getFullYear()}${padNumber(d.getMonth() + 1)}${padNumber(d.getDate())}`
}

const dialogs = new Dialogs()

// @ts-ignore
function _addNew(gantt:Gantt, type:string, title:string) {


    if(gantt) {

        dialogs.show({
            title,
            type,
            groups: gantt.model.getNodes().filter(n => n.type === TYPE_TASK_GROUP).map(n => ({id: n.id, name: n.data['name']})),
            onOK: (data: Record<string, any>) => {

                const parent = (data['parent'] != null && data['parent'].length > 0) ? data['parent'] : null
                const start = today()
                //const end = type === TYPE_MILESTONE ? start : todayPlus(1)
                const end = todayPlus(1)

                const newTask:ParsedTask = {
                    id: uuid(),
                    name: data.name,
                    type: type,
                    parent: parent,
                    start: start,
                    end: end,
                    progress: 0,
                    color: gantt.assignColor(),
                    height: gantt.barHeight,
                    subtasks: [],
                    milestone: type === TYPE_MILESTONE
                }

                // calculate left
                const min = gantt.minValue()
                const left = ((start - min) / ONE_DAY_IN_MILLISECONDS) * STEP_WIDTH
                // @ts-ignore
                newTask.left = left

                // calculate top
                let top = 0
                const nodes = gantt.model.getNodes()
                
                if (parent != null) {
                    const getDeepLastNode = (nodeId: string): any => {
                        const entry = gantt.getTask(nodeId)
                        if (!entry || gantt.listSubtasks(entry).length === 0) {
                            return entry
                        }

                        const subtasks = gantt.listSubtasks(entry)
                        return getDeepLastNode(subtasks[subtasks.length - 1].id)
                    }
                    
                    const lastNode = getDeepLastNode(parent)
                    if (lastNode) {
                        top = (lastNode.data.top || 0) + gantt.rowHeight
                    } else {
                        top = (gantt.rowHeight - gantt.barHeight) / 2
                    }
                } else {
                    if (nodes.length > 0) {
                        const maxTop = Math.max(...nodes.map(n => n.data.top || 0))
                        top = maxTop + gantt.rowHeight
                    } else {
                        top = (gantt.rowHeight - gantt.barHeight) / 2
                    }
                }
                
                // @ts-ignore
                newTask.top = top

                gantt.addTask(newTask)
                gantt.relayoutTasks()
            }
        })
    }
}


export function addNewTask(gantt:Gantt) {
    _addNew(gantt, TYPE_TASK, "New Task")
}

export function addNewTaskGroup(gantt:Gantt) {
    _addNew(gantt, TYPE_TASK_GROUP, "New Task Group")
}

export function addNewMilestone(gantt:Gantt) {
    _addNew(gantt, TYPE_MILESTONE, "New Milestone")
}

export function editTask(gantt: Gantt, taskId: string) {
    if (gantt) {
        const node = gantt.getTask(taskId)
        if (!node) return

        dialogs.show({
            title: `Edit ${node.type === TYPE_TASK_GROUP ? 'Group' : 'Task'}`,
            type: node.type,
            initialData: {
                name: node.data.name,
                parent: node.data.parent,
                progress: node.data.progress
            },
            groups: gantt.model.getNodes().filter(n => n.type === TYPE_TASK_GROUP && n.id !== taskId).map(n => ({id: n.id, name: n.data['name']})),
            onOK: (data: Record<string, any>) => {
                const update: Record<string, any> = { name: data.name }
                if (data.progress !== undefined) {
                    update.progress = data.progress
                }
                
                gantt.model.updateNode(taskId, update)
            }
        })
    }
}

export function pixelsToMilliseconds(px:number) {
    return  px / STEP_WIDTH * ONE_DAY_IN_MILLISECONDS
}

export function millisecondsToDays(ms:number) {
    return ms / ONE_DAY_IN_MILLISECONDS
}

export function confirmTaskDeletion(title: string, message: string, onOK: () => void) {
    dialogs.confirm({ title, message, onOK })
}

export function removeTask(gantt:Gantt, taskId:string, noNeedToConfirm?:boolean) {
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

            gantt.model.transaction(() => {
                tasks.forEach(t => gantt.model.removeNode(t))
                groups.forEach(t => gantt.model.removeNode(t))
                relayoutTasks(gantt)
            })


        }

        if (noNeedToConfirm) {
            proceed()
        } else {
            confirmTaskDeletion("Delete", confirmationMessage, proceed)
        }
    }
}

export function relayoutTasks(gantt:Gantt) {
    let y = 0
    const surface = gantt.getSurface()
    gantt.model.transaction(() => {
        const _one = (node: Node, visible: boolean) => {
            const isCollapsed = node.data['collapsed'] === true

            surface?.setVisible(node, visible)
            node.getEdges().forEach(edge => {
                // An edge should be visible only if both its source and target are visible.
                // However, setVisible(node, false) usually handles attached edges.
                // To be safe and meet the requirement "ensure that all edges connected to some hidden task element are correctly hidden":
                const sourceVisible = surface?.isVisible(edge.source)
                const targetVisible = surface?.isVisible(edge.target)
                surface?.setVisible(edge, sourceVisible && targetVisible)
            })

            if (visible) {
                surface?.model.updateNode(node.id, {
                    top: y + ((gantt.rowHeight - gantt.barHeight) / 2)
                })
                y += gantt.rowHeight
            }

            gantt.listSubtasks(node).forEach(st => _one(st, visible && !isCollapsed))
        }

        gantt.listTopLevelTasks().forEach(e => _one(e, true))
    }, APPEND_TO_CURRENT)

    surface?.relayout()

}

export function addTask(gantt:Gantt, model:VisuallyJsModel, data:ParsedTask) {
    if (data.parent != null && gantt.getTask(data.parent) == null) {
        throw `Cannot add subtask ${data.name} to parent ${data.parent}; parent does not exist`
    }

    const dayRange = Math.floor((data.end - data.start) / ONE_DAY_IN_MILLISECONDS)
    const t:InternalTask = Object.assign(data as any, {
        dayRange,
        size:dayRange * STEP_WIDTH
    })

    model.addNode(t)
}

export function toggleCollapse(gantt:Gantt, taskId:string) {
    const node = gantt.model.getNode(taskId)
    if (node) {
        gantt.model.updateNode(taskId, {
            collapsed: !node.data['collapsed']
        })
        relayoutTasks(gantt)
    }
}

export function exportToConsole(gantt:Gantt, model:VisuallyJsModel) {
    console.log(JSON.stringify(model.exportData({type:GANTT, parameters:{gantt}}), null, 2))
}

export function _recalculateTaskDuration(gantt:Gantt, taskGroupId:string) {

    const node = gantt.getTask(taskGroupId),
        // @ts-ignore
        subtasks = gantt.listSubtasks(node)

    // @ts-ignore
    let start = node.data['type'] === TYPE_TASK_GROUP ? Infinity : node.data['start']
    // @ts-ignore
    let end = node.data['type'] === TYPE_TASK_GROUP ? -Infinity : node.data['end']

    if (subtasks && subtasks.length > 0) {

        subtasks.forEach(st => {
            const std = _recalculateTaskDuration(gantt, st.id)
            start = Math.min(start, std.start)
            end = Math.max(end, std.end)
        })
    }

    return {start, end}
}

export function _computeExtents(gantt:Gantt, min:RefObject<number>, max:RefObject<number>) {
    let _min = min.current, _max = max.current
    const _one = function(entry:Node) {
        _min = Math.min(_min, entry.data['start'])
        _max = Math.max(_max, entry.data['end'])
        gantt.listSubtasks(entry).forEach(_one)
    }

    gantt.listTopLevelTasks().forEach(_one)

    min.current = _min
    max.current = _max
}

export function _recalc(gantt:Gantt, vertex:Node) {
    let taskGroupId = vertex.data['parent']
    while (taskGroupId != null) {
        const {start, end} = _recalculateTaskDuration(gantt, taskGroupId)
        const dayRange = Math.floor((end - start) / ONE_DAY_IN_MILLISECONDS)
        gantt.model.updateNode(taskGroupId, {
            start,
            end,
            dayRange,
            left:((start - gantt.minValue()) / ONE_DAY_IN_MILLISECONDS) * STEP_WIDTH,
            size:dayRange * STEP_WIDTH
        })

        const taskGroup = gantt.model.getNode(taskGroupId)
        taskGroupId = taskGroup.data['parent']
    }

}
