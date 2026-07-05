import {TYPE_TASK} from "./constants.ts";

export class Dialogs {
    container: HTMLElement | null = null

    show(options: {
        title: string,
        type: string,
        initialData?: Record<string, any>,
        groups: Array<{id: string, name: string}>,
        onOK: (data: Record<string, any>) => void
    }) {
        this.container = document.createElement('div')
        this.container.className = 'vjs-gantt-modal-overlay'

        const modal = document.createElement('div')
        modal.className = 'vjs-gantt-modal'

        const header = document.createElement('div')
        header.className = 'vjs-gantt-modal-header'
        header.innerHTML = `<h3>${options.title}</h3>`
        const closeBtn = document.createElement('button')
        closeBtn.className = 'vjs-gantt-modal-close'
        closeBtn.innerHTML = '&times;'
        closeBtn.onclick = () => this.hide()
        header.appendChild(closeBtn)

        const body = document.createElement('div')
        body.className = 'vjs-gantt-modal-body'

        const nameField = document.createElement('div')
        nameField.className = 'vjs-gantt-modal-field'
        const initialName = options.initialData?.name || ''
        nameField.innerHTML = `<label>Name</label><input type="text" id="vjs-gantt-new-name" value="${initialName}">`
        body.appendChild(nameField)

        let progressSlider: HTMLInputElement | null = null
        if (options.type === TYPE_TASK) {
            const progressField = document.createElement('div')
            progressField.className = 'vjs-gantt-modal-field'
            const initialProgress = options.initialData?.progress || 0
            progressField.innerHTML = `<label>Progress</label><input type="range" id="vjs-gantt-new-progress" min="0" max="100" value="${initialProgress}">`
            progressSlider = progressField.querySelector('input')
            body.appendChild(progressField)
        }

        let groupSelect: HTMLSelectElement | null = null
        if (options.type === TYPE_TASK) {
            const groupField = document.createElement('div')
            groupField.className = 'vjs-gantt-modal-field'
            groupField.innerHTML = `<label>Group</label>`
            groupSelect = document.createElement('select')
            groupSelect.id = 'vjs-gantt-new-group'
            const initialParent = options.initialData?.parent || ''
            groupSelect.innerHTML = `<option value="">No group</option>`
            options.groups.forEach(g => {
                const opt = document.createElement('option')
                opt.value = g.id
                opt.textContent = g.name
                if (g.id === initialParent) opt.selected = true
                groupSelect!.appendChild(opt)
            })
            groupField.appendChild(groupSelect)
            body.appendChild(groupField)
        }

        const footer = document.createElement('div')
        footer.className = 'vjs-gantt-modal-footer'

        const cancelBtn = document.createElement('button')
        cancelBtn.className = 'vjs-gantt-modal-button secondary'
        cancelBtn.textContent = 'Cancel'
        cancelBtn.onclick = () => this.hide()

        const okBtn = document.createElement('button')
        okBtn.className = 'vjs-gantt-modal-button primary'
        okBtn.textContent = 'OK'
        okBtn.onclick = () => {
            const name = (document.getElementById('vjs-gantt-new-name') as HTMLInputElement).value
            const parent = groupSelect ? groupSelect.value : null
            const progress = progressSlider ? parseInt(progressSlider.value, 10) : undefined
            if (name.trim()) {
                options.onOK({ name, parent, progress })
                this.hide()
            }
        }

        footer.appendChild(cancelBtn)
        footer.appendChild(okBtn)

        modal.appendChild(header)
        modal.appendChild(body)
        modal.appendChild(footer)
        this.container.appendChild(modal)
        const parent = document.querySelector('.vjs-gantt-main') || document.body
        parent.appendChild(this.container)

        const input = document.getElementById('vjs-gantt-new-name') as HTMLInputElement
        input.focus()
        window.onkeydown = (e) => {
            if (e.key === 'Enter') okBtn.click()
            if (e.key === 'Escape') this.hide()
        }
    }

    confirm(options: {
        title: string,
        message: string,
        onOK: () => void
    }) {
        this.container = document.createElement('div')
        this.container.className = 'vjs-gantt-modal-overlay'

        const modal = document.createElement('div')
        modal.className = 'vjs-gantt-modal'

        const header = document.createElement('div')
        header.className = 'vjs-gantt-modal-header'
        header.innerHTML = `<h3>${options.title}</h3>`
        const closeBtn = document.createElement('button')
        closeBtn.className = 'vjs-gantt-modal-close'
        closeBtn.innerHTML = '&times;'
        closeBtn.onclick = () => this.hide()
        header.appendChild(closeBtn)

        const body = document.createElement('div')
        body.className = 'vjs-gantt-modal-body'
        body.innerHTML = `<p>${options.message}</p>`

        const footer = document.createElement('div')
        footer.className = 'vjs-gantt-modal-footer'

        const cancelBtn = document.createElement('button')
        cancelBtn.className = 'vjs-gantt-modal-button secondary'
        cancelBtn.textContent = 'Cancel'
        cancelBtn.onclick = () => this.hide()

        const okBtn = document.createElement('button')
        okBtn.className = 'vjs-gantt-modal-button primary'
        okBtn.textContent = 'OK'
        okBtn.onclick = () => {
            options.onOK()
            this.hide()
        }

        footer.appendChild(cancelBtn)
        footer.appendChild(okBtn)

        modal.appendChild(header)
        modal.appendChild(body)
        modal.appendChild(footer)
        this.container.appendChild(modal)
        const parent = document.querySelector('.vjs-gantt-main') || document.body
        parent.appendChild(this.container)

        okBtn.focus()
        window.onkeydown = (e) => {
            if (e.key === 'Enter') okBtn.click()
            if (e.key === 'Escape') this.hide()
        }
    }

    hide() {
        if (this.container) {
            this.container.parentElement?.removeChild(this.container)
            this.container = null
            window.onkeydown = null
        }
    }
}
