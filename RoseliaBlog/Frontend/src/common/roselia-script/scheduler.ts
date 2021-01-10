const waitForIdle = (): Promise<() => number> => {
    const requestIdleCallback = window.requestIdleCallback
    if (requestIdleCallback) {
        return new Promise(resolve => requestIdleCallback(timeout => resolve(() => timeout.timeRemaining())))
    }
    
    // No requestIdleCallback, falling back to a window of 514 ms.
    const estimatedDeadline = +new Date() + 514;
    return new Promise(resolve => setTimeout(() => resolve(() => {
        const remaining = estimatedDeadline - (+new Date())
        return remaining < 0 ? 0 : remaining
    }), 0))
}

export type SchedulerWorker<T> = (job: T) => (T | null)
export class Scheduler<JobType> {
    private currentWork: JobType | null = null
    private isRunning: boolean = false
    private worker: SchedulerWorker<JobType>
    private workEmptyCallback?: () => void

    public constructor(worker: SchedulerWorker<JobType>) {
        this.worker = worker
    }

    public changeWorkTo(work: JobType) {
        this.currentWork = work
    }

    public summon() {
        if (!this.isRunning) {
            this.isRunning = true
            waitForIdle().then(timeout => this.workLoop(timeout))
        }
    }

    public kill() {
        this.isRunning = false;
    }

    public whenWorkIsEmpty(callback: () => void) { this.workEmptyCallback = callback; }

    private async workLoop(deadlineGetter: () => number) {
        let shouldYield = false
        while (this.currentWork && !shouldYield) {
            this.currentWork = this.worker(this.currentWork)
            shouldYield = deadlineGetter() < 1
        }

        if (!this.currentWork) this.workEmptyCallback?.();

        if (this.isRunning) {
            const timeout = await waitForIdle()
            this.workLoop(timeout)
        }
    }
}