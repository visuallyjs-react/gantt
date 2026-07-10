import {useEffect, useState} from "react";
import {LabelEntry} from "../gantt/defs.ts";
import {useGantt} from "../GanttProvider";
import {useSurface, useZoom} from "@visuallyjs/browser-ui-react";
import {TYPE_TASK_GROUP} from "../gantt/constants";

export default function GanttLabels() {
    //
    const [entries, setEntries] = useState<Array<LabelEntry>>([])
    const [headerSize, setHeaderSize] = useState(0)

    const gantt = useGantt()

    const surface = useSurface()
    const zoom = useZoom(surface)

    useEffect(() => {
        if (gantt != null) {

            const repaint = () => {
                setHeaderSize(gantt.headerSize)
                setEntries(gantt.labels)
            }

            gantt.bind("update", repaint)
            repaint()
            return (() => { gantt.unbind("update", repaint) })
        }
    }, [gantt])

    return <>
        {gantt != null && <div className="vjs-gantt-task-labels-container"><div className="vjs-gantt-task-labels">
            <div style={{height:headerSize, top:0, backgroundColor:"white", position:"sticky"}}/>
            {entries.map(entry => (
                <div key={entry.id} data-vjs-type={entry.type} className="vjs-gantt-task-label" style={{height:`${gantt.rowHeight * zoom}px`,marginLeft:`${entry.indent}rem`}}>
                    {entry.type === TYPE_TASK_GROUP && (
                        <div className="vjs-gantt-task-group-toggle" onClick={() => gantt.toggleCollapse(entry.id)}>
                            {entry.collapsed ? '+' : '-'}
                        </div>
                    )}
                    {entry.name}
                    <div className="vjs-gantt-task-label-controls">
                        <div className="vjs-gantt-task-label-edit" onClick={(e) => { e.stopPropagation(); gantt.editTask(entry.id); }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </div>
                        <div className="vjs-gantt-task-label-delete" onClick={(e) => { e.stopPropagation(); gantt.removeTask(entry.id); }}>
                            ×
                        </div>
                    </div>
                </div>
            ))}
        </div></div>}
        </>
}
