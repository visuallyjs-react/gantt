import {EVENT_DATA_UPDATED, EVENT_REDO, EVENT_UNDO, EVENT_ZOOM, Node} from "@visuallyjs/browser-ui"
import {useContext, useEffect, useState} from "react";
import {Gantt} from "../defs.ts";
import {GanttContext} from "../GanttProvider";
import {useSurface} from "@visuallyjs/browser-ui-react";
import {TYPE_TASK_GROUP} from "../constants";
import {editTask} from "../util";

type LabelEntry = {id:string, name:string, indent:number, type:string, collapsed?:boolean}

export default function GanttLabels() {
    //
    const [entries, setEntries] = useState<Array<LabelEntry>>([])

    let {listen} = useContext(GanttContext)
    // @ts-ignore
    const [gantt, setGantt] = useState<Gantt>(null)

    const [zoom, setZoom] = useState(1)
    useSurface().then(surface => {
        surface.bind(EVENT_ZOOM, (z) => {
            setZoom(z.zoom)
        })
    })

    function repaint() {
        if (gantt != null) {
            requestAnimationFrame(() => {
                const newEntries: Array<LabelEntry> = []

                function _one(entry: Node, indent: number) {
                    const collapsed = entry.data['collapsed'] === true
                    newEntries.push({id: entry.id, name: entry.data.name, indent, type: entry.type, collapsed})
                    if (!collapsed) {
                        gantt.listSubtasks(entry).forEach(st => _one(st, indent + 1))
                    }
                }

                gantt.listTopLevelTasks().forEach(entry => {
                    _one(entry, 0)
                })

                setEntries(newEntries)
            })

        }
    }

    useEffect(repaint, [gantt])

    useEffect(() => {
        let activeGantt: Gantt | null = null;
        const undoHandler = () => repaint();
        const redoHandler = () => repaint();
        const updateHandler = () => repaint();

        listen(g => {
            activeGantt = g;
            setGantt(g);
            g.model.bind(EVENT_DATA_UPDATED, updateHandler);
            g.model.bind(EVENT_UNDO, undoHandler);
            g.model.bind(EVENT_REDO, redoHandler);
        })

        return () => {
            if (activeGantt) {
                activeGantt.model.unbind(EVENT_DATA_UPDATED, updateHandler);
                activeGantt.model.unbind(EVENT_UNDO, undoHandler);
                activeGantt.model.unbind(EVENT_REDO, redoHandler);
            }
        };
    })

    return <>
        {gantt != null && <div className="vjs-gantt-task-labels-container"><div className="vjs-gantt-task-labels">
            <div style={{height:gantt.headerSize, top:0, backgroundColor:"white", position:"sticky"}}/>
            {entries.map(entry => (
                <div key={entry.id} data-vjs-type={entry.type} className="vjs-gantt-task-label" style={{height:`${gantt.rowHeight * zoom}px`,marginLeft:`${entry.indent}rem`}}>
                    {entry.type === TYPE_TASK_GROUP && (
                        <div className="vjs-gantt-task-group-toggle" onClick={() => gantt.toggleCollapse(entry.id)}>
                            {entry.collapsed ? '+' : '-'}
                        </div>
                    )}
                    {entry.name}
                    <div className="vjs-gantt-task-label-controls">
                        <div className="vjs-gantt-task-label-edit" onClick={(e) => { e.stopPropagation(); editTask(gantt, entry.id); }}>
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
