import {useEffect, useState} from "react";
import {TimelineHeaderDayEntryValue, TimelineHeaderEntry} from "../gantt/defs";
import {useGantt} from "../GanttProvider";
import {STEP_WIDTH} from "../gantt/constants";
import {useSurface, useZoom} from "@visuallyjs/browser-ui-react";


export default function GanttHeaders() {
    //
    const [headers, setHeaders] = useState<Array<TimelineHeaderEntry>>([])
    const [dayRange, setDayRange] = useState<number>(0)

    // @ts-ignore
    const gantt = useGantt()

    const surface = useSurface()
    const zoom = useZoom(surface)

    useEffect(() => {
        if (gantt != null) {
            const repaint = () => {
                setDayRange(gantt.dayRange)
                setHeaders(gantt.headers)
            }
            gantt.bind("update", repaint)
            repaint()
            return (() => { gantt.unbind("update", repaint) })
        }
        return
    }, [gantt])



    function timelineLabel(v:TimelineHeaderDayEntryValue) {
        return <>
            {(gantt!.showDayName && gantt!.showDayNumber) && <><span>{v.day}</span><span className="vjs-gantt-day-name">{v.label}</span></> }
            {!gantt!.showDayName && gantt!.showDayNumber && <span>{v.day}</span>}
            {!gantt!.showDayNumber && <span>{v.label}</span>}
        </>
    }

    return <>
        <div className="vjs-gantt-timeline-container">
            {gantt != null && <div className="vjs-gantt-timeline" style={{width:`${dayRange * STEP_WIDTH}px`}}>
            {headers.map(header => <div className={`vjs-gantt-timeline-row vjs-gantt-timeline-${header.id}`} key={header.id}>
                {header.values.map(value => <div key={value.id} className="vjs-gantt-timeline-entry" style={{flexBasis:`${value.size * zoom}px`,height:`${gantt.rowHeight}px`}}>
                    {value.type === 'day' && timelineLabel(value as TimelineHeaderDayEntryValue)}
                    {value.type !== 'day' && value.label}
                </div>)}
            </div>)}
        </div>}
        </div>
    </>
}
