import {DecoratorComponent} from "@visuallyjs/browser-ui-react";
import { EVENT_DATA_UPDATED } from "@visuallyjs/browser-ui"
import {useContext, useEffect, useState} from "react";
import {Gantt} from "../defs.ts";
import {GanttContext} from "../GanttProvider.tsx";
import {millisecondsToDays} from "../util.ts";
import {STEP_WIDTH} from "../constants.ts";

type DayEntry = {
    clazz:string,
    left:number,
    size:number,
    height:number,
    id:number
}

const CLASS_DAY_STRIPE = "vjs-gantt-day-stripe"
const CLASS_DAY_STRIPE_ALT = "vjs-gantt-day-stripe-alt"

export default function GanttBodyDecorator() {
    //
    const [days, setDays] = useState<Array<DayEntry>>([])
    const [rightNowLine, setRightNowLine] = useState<number>(0)

    let {listen} = useContext(GanttContext)
    // @ts-ignore
    const [gantt, setGantt] = useState<Gantt>(null)

    useEffect(repaint, [gantt])

    useEffect(() => {
        listen(g => {
            setGantt(g)
            g.model.bind(EVENT_DATA_UPDATED, repaint)
        })
    })

    function repaint() {
        if (gantt != null) {

            const min = gantt.minValue(), max = gantt.maxValue()
            const stripeHeight = (gantt.model.getNodes().length * gantt.rowHeight) * gantt.getZoom()
            const dayRange = millisecondsToDays(max - min)

            const newDays:Array<DayEntry> = []
            let flipflop = false
            for (let i = 0; i < dayRange; i++) {
                newDays.push({
                    clazz:flipflop ? CLASS_DAY_STRIPE : CLASS_DAY_STRIPE_ALT,
                    left:i * STEP_WIDTH,
                    size:STEP_WIDTH,
                    height:stripeHeight,
                    id:i
                })

                flipflop = !flipflop
            }

            setDays(newDays)

            const rightNow = new Date().getTime()
            if (min < rightNow && max > rightNow) {
                const xLocDays = millisecondsToDays(rightNow - min)
                setRightNowLine(xLocDays * STEP_WIDTH)
            }
        }
    }

    return <>
        <DecoratorComponent placement="fixed" position={{x:0, y:0}}>
            {gantt != null && <div className="vjs-gantt-day-stripes">
                {days.map(day => <div key={day.id} className={day.clazz} style={{flexBasis:`${day.size}px`,height:`${day.height}px`}}/>)}
            </div>}
        </DecoratorComponent>
        <DecoratorComponent placement="fixed" position={{x:0, y:0}}>
            {gantt != null && <div className="vjs-gantt-right-now" style={{left:`${rightNowLine}px`, height:`${gantt.model.getNodes().length * gantt.rowHeight}px`}}/>}
        </DecoratorComponent>
    </>
}
