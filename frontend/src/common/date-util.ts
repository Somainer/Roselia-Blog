const ensureDate = (x: Date | string | number) => new Date(x)

export const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    // Return array of year and week number
    return weekNo;
}

export const isSameYear = (x: Date, y: Date) => x.getFullYear() === y.getFullYear()
export const isSameWeek = (x: Date, y: Date) => isSameYear(x, y) && getWeekNumber(x) === getWeekNumber(y)

export const isSameDate = (x: Date, y: Date) => {
    return x.getDate() === y.getDate() &&
        x.getMonth() === y.getMonth() &&
        x.getFullYear() === y.getFullYear();
}

const relateTimeOn = (date: Date, onDate: Date) => {
    if (isSameDate(date, onDate)) {
        const secondDiff = (onDate.getTime() - date.getTime()) / 1000;
        if (secondDiff < 10) return 'Just now'
        if (secondDiff < 60) return `${secondDiff | 0} seconds ago`
        const minuteDiff = secondDiff / 60
        if (minuteDiff < 60) {
            const minutes = minuteDiff | 0;
            if (minutes === 1) return 'One minute ago'
            return `${minutes} minutes ago`
        }
        const hourDiff = minuteDiff / 60;

        const hours = hourDiff | 0;
        if (hours === 1) return 'One hour ago'
        if (hours < 6) return `${hours} hours ago`
    }

    return date.toLocaleTimeString()
}

const relateDateOn = (date: Date, onDate: Date) => {
    if (isSameDate(date, onDate)) {
        return 'Today'
    }
    const dayDiff = (onDate.getTime() - date.getTime()) / 1000 / 60 / 60 / 24;
    const days = dayDiff | 0
    if (days === 1) return 'Yesturday'
    if (days <= 7) {
        const weeks = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const weekStr = weeks[date.getDay()];
        if (isSameWeek(date, onDate)) return weekStr
        return `Last ${weekStr}`
    }

    if (isSameYear(date, onDate)) {
        return date.toLocaleString(undefined, {
            month: "short", day: "numeric"
        })
    }
    return date.toLocaleDateString()
}

export const briefRelativeDateOn = (date: Date, onDate: Date) => {
    if (isSameDate(date, onDate)) return relateTimeOn(date, onDate)
    return relateDateOn(date, onDate)
}

export const briefRelativeDate = (date: Date | number | string) => briefRelativeDateOn(ensureDate(date), new Date)

export const relativeDateTimeOn = (date: Date, onDate: Date) => {
    if (isSameDate(date, onDate)) return relateTimeOn(date, onDate)
    return `${relateDateOn(date, onDate)} ${relateTimeOn(date, onDate)}`
}

export const realativeDateTime = (date: Date | number | string) => relativeDateTimeOn(ensureDate(date), new Date)
