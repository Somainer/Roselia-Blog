import { defineComponent, type PropType, type VNode, h } from 'vue'
import { useTheme } from 'vuetify'
import { caselessEqual, selectByLuminance } from '@/common/helpers'
import RelativeDateTime from './RelativeTime'

interface CommentBase {
  id: number
  content: string | VNode
  replies: RoseliaComment[]
  createdAt: Date
  color?: string
  replyTo?: number
}
interface WithAuthor extends CommentBase {
  author: {
    id: number
    nickname: string
    role: number
    username: string
    avatar: string
  }
}
interface WithNickname extends CommentBase {
  nickname: string
}

type RoseliaComment = WithAuthor | WithNickname

function getNickname(rc: RoseliaComment): string {
  return (rc as WithAuthor).author ? (rc as WithAuthor).author.nickname : (rc as WithNickname).nickname
}

export default defineComponent({
  name: 'recursive-comment',
  components: { RelativeDateTime },
  props: {
    comments: { type: Array as PropType<RoseliaComment[]>, required: true },
    canAddComment: { type: Boolean, default: true },
    canDeleteComment: { type: Function as PropType<(c: RoseliaComment) => boolean>, default: () => () => false },
    postAuthorUsername: { type: String, default: '' },
    myUsername: { type: String, default: '' }
  },
  emits: ['reply-comment', 'delete-comment'],
  setup(props, { emit }) {
    const theme = useTheme()

    const getUsername = (c: RoseliaComment): string => ((c as WithAuthor).author && (c as WithAuthor).author.username) || ''

    const infoLabel = (text: string, color: string, outline: boolean = false, to?: object) => {
      const themeColor = (theme.current.value.colors as any)[color] || color
      const chip = (
        <v-chip
          size="small"
          color={color}
          variant={outline ? 'outlined' : undefined}
          class={{ 'ml-0': true, 'text-white': !outline && selectByLuminance(themeColor, false, true, true) as any }}
          to={to as any}
        >
          {text}
        </v-chip>
      )
      return to ? <router-link to={to as any}>{chip}</router-link> : chip
    }

    const renderComments = (comments: RoseliaComment[]): VNode => (
      <v-timeline density="compact" align="start">
        {comments.map(comment => (
          <v-timeline-item
            key={comment.id}
            class="mb-3"
            fill-dot
            dot-color={comment.color || ((comment as WithAuthor).author ? 'accent' : '#bbbbbb')}
            id={`comment-${comment.id}`}
          >
            {(comment as WithAuthor).author && (comment as WithAuthor).author.avatar ? {
              icon: () => (
                <v-avatar>
                  <v-img src={(comment as WithAuthor).author.avatar}></v-img>
                </v-avatar>
              )
            } : undefined}
            <v-row justify="space-between">
              <v-col cols={7}>
                {infoLabel(
                  getNickname(comment),
                  comment.color || ((comment as WithAuthor).author ? 'secondary' : '#bbbbbb'),
                  false,
                  getUsername(comment) ? { name: 'userTimeline', params: { username: getUsername(comment) } } : undefined
                )}
                {props.myUsername && caselessEqual(getUsername(comment), props.myUsername)
                  ? infoLabel('You', 'accent', true)
                  : props.postAuthorUsername && caselessEqual(getUsername(comment), props.postAuthorUsername)
                    ? infoLabel('Author', 'accent', true)
                    : null}
                {typeof comment.content === 'string'
                  ? <div innerHTML={comment.content}></div>
                  : comment.content}

                {props.canAddComment && (
                  <v-btn variant="text" icon="mdi-reply" onClick={() => emit('reply-comment', comment.id)}></v-btn>
                )}
                {props.canDeleteComment(comment) ? (
                  <v-btn variant="text" icon="mdi-delete" color="error" size="small" onClick={() => emit('delete-comment', comment.id)}></v-btn>
                ) : null}
              </v-col>
              <v-col cols={5} class="text-right">
                <RelativeDateTime date={comment.createdAt} brief={true} />
              </v-col>
            </v-row>
            <v-row no-gutters dense justify="start">
              <v-col cols={12}>
                {comment.replies && comment.replies.length ? (
                  <div>{renderComments(comment.replies)}</div>
                ) : null}
              </v-col>
            </v-row>
          </v-timeline-item>
        ))}
      </v-timeline>
    )

    return () => (
      <v-col cols={10} sm={7} offset-sm={2}>
        {renderComments(props.comments as RoseliaComment[])}
      </v-col>
    )
  }
})
