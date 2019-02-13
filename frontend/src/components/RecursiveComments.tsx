import {
  VTimeline,
  VTimelineItem, 
  VFlex, 
  VLayout, 
  VChip, 
  VBtn, 
  VSlideXTransition, 
  VIcon
} from 'vuetify/lib'
import * as tsx from 'vue-tsx-support'
import { VNode } from 'vue';
import utils from '@/common/utils';
interface CommentBase {
  id: number
  content: string
  replies: RoseliaComment[]
  createdAt: Date
  color: string
  replyTo: number
}
type WithAutor = CommentBase & {
  author: {
    id: number,
    nickname: string,
    role: number,
    username: string
  }
}
type WithNickname = CommentBase & {
  nickname: string
}

type RoseliaComment = WithAutor | WithNickname

function getNickname(rc: RoseliaComment) {
  return (rc as WithNickname).nickname || (rc as WithAutor).author.nickname
}

export default tsx.component({
  name: 'recursive-comment',
  props: {
    comments: {
      type: Array,
      required: true
    },
    canAddComment: {
      type: Boolean,
      default: true
    },
    canDeleteComment: {
      type: Function
    }
  },
  render(): VNode {
    return (
      <VFlex xs10 sm7 offset-sm2>
        {this.renderComments(this.comments as RoseliaComment[])}
      </VFlex>
    )
  },
  methods: {
    renderComments(comments: RoseliaComment[]): VNode {
      return (
        <VTimeline dense clipped>
          <VSlideXTransition group>
            {comments.map(comment => (
              <VTimelineItem
                key={comment.id}
                class="mb-3"
                color={
                  comment.color || ((comment as WithAutor).author ? 'accent' : '#bbbbbb')
                }
                id={`comment-${comment.id}`}
              >
                <VLayout justify-space-between>
                  <VFlex xs7>
                    <VChip
                      class="white--text ml-0"
                      color={
                        comment.color || ((comment as WithAutor).author ? 'secondary' : '#bbbbbb')
                      }
                      label
                      small
                    >{getNickname(comment)}</VChip>
                    <div domProps-innerHTML={comment.content}></div>
                    {this.canAddComment && (<VBtn flat icon onClick={() => this.$emit('reply-comment', comment.id)}>
                      <VIcon>reply</VIcon>
                    </VBtn>)}
                  </VFlex>
                  <VFlex xs5 text-xs-right>
                    {utils.formatDate(comment.createdAt)}
                    {this.canDeleteComment(comment.id) ? (<VBtn fab color="error" small onClick={
                      () => this.$emit('delete-comment', comment.id)
                    }>
                      <VIcon>delete</VIcon>
                    </VBtn>) : null}
                  </VFlex>
                </VLayout>
                <VFlex>
                  {comment.replies.length ? this.renderComments(comment.replies) : null}
                </VFlex>
              </VTimelineItem>
            ))}
          </VSlideXTransition>
        </VTimeline>
      )
    },
    processComments() {

    }
  }
})

