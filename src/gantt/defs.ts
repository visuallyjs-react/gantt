import {ColorGenerator} from "@visuallyjs/browser-ui"
import {Gantt} from "./gantt.ts";

export interface Task {
    id:string
    name:string
    color?:string
    parent:string|null
    type:string
    dependency?:string|Array<string>
    progress?:number
    milestone?:boolean
    collapsed?:boolean

}

export interface ParsedTask extends Task {
    subtasks:Array<string>
    start:number
    end:number
    height:number
}

export interface InternalTask extends ParsedTask {
    dayRange:number
    size:number
    left:number
    index:number
}

export interface SerializedTask extends Task {
    start:string|null
    end:string|null
}

export type SerializedGantt = Array<SerializedTask>

export type TimelineHeaderEntryValue = {start:number, end:number, label:string, size:number, id:string, type:string}

export type TimelineHeaderDayEntryValue = TimelineHeaderEntryValue & {day:string}

export type TimelineHeaderEntry = {values:Array<TimelineHeaderEntryValue>, id:string}

// export interface Gantt {
//     assignColor():string
//     relayoutTasks():void
//     barHeight:number
//     displayStart:number  // milliseconds marking the start of the timeline. initially corresponds with start of dataset.
//     displayEnd:number   // milliseconds marking the end of the timeline. initially corresponds with start of dataset.
//   minValue:() => number
//   maxValue:() => number
//   rowHeight:number
//   addTask:(d:ParsedTask) => any
//   dayNameFormat:"short"|"narrow"
//   showDays:boolean
//   showWeekOfYear:boolean
//   showMonthNames:boolean
//   showQuarter:boolean
//   showDayName:boolean
//   showDayNumber:boolean
//   exportToConsole:()=>void
//   model:BrowserUIModel
//     getSurface:() => Surface
//   headerSize:number
//   toggleCollapse:(taskId:string) => void
//   removeTask:(taskId:string, noNeedToConfirm?:boolean) => void
//     listTopLevelTasks():Array<Node>
//     listSubtasks(entry:Node):Array<Node>
//
//     getTask(id:string):Node|null
//     zoomIn:() => void
//     zoomOut:() => void
//     getZoom():number
//     load:(data:any, onload?:() => any) => void
// }

export interface GanttOptions {
    timeline?:{
        showDays?:boolean
        showWeekOfYear?:boolean
        showMonthNames?:boolean
        showQuarters?:boolean
        dayNameFormat?:"short"|"narrow"
        showDayName?:boolean,
        showDayNumber?:boolean
    }
    rowHeight?:number
    barHeight?:number
    enableZoom?:boolean
    wheelPan?:boolean
    colorGenerator?:ColorGenerator

    labels:any
}

export interface GanttParserParameters {
    gantt:Gantt
}

export interface GanttExporterParameters {
    gantt:Gantt
}

export type LabelEntry = {id:string, name:string, indent:number, type:string, collapsed?:boolean, y:number}

export type DayEntry = {
    clazz: string,
    left: number,
    size: number,
    height: number,
    id: number
}
