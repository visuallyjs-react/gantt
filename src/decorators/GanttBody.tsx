import {DecoratorComponent} from "@visuallyjs/browser-ui-react";
import {useEffect, useState} from "react";
import {useGantt} from "../GanttProvider";
import {DayEntry} from "../gantt/defs";

export default function GanttBodyDecorator() {
    //
    const [days, setDays] = useState<Array<DayEntry>>([])
    const [rightNowLine, setRightNowLine] = useState<number>(0)

    const gantt = useGantt()

    useEffect(repaint, [gantt])

    function repaint() {
        if (gantt != null) {
            setDays(gantt.days)
            setRightNowLine(gantt.rightNow)
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
