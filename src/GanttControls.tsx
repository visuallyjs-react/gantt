import {Gantt} from "./defs"
import {useContext, useEffect, useState} from "react"
import {GanttContext} from "./GanttProvider"
import {addNewMilestone, addNewTask, addNewTaskGroup} from "./util"

export default function GanttControls() {

    let {listen} = useContext(GanttContext)
    // @ts-ignore
    const [gantt, setGantt] = useState<Gantt>(null)

    useEffect(() => {
        listen(setGantt)
    })

    return <div className="vjs-gantt-controls">
        {/*<button onClick={() => gantt.zoomToFit()}>HOME</button>*/}
        <button onClick={() => addNewTask(gantt)} title="New Task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
        </button>
        <button onClick={() => addNewTaskGroup(gantt)} title="New Task Group">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" x2="12" y1="11" y2="17"/><line x1="9" x2="15" y1="14" y2="14"/></svg>
        </button>
        <button onClick={() => addNewMilestone(gantt)} title="New Milestone">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 12l10 10 10-10L12 2Z"/><circle cx="12" cy="12" r="1"/></svg>
        </button>
        <button onClick={() => gantt.exportToConsole()} title="Export to Console">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 9 12 4 7"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
        </button>
        <button onClick={() => gantt.model.undo()} title="Undo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </button>
        <button onClick={() => gantt.model.redo()} title="Redo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
        </button>
        <button onClick={() => gantt.zoomIn()} title="Zoom In">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
        </button>
        <button onClick={() => gantt.zoomOut()} title="Zoom Out">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
        </button>
    </div>
}
