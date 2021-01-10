import Vue, { VNode } from 'vue'
import { Prop, Component } from 'vue-property-decorator'
import { VTooltip } from 'vuetify/lib'

import { relativeDateTimeOn, briefRelativeDateOn, isSameDate } from '@/common/date-util'

@Component({
    components: {
        VTooltip
    }
})
export default class RelativeDateTime extends Vue {
    @Prop([Date, String])
    private readonly date!: Date

    @Prop({
        type: Boolean,
        default: false
    })
    private readonly brief!: boolean

    private currentDate: Date = new Date
    private updateLoop?: number

    public render(): VNode {
        // return this.renderTextNode(this.dateString)
        // In order to display real time string on mouse hover, we need to render a span with title attribute.
        // return (<span title={this.ensuredDate.toLocaleString()}>{this.dateString}</span>)
        return (
            <v-tooltip top scopedSlots={{
                activator: ({ on }: any) => (
                    <span on={ on }>{this.dateString}</span>
                )
            }}>
                <span>{this.ensuredDate.toLocaleString()}</span>
            </v-tooltip>)
    }

    // We decide not to render a plain text node now.
    // private renderTextNode(text: string): VNode | undefined {
    //     return this.$createElement('div', text).children?.[0]
    // }

    private get ensuredDate() {
        return new Date(this.date)
    }

    private get dateString() {
        if (this.brief) return briefRelativeDateOn(this.ensuredDate, this.currentDate)
        else return relativeDateTimeOn(this.ensuredDate, this.currentDate)
    }

    private setListener() {
        const now = new Date
        const date = this.ensuredDate
        if (isSameDate(now, date)) {
            const secondsDiff = (now.getTime() - date.getTime()) / 1000;
            const interval = (() => {
                if (secondsDiff < 60) return 1;
                if (secondsDiff < 3600) return 30;
                return 120;
            })() * 1000;
            this.updateLoop = setTimeout(() => {
                this.currentDate = new Date
                this.setListener()
            }, interval)
        }
    }

    public mounted() {
        this.setListener()
    }

    public destroyed() {
        if(this.updateLoop) clearInterval(this.updateLoop)
    }
}
