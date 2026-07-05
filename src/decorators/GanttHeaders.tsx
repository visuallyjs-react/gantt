import {EVENT_DATA_UPDATED} from "@visuallyjs/browser-ui"
import {useContext, useEffect, useState} from "react";
import {Gantt, TimelineHeaderDayEntryValue, TimelineHeaderEntry} from "../gantt/defs.ts";
import {GanttContext} from "../GanttProvider.tsx";
import {STEP_WIDTH} from "../gantt/constants.ts";
import {useSurface, useZoom} from "@visuallyjs/browser-ui-react";
import configureHeaders from "../gantt/headers.ts";


export default function GanttHeaders() {
    //
    const [headers, setHeaders] = useState<Array<TimelineHeaderEntry>>([])
    const [dayRange, setDayRange] = useState<number>(0)

    let {listen} = useContext(GanttContext)
    // @ts-ignore
    const [gantt, setGantt] = useState<Gantt>(null)

    const surface = useSurface()
    const zoom = useZoom(surface)

    useEffect(repaint, [gantt])

    useEffect(() => {
        listen(g => {
            setGantt(g)
            g.model.bind(EVENT_DATA_UPDATED, repaint)
        })
    })

    function repaint() {
        if (gantt != null) {

            const { dayRange, headers, headerSize } = configureHeaders(gantt)

            setDayRange(dayRange)
            gantt.headerSize = headerSize
            setHeaders(headers)
        }
    }

    function timelineLabel(v:TimelineHeaderDayEntryValue) {
        return <>
            {(gantt.showDayName && gantt.showDayNumber) && <><span>{v.day}</span><span className="vjs-gantt-day-name">{v.label}</span></> }
            {!gantt.showDayName && gantt.showDayNumber && <span>{v.day}</span>}
            {!gantt.showDayNumber && <span>{v.label}</span>}
        </>
    }

    return <>
        <div className="vjs-gantt-timeline-container">
        <div className="vjs-gantt-timeline" style={{width:`${dayRange * STEP_WIDTH}px`}}>
            {headers.map(header => <div className={`vjs-gantt-timeline-row vjs-gantt-timeline-${header.id}`} key={header.id}>
                {header.values.map(value => <div key={value.id} className="vjs-gantt-timeline-entry" style={{flexBasis:`${value.size * zoom}px`,height:`${gantt.rowHeight}px`}}>
                    {value.type === 'day' && timelineLabel(value as TimelineHeaderDayEntryValue)}
                    {value.type !== 'day' && value.label}
                </div>)}
            </div>)}
        </div>
        </div>
    </>
}
