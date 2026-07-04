
import GanttChart from "./GanttChart"
import GanttControls from "./GanttControls"
import {GanttProvider} from "./GanttProvider"
import {SurfaceProvider} from "@visuallyjs/browser-ui-react"
import GanttLabels from "./decorators/GanttLabels";
import GanttBodyDecorator from "./decorators/GanttBody";
import GanttHeaders from "./decorators/GanttHeaders.tsx";
import { useRef } from "react"


function App() {

    const labels = useRef(null)

  // const ganttOptions = {
  //   // ...
  // }

  return (<div className="vjs-gantt-main">
    <SurfaceProvider>
        <GanttProvider>
            <GanttControls/>
            <div className="vjs-gantt-body">
                <GanttLabels/>
                <div className="vjs-gantt-body-content">
                    <GanttHeaders/>
                    <GanttChart labels={labels}/>
                </div>
                <GanttBodyDecorator/>
            </div>
        </GanttProvider>
      </SurfaceProvider>
  </div>)
}

export default App
