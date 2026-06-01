export const DIALOG_NEW_TASK = "newTask"
export const DIALOG_NEW_TASK_GROUP = "newTaskGroup"
export const DIALOG_NEW_MILESTONE = "newMilestone"

export function _generateDialogTemplates() {
    return {
        [DIALOG_NEW_TASK]:{
            template:`<div class="vjs-gantt-dialog">
                                <span>Name:</span>
                                <input vjs-att="name" type="text" vjs-focus/>
                                <span>Group:</span>
                                <select vjs-att="parent">
                                    <option value="">No group</option>
                                    <r-each in="groups">
                                        <option value="{{id}}">{{name}}</option>
                                    </r-each>
                                </select>
                            </div>`,
            title:"New Task",
            cancelable:true
        },
        [DIALOG_NEW_TASK_GROUP]:{
            template:`<div class="vjs-gantt-dialog">
                                <span>Name:</span>
                                <input vjs-att="name" type="text" vjs-focus/>
                            </div>`,
            title:"New Task Group",
            cancelable:true
        },
        [DIALOG_NEW_MILESTONE]:{
            template:`<div class="vjs-gantt-dialog">
                                <span>Name:</span>
                                <input vjs-att="name" type="text" vjs-focus/>
                            </div>`,
            title:"New Milestone",
            cancelable:true
        }
    }
}
