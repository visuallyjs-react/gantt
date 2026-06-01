import {RefHandle, createRefHandler} from "@visuallyjs/browser-ui-react"
import {Context, createContext, RefObject, ReactNode, useRef} from "react"

import {Gantt} from "./defs"

export const GanttContext:Context<RefHandle<Gantt>> = createContext(null as unknown as RefHandle<Gantt>)

export function GanttProvider(props:{children?:Array<ReactNode>|ReactNode}) {

    const ganttRefObject:RefObject<Gantt|null> = useRef(null)
    const ganttHarness = createRefHandler<Gantt>(ganttRefObject)

    return <GanttContext.Provider value={ganttHarness}>{props.children || []}</GanttContext.Provider>
}
