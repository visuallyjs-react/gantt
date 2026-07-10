import {DayEntry, GanttOptions, InternalTask, LabelEntry, ParsedTask, TimelineHeaderEntry} from "./defs";
import {
    BAR_HEIGHT, CLASS_DAY_STRIPE, CLASS_DAY_STRIPE_ALT,
    GANTT,
    ONE_DAY_IN_MILLISECONDS,
    ROW_HEIGHT,
    STEP_WIDTH, TYPE_MILESTONE,
    TYPE_TASK,
    TYPE_TASK_GROUP
} from "./constants";
import {
    millisecondsToDays,
    pixelsToMilliseconds, today, todayPlus
} from "./util";
import {
    APPEND_TO_CURRENT,
    BrowserUIModel, ColorGenerator, Edge, EVENT_DATA_UPDATED,
    EVENT_NODE_UPDATED, EVENT_REDO, EVENT_UNDO,
    EventGenerator,
    Node, RandomColorGenerator,
    Surface, uuid, VERTEX_UPDATE_REASON_MOVED,
    type VertexUpdatedParams
} from "@visuallyjs/browser-ui";
import {Dialogs} from "./dialogs";
import {_addTimelineDays, _addTimelineMonths, _addTimelineQuarters, _addTimelineWeeks} from "./headers";

function computeMax(model:BrowserUIModel):number {
    return Math.max(...model.getNodes().filter(n => n.type === "task").map(n => n.data.end))
}

function computeMin(model:BrowserUIModel):number {
    return Math.min(...model.getNodes().filter(n => n.type === "task").map(n => n.data.start))
}

export class Gantt extends EventGenerator {
    colorGenerator:ColorGenerator
    barHeight:number
    rowHeight:number
    displayStart:number
    displayEnd:number
    showDays:boolean
    showWeekOfYear:boolean
    showMonthNames:boolean
    showQuarter:boolean
    showDayName:boolean
    showDayNumber:boolean
    dayNameFormat:string
    headerSize:number
    dayRange:number
    dialogs:Dialogs
    headers:Array<TimelineHeaderEntry> = []
    labels:Array<LabelEntry> = []
    days:Array<DayEntry> = []
    rightNow:number = 0

    assignColor() { return this.colorGenerator.generate() }
    maxValue () { return computeMax(this.model)}
    minValue() { return computeMin(this.model) }

    exportToConsole() {
        console.log(JSON.stringify(this.model.exportData({type:GANTT, parameters:{gantt:this}}), null, 2))
    }

    confirmTaskDeletion(title: string, message: string, onOK: () => void) {
        this.dialogs.confirm({ title, message, onOK })
    }

    toggleCollapse(id:string) {
        const node = this.model.getNode(id)
        if (node) {
            this.model.updateNode(id, {
                collapsed: !node.data['collapsed']
            })
            this.relayoutTasks()
        }
    }

    addTask(data:ParsedTask) {
        if (data.parent != null && this.getTask(data.parent) == null) {
            throw `Cannot add subtask ${data.name} to parent ${data.parent}; parent does not exist`
        }

        const dayRange = Math.floor((data.end - data.start) / ONE_DAY_IN_MILLISECONDS)
        const t:InternalTask = Object.assign(data as any, {
            dayRange,
            size:dayRange * STEP_WIDTH,
            index:this.model.getNodeCount()
        })

        this.model.addNode(t)
    }

    removeTask(id:string, noNeedToConfirm?:boolean) {
        const entry = this.getTask(id)
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
                    this.listSubtasks(entry).forEach(st => _one(st))
                }

                _one(entry)

