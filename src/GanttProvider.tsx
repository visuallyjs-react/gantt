import {RefHandle, createRefHandler} from "@visuallyjs/browser-ui-react"
import {Context, createContext, RefObject, ReactNode, useRef, useContext, useState, useEffect} from "react"
import { Gantt } from "./gantt/gantt"


export const GanttContext:Context<RefHandle<Gantt>> = createContext(null as unknown as RefHandle<Gantt>)

export function GanttProvider(props:{children?:Array<ReactNode>|ReactNode}) {

    const ganttRefObject:RefObject<Gantt|null> = useRef(null)
    const ganttHarness = createRefHandler<Gantt>(ganttRefObject)

    return <GanttContext.Provider value={ganttHarness}>{props.children || []}</GanttContext.Provider>
}


export function useGantt() {
    const ref = useContext(GanttContext)

    const [gantt, setGantt] = useState<Gantt|null>(null)

    useEffect(() => {
        if (ref) {
            const listener = (s: Gantt) => {
                setGantt(s);
            };

            // Check immediately if the Gantt is already available
            if (ref.ref().current) {
                setGantt(ref.ref().current);
            } else {
                // If not, subscribe to changes
                ref.listen(listener);
            }
        }
    }, [ref]);

    return gantt
}
