import {GanttOptions} from "./gantt/defs"
import {useContext, useEffect, useMemo, useRef} from "react"

import {
    registerParser, registerExporter,
    newInstance
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
import {Gantt} from "./gantt/gantt.ts";

export default function GanttChart(props:GanttOptions) {

    registerParser(GANTT, GanttParser)
    registerExporter(GANTT, GanttExporter)

    const model = useRef<BrowserUIReactModel>(newInstance(modelOptions))
    const surfaceComponent = useRef<SurfaceComponentRef>(null)
    const initialized = useRef(false)

    const options:GanttOptions = Object.assign({}, props || {})

    // create a Gantt chart
    const gantt = useMemo(() => new Gantt(options, model.current, () => surfaceComponent.current?.getSurface()!), [])

    // store the gantt object on the context
    useContext(GanttContext).set(gantt)

    useEffect(() => {
        if(!initialized.current) {
            initialized.current = true
            gantt.load(subtaskDataset())
        }
    })

    const viewOptions = generateView(gantt)
    const renderOptions:ReactSurfaceRenderOptions = createRenderOptions(gantt)

    return <SurfaceComponent viewOptions={viewOptions}
                          renderOptions={renderOptions}
                          ref={surfaceComponent}
                          model={model.current!} className="vjs-gantt-canvas"/>

}
