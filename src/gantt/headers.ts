import {Gantt, TimelineHeaderEntry} from "./defs.ts";
import {getWeekOfYear, millisecondsToDays, MONTH_FORMAT, NARROW_DAY_FORMAT, SHORT_DAY_FORMAT} from "./util.ts";
import {ONE_WEEK_IN_MILLISECONDS, STEP_WIDTH} from "./constants.ts";

function _addTimelineDays(gantt:Gantt, headers:Array<TimelineHeaderEntry>) {
    const days = []
    const formatter = gantt.dayNameFormat === "short" ? SHORT_DAY_FORMAT : NARROW_DAY_FORMAT
    const currentDay = new Date(gantt.minValue())
    while (currentDay.getTime() < gantt.maxValue()) {
        days.push({ day:currentDay.getDate(), start:currentDay.getTime(), end:currentDay.getTime(), label:formatter.format(currentDay), size:STEP_WIDTH, id:`day_${days.length}`, type:"day"})
        currentDay.setDate(currentDay.getDate() + 1)
    }

    headers.unshift({values:days, id:"day"})
}

function _addTimelineWeeks(gantt:Gantt, headers:Array<TimelineHeaderEntry>) {
    const weeks = []

    let currentWeekDetails = getWeekOfYear(gantt.minValue())
    const currentWeek = new Date(currentWeekDetails[1])
    let currentWeekMillis = currentWeek.getTime()
    while(currentWeekMillis < gantt.maxValue()) {
        const start = Math.max(gantt.minValue(), currentWeekMillis)
        const end = Math.min(currentWeekMillis + ONE_WEEK_IN_MILLISECONDS, gantt.maxValue())
        weeks.push({
            start,
            end,
            label:`Week ${currentWeekDetails[0]}`,
            size:STEP_WIDTH * millisecondsToDays(end - start),
            id:`week_${weeks.length}`,
            type:"week"
        })
        currentWeekMillis += ONE_WEEK_IN_MILLISECONDS
        currentWeekDetails = getWeekOfYear(currentWeekMillis)

    }

    headers.unshift({values:weeks, id:"weeks"})
}

function _addTimelineMonths(gantt:Gantt, headers:Array<TimelineHeaderEntry>) {
    const months = []
    const currentMonth = new Date(gantt.minValue())
    currentMonth.setDate(1)

    let currentMonthStart = currentMonth.getTime()
    while(currentMonthStart < gantt.maxValue()) {
        const start = Math.max(gantt.minValue(), currentMonthStart)
        const monthName = MONTH_FORMAT.format(new Date(start))

        const nextMonth = new Date(currentMonthStart)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        nextMonth.setDate(1)

        const end = Math.min(gantt.maxValue(), nextMonth.getTime())
        months.push({
            start:start,
            end:end,
            label:monthName,
            size:STEP_WIDTH * millisecondsToDays(end - start),
            id:`month_${start}`,
            type:"month"
        })
        currentMonthStart = nextMonth.getTime()
    }

    headers.unshift({values:months, id:"months"})
}

function _addTimelineQuarters(gantt:Gantt, headers:Array<TimelineHeaderEntry>) {
    const quarters = []

    const startDate = new Date(gantt.minValue())
    startDate.setDate(1)
    const currentMonth = startDate.getMonth()
    let currentQuarter = Math.floor(currentMonth / 3)

    let startMonthForQuarter = currentQuarter * 3
    startDate.setMonth(startMonthForQuarter)
    startDate.setDate(1)
    let currentQuarterStart = startDate.getTime()

    while (currentQuarterStart < gantt.maxValue()) {

        const start = Math.max(gantt.minValue(), currentQuarterStart)

        currentQuarter = Math.floor(startDate.getMonth() / 3)
        const label = `Q${currentQuarter + 1} ${startDate.getFullYear()}`

        const nextQuarter = new Date(startDate)
        nextQuarter.setMonth(nextQuarter.getMonth() + 3)
        nextQuarter.setDate(1)

        const end = Math.min(gantt.maxValue(), nextQuarter.getTime())
        quarters.push({
            start:start,
            end:end,
            label,
            size:STEP_WIDTH * millisecondsToDays(end - start),
            id:`quarter_${start}`,
            type:"quarter"
        })
        currentQuarterStart = nextQuarter.getTime()
        startDate.setTime(currentQuarterStart)
    }

    headers.unshift({values:quarters, id:"quarters"})
}

export default function configureHeaders(gantt:Gantt) {
    const headers:Array<TimelineHeaderEntry> = []
    if (gantt.showDays) {
        _addTimelineDays(gantt, headers)
    }

    if (gantt.showWeekOfYear) {
        _addTimelineWeeks(gantt, headers)
    }

    if(gantt.showMonthNames) {
        _addTimelineMonths(gantt, headers)
    }

    if (gantt.showQuarter) {
        _addTimelineQuarters(gantt, headers)
    }

    return {
        dayRange:millisecondsToDays(gantt.maxValue() - gantt.minValue()),
        headers,
        headerSize:gantt.rowHeight * headers.length
    }
}
