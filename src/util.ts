import {ONE_DAY_IN_MILLISECONDS, STEP_WIDTH, TYPE_MILESTONE, TYPE_TASK, TYPE_TASK_GROUP} from "./constants"

import {Gantt, ParsedTask} from "./defs"
import {uuid} from "@visuallyjs/browser-ui"


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

class Dialogs {
    container: HTMLElement | null = null

    show(options: {
        title: string,
        type: string,
        initialData?: Record<string, any>,
        groups: Array<{id: string, name: string}>,
        onOK: (data: Record<string, any>) => void
    }) {
        this.container = document.createElement('div')
        this.container.className = 'vjs-gantt-modal-overlay'

        const modal = document.createElement('div')
        modal.className = 'vjs-gantt-modal'

        const header = document.createElement('div')
        header.className = 'vjs-gantt-modal-header'
        header.innerHTML = `<h3>${options.title}</h3>`
        const closeBtn = document.createElement('button')
        closeBtn.className = 'vjs-gantt-modal-close'
        closeBtn.innerHTML = '&times;'
        closeBtn.onclick = () => this.hide()
        header.appendChild(closeBtn)

        const body = document.createElement('div')
        body.className = 'vjs-gantt-modal-body'

        const nameField = document.createElement('div')
        nameField.className = 'vjs-gantt-modal-field'
        const initialName = options.initialData?.name || ''
        nameField.innerHTML = `<label>Name</label><input type="text" id="vjs-gantt-new-name" value="${initialName}">`
        body.appendChild(nameField)

        let progressSlider: HTMLInputElement | null = null
        if (options.type === TYPE_TASK) {
            const progressField = document.createElement('div')
            progressField.className = 'vjs-gantt-modal-field'
            const initialProgress = options.initialData?.progress || 0
            progressField.innerHTML = `<label>Progress</label><input type="range" id="vjs-gantt-new-progress" min="0" max="100" value="${initialProgress}">`
            progressSlider = progressField.querySelector('input')
            body.appendChild(progressField)
        }

        let groupSelect: HTMLSelectElement | null = null
        if (options.type === TYPE_TASK) {
            const groupField = document.createElement('div')
            groupField.className = 'vjs-gantt-modal-field'
            groupField.innerHTML = `<label>Group</label>`
            groupSelect = document.createElement('select')
            groupSelect.id = 'vjs-gantt-new-group'
            const initialParent = options.initialData?.parent || ''
            groupSelect.innerHTML = `<option value="">No group</option>`
            options.groups.forEach(g => {
                const opt = document.createElement('option')
                opt.value = g.id
                opt.textContent = g.name
                if (g.id === initialParent) opt.selected = true
                groupSelect!.appendChild(opt)
            })
            groupField.appendChild(groupSelect)
            body.appendChild(groupField)
        }

        const footer = document.createElement('div')
        footer.className = 'vjs-gantt-modal-footer'
        
        const cancelBtn = document.createElement('button')
        cancelBtn.className = 'vjs-gantt-modal-button secondary'
        cancelBtn.textContent = 'Cancel'
        cancelBtn.onclick = () => this.hide()

        const okBtn = document.createElement('button')
        okBtn.className = 'vjs-gantt-modal-button primary'
        okBtn.textContent = 'OK'
        okBtn.onclick = () => {
            const name = (document.getElementById('vjs-gantt-new-name') as HTMLInputElement).value
            const parent = groupSelect ? groupSelect.value : null
            const progress = progressSlider ? parseInt(progressSlider.value, 10) : undefined
            if (name.trim()) {
                options.onOK({ name, parent, progress })
                this.hide()
            }
        }

        footer.appendChild(cancelBtn)
        footer.appendChild(okBtn)

        modal.appendChild(header)
        modal.appendChild(body)
        modal.appendChild(footer)
        this.container.appendChild(modal)
        const parent = document.querySelector('.vjs-gantt-main') || document.body
        parent.appendChild(this.container)

        const input = document.getElementById('vjs-gantt-new-name') as HTMLInputElement
        input.focus()
        window.onkeydown = (e) => {
            if (e.key === 'Enter') okBtn.click()
            if (e.key === 'Escape') this.hide()
        }
    }

    confirm(options: {
        title: string,
        message: string,
        onOK: () => void
    }) {
        this.container = document.createElement('div')
        this.container.className = 'vjs-gantt-modal-overlay'

        const modal = document.createElement('div')
        modal.className = 'vjs-gantt-modal'

        const header = document.createElement('div')
        header.className = 'vjs-gantt-modal-header'
        header.innerHTML = `<h3>${options.title}</h3>`
        const closeBtn = document.createElement('button')
        closeBtn.className = 'vjs-gantt-modal-close'
        closeBtn.innerHTML = '&times;'
        closeBtn.onclick = () => this.hide()
        header.appendChild(closeBtn)

        const body = document.createElement('div')
        body.className = 'vjs-gantt-modal-body'
        body.innerHTML = `<p>${options.message}</p>`

        const footer = document.createElement('div')
        footer.className = 'vjs-gantt-modal-footer'

        const cancelBtn = document.createElement('button')
        cancelBtn.className = 'vjs-gantt-modal-button secondary'
        cancelBtn.textContent = 'Cancel'
        cancelBtn.onclick = () => this.hide()

        const okBtn = document.createElement('button')
        okBtn.className = 'vjs-gantt-modal-button primary'
        okBtn.textContent = 'OK'
        okBtn.onclick = () => {
            options.onOK()
            this.hide()
        }

        footer.appendChild(cancelBtn)
        footer.appendChild(okBtn)

        modal.appendChild(header)
        modal.appendChild(body)
        modal.appendChild(footer)
        this.container.appendChild(modal)
        const parent = document.querySelector('.vjs-gantt-main') || document.body
        parent.appendChild(this.container)

        okBtn.focus()
        window.onkeydown = (e) => {
            if (e.key === 'Enter') okBtn.click()
            if (e.key === 'Escape') this.hide()
        }
    }

    hide() {
        if (this.container) {
            this.container.parentElement?.removeChild(this.container)
            this.container = null
            window.onkeydown = null
        }
    }
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