                this.model.transaction(() => {
                    tasks.forEach(t => this.model.removeNode(t))
                    groups.forEach(t => this.model.removeNode(t))
                    this.recalc(entry)
                    this.relayoutTasks()
                })
            }

            if (noNeedToConfirm) {
                proceed()
            } else {
                this.confirmTaskDeletion("Delete", confirmationMessage, proceed)
            }
        }
    }

    relayoutTasks() {
        let y = 0
        const surface = this.getSurface()
        this.model.transaction(() => {
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
                        top: y + ((this.rowHeight - this.barHeight) / 2)
                    })
                    y += this.rowHeight
                }

                this.listSubtasks(node).forEach(st => _one(st, visible && !isCollapsed))
            }

            this.listTopLevelTasks().forEach(e => _one(e, true))
        }, APPEND_TO_CURRENT)

        this._update()

    }

    protected shouldFireEvent(): boolean {
        return true;
    }

    listTopLevelTasks():Array<Node> {
        return this.model.getNodes().filter(n => n.data.parent == null)
    }

    listSubtasks(entry: Node): Array<Node> {
        const t = this.model.getNodes().filter(n => n.data.parent == entry.id)
        t.sort((a,b) => a.data.top - b.data.top)
        return t
    }

    getTask(id:string) {
        return this.model.getNode(id)
    }

    zoomIn () { return this.getSurface()?.zoomIn() }
    zoomOut () { return this.getSurface()?.zoomOut()}
    getZoom() { return this.getSurface()?.getZoom() || 1}
    load(data:any, onload?:() => any) {
        this.model.load({ data, type: GANTT, onload:() => {
                this.displayStart = computeMin(this.model)
                this.displayEnd = computeMax(this.model)
                this.configureHeaders()
                this.configureLabels()
                this.configureDays()
                onload && onload()
                this.fire("update")
            },
            parameters: {
                gantt:this
            }
        })
    }

    /**
     * Invoked after a vertex has been moved. The vertex data has been updated with a new `left` value, which we use to
     * compute the task's distance from the start date, and therefore its start date.
     * @param p
     */
    taskMoved(p:VertexUpdatedParams) {
        const displayMinValue = this.displayStart
        const startMillis = displayMinValue + pixelsToMilliseconds(p.vertex.data['left'])
        const endMillis = startMillis + pixelsToMilliseconds(p.vertex.data['size'])
        const dayRange = millisecondsToDays(endMillis - startMillis)

        this.model.updateNode(p.vertex, {
            start:startMillis,
            end:endMillis,
            dayRange
        })
        this.recalc(p.vertex)
    }

    recalc(vertex:Node) {
        let taskGroupId = vertex.data['parent']
        while (taskGroupId != null) {
            const {start, end} = this._recalculateTaskDuration(taskGroupId)
            const dayRange = Math.floor((end - start) / ONE_DAY_IN_MILLISECONDS)
            this.model.updateNode(taskGroupId, {
                start,
                end,
                dayRange,
                //left:((start - gantt.minValue()) / ONE_DAY_IN_MILLISECONDS) * STEP_WIDTH,
                left:((start - this.displayStart) / ONE_DAY_IN_MILLISECONDS) * STEP_WIDTH,
                size:dayRange * STEP_WIDTH
            })

            const taskGroup = this.model.getNode(taskGroupId)
            taskGroupId = taskGroup.data['parent']
        }

        // gantt.displayStart = Math.max(gantt.displayStart, computeMin(gantt.model))
        this.displayEnd = computeMax(this.model)// Math.max(this.displayEnd, computeMax(this.model))
        this.configureHeaders()
        this.configureLabels()
        this.configureDays()
        this._update()

    }

    private _update() {
        this.getSurface()?.relayout()
        this.fire("update")
    }

    constructor(options:GanttOptions, public model: BrowserUIModel, private getSurface:() => Surface) {
        super()

        this.dialogs = new Dialogs()
        this.colorGenerator = options.colorGenerator || new RandomColorGenerator()
        this.headerSize = 0
        this.dayRange = 0
        this.barHeight= options.barHeight || BAR_HEIGHT
        this.displayStart = computeMin(model)
        this.displayEnd = computeMax(model)

        this.rowHeight = options.rowHeight || ROW_HEIGHT
        this.showDays = options.timeline ? options.timeline.showDays !== false : true
        this.showWeekOfYear = options.timeline ? options.timeline.showWeekOfYear !== false : true
        this.showMonthNames = options.timeline ? options.timeline.showMonthNames !== false : true
        this.showQuarter = options.timeline ? options.timeline.showQuarters !== false : true
        this.showDayName = options.timeline ? options.timeline.showDayName !== false : true
        this.showDayNumber = options.timeline ? options.timeline.showDayNumber !== false : true
        this.dayNameFormat = options.timeline ? options.timeline.dayNameFormat || "short" : "short"

        ;(window as any).g = this

        model.bind<VertexUpdatedParams>(EVENT_NODE_UPDATED, (p) => {
            if(p.reason === VERTEX_UPDATE_REASON_MOVED) {
                this.taskMoved(p)
            }
        })

        const undoRedo = () => {
            this.configureHeaders()
            this.configureLabels()
            this.configureDays()
            this.getSurface()?.relayout()
            this.fire("update")
        }

        model.bind(EVENT_UNDO, undoRedo)
        model.bind(EVENT_REDO, undoRedo)
        model.bind(EVENT_DATA_UPDATED, undoRedo);

    }

    private _addNew(type:string, title:string) {

        this.dialogs.show({
            title,
            type,
            groups: this.model.getNodes().filter(n => n.type === TYPE_TASK_GROUP).map(n => ({id: n.id, name: n.data['name']})),
            onOK: (data: Record<string, any>) => {

                const parent = (data['parent'] != null && data['parent'].length > 0) ? data['parent'] : null
                const start = today()
                const end = todayPlus(1)

                const newTask:ParsedTask = {
                    id: uuid(),
                    name: data.name,
                    type: type,
                    parent: parent,
                    start: start,
                    end: end,
                    progress: 0,
                    color: this.assignColor(),
                    height: this.barHeight,
                    subtasks: [],
                    milestone: type === TYPE_MILESTONE
                }

                // calculate left
                const min = this.displayStart
                const left = ((start - min) / ONE_DAY_IN_MILLISECONDS) * STEP_WIDTH
                // @ts-ignore
                newTask.left = left

                // calculate top
                let top = 0
                const nodes = this.model.getNodes()

                if (parent != null) {
                    const getDeepLastNode = (nodeId: string): any => {
                        const entry = this.getTask(nodeId)
                        if (!entry || this.listSubtasks(entry).length === 0) {
                            return entry
                        }

                        const subtasks = this.listSubtasks(entry)
                        return getDeepLastNode(subtasks[subtasks.length - 1].id)
                    }

                    const lastNode = getDeepLastNode(parent)
                    if (lastNode) {
                        top = (lastNode.data.top || 0) + this.rowHeight
                    } else {
                        top = (this.rowHeight - this.barHeight) / 2
                    }
                } else {
                    if (nodes.length > 0) {
                        const maxTop = Math.max(...nodes.map(n => n.data.top || 0))
                        top = maxTop + this.rowHeight
                    } else {
                        top = (this.rowHeight - this.barHeight) / 2
                    }
                }

                // @ts-ignore
                newTask.top = top

                this.addTask(newTask)
                this.relayoutTasks()
            }
        })
    }


    addNewTask() {
        this._addNew(TYPE_TASK, "New Task")
    }

    addNewTaskGroup() {
        this._addNew(TYPE_TASK_GROUP, "New Task Group")
    }

    addNewMilestone() {
        this._addNew(TYPE_MILESTONE, "New Milestone")
    }

    editTask(taskId: string) {
        const node = this.getTask(taskId)
        if (!node) return

        this.dialogs.show({
            title: `Edit ${node.type === TYPE_TASK_GROUP ? 'Group' : 'Task'}`,
            type: node.type,
            initialData: {
                name: node.data.name,
                parent: node.data.parent,
                progress: node.data.progress
            },
            groups: this.model.getNodes().filter(n => n.type === TYPE_TASK_GROUP && n.id !== taskId).map(n => ({id: n.id, name: n.data['name']})),
            onOK: (data: Record<string, any>) => {
                const update: Record<string, any> = { name: data.name }
                if (data.progress !== undefined) {
                    update.progress = data.progress
                }

                this.model.updateNode(taskId, update)
            }
        })
    }

    _recalculateTaskDuration(taskGroupId:string) {

        const node = this.getTask(taskGroupId),
            // @ts-ignore
            subtasks = this.listSubtasks(node)

        // @ts-ignore
        let start = node.data['type'] === TYPE_TASK_GROUP ? Infinity : node.data['start']
        // @ts-ignore
        let end = node.data['type'] === TYPE_TASK_GROUP ? -Infinity : node.data['end']

        if (subtasks && subtasks.length > 0) {

            subtasks.forEach(st => {
                const std = this._recalculateTaskDuration(st.id)
                start = Math.min(start, std.start)
                end = Math.max(end, std.end)
            })
        }

        return {start, end}
    }

    maybeDeleteDependency(edge:Edge) {
        this.confirmTaskDeletion("Delete", `Delete dependency?`, () => {
            this.model.removeEdge(edge)
        })
    }

    configureHeaders() {
        this.headers = []
        if (this.showDays) {
            _addTimelineDays(this, this.headers)
        }

        if (this.showWeekOfYear) {
            _addTimelineWeeks(this, this.headers)
        }

        if(this.showMonthNames) {
            _addTimelineMonths(this, this.headers)
        }

        if (this.showQuarter) {
            _addTimelineQuarters(this, this.headers)
        }

        this.headerSize = this.rowHeight * this.headers.length
        this.dayRange = millisecondsToDays(this.displayEnd - this.displayStart)

    }

    configureLabels() {
        const newEntries: Array<LabelEntry> = []

        const _one = (entry: Node, indent: number) => {
            const collapsed = entry.data['collapsed'] === true
            newEntries.push({id: entry.id, name: entry.data.name, indent, type: entry.type, collapsed, y:entry.data.top})
            if (!collapsed) {
                this.listSubtasks(entry).forEach(st => _one(st, indent + 1))
            }
        }

        this.listTopLevelTasks().forEach(entry => {
            _one(entry, 0)
        })

        // sort so the labels are in the correct order vertically
        newEntries.sort((e1, e2) => e1.y - e2.y)
        this.labels = newEntries
    }

    configureDays() {
        const min = this.displayStart, max = this.displayEnd
        const stripeHeight = (this.model.getNodes().length * this.rowHeight) * this.getZoom()

        const newDays: Array<DayEntry> = []
        let flipflop = false
        for (let i = 0; i < this.dayRange; i++) {
            newDays.push({
                clazz: flipflop ? CLASS_DAY_STRIPE : CLASS_DAY_STRIPE_ALT,
                left: i * STEP_WIDTH,
                size: STEP_WIDTH,
                height: stripeHeight,
                id: i
            })

            flipflop = !flipflop
        }

        this.days = newDays

        const rightNow = new Date().getTime()
        if (min < rightNow && max > rightNow) {
            const xLocDays = millisecondsToDays(rightNow - min)
            this.rightNow = xLocDays * STEP_WIDTH
        }
    }
}

