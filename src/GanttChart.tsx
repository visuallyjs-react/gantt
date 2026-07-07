import {GanttOptions} from "./gantt/defs"
import {useContext, useEffect, useMemo, useRef} from "react"

import {
    registerParser, registerExporter,
    newInstance, Surface
} from "@visuallyjs/browser-ui"

import {GanttParser} from "./gantt/parser"
import {
    GANTT
} from "./gantt/constants"
import {GanttExporter} from "./gantt/exporter"

import {
    BrowserUIReactModel,
    ReactSurfaceRenderOptions,
    SurfaceComponent,
    SurfaceComponentRef
} from "@visuallyjs/browser-ui-react"

import {subtaskDataset} from "./gantt/data-generator"
import {GanttContext} from "./GanttProvider"
import {generateView} from "./view"
import { createRenderOptions } from "./gantt/render-options"
import modelOptions from "./gantt/model-options.ts";
import {createGantt} from "./gantt/gantt.ts";

export default function GanttChart(props:GanttOptions) {

    registerParser(GANTT, GanttParser)
    registerExporter(GANTT, GanttExporter)

    const model = useRef<BrowserUIReactModel>(newInstance(modelOptions))
    const surfaceComponent = useRef<SurfaceComponentRef>(null)
    const surface = useRef<Surface>(null)
    const initialized = useRef(false)

    const options:GanttOptions = Object.assign({}, props || {})

    // create a Gantt chart
    const gantt = useMemo(() => createGantt(options, model.current, () => surface.current!), [])

    // store the gantt object on the context
    useContext(GanttContext).set(gantt)

    useEffect(() => {
        if(!initialized.current) {
            initialized.current = true
            gantt.load(subtaskDataset())
        }
    })

    const viewOptions = generateView()
    const renderOptions:ReactSurfaceRenderOptions = createRenderOptions(gantt)

    return <SurfaceComponent viewOptions={viewOptions}
                          renderOptions={renderOptions}
                          ref={surfaceComponent}
                          model={model.current!} className="vjs-gantt-canvas"/>

}
