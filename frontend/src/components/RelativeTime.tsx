import { defineComponent, computed, onMounted, onBeforeUnmount, ref, type PropType } from 'vue'
import { relativeDateTimeOn, briefRelativeDateOn, isSameDate } from '@/common/date-util'

export default defineComponent({
  name: 'relative-date-time',
  props: {
    date: { type: [Date, String] as PropType<Date | string>, required: true },
    brief: { type: Boolean, default: false }
  },
  setup(props) {
    const currentDate = ref<Date>(new Date())
    let updateLoop: number | undefined
    const ensuredDate = computed(() => new Date(props.date as any))
    const dateString = computed(() =>
      props.brief
        ? briefRelativeDateOn(ensuredDate.value, currentDate.value)
        : relativeDateTimeOn(ensuredDate.value, currentDate.value)
    )

    const setListener = () => {
      const now = new Date()
      const date = ensuredDate.value
      if (isSameDate(now, date)) {
        const secondsDiff = (now.getTime() - date.getTime()) / 1000
        const interval = (() => {
          if (secondsDiff < 60) return 1
          if (secondsDiff < 3600) return 30
          return 120
        })() * 1000
        updateLoop = window.setTimeout(() => {
          currentDate.value = new Date()
          setListener()
        }, interval)
      }
    }

    onMounted(() => setListener())
    onBeforeUnmount(() => { if (updateLoop) clearTimeout(updateLoop) })

    return () => (
      <v-tooltip location="top">
        {{
          activator: ({ props: tooltipProps }: any) => (
            <span {...tooltipProps}>{dateString.value}</span>
          ),
          default: () => <span>{ensuredDate.value.toLocaleString()}</span>
        }}
      </v-tooltip>
    )
  }
})
