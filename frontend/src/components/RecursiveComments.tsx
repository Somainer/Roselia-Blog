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
import { caselessEqual } from '@/common/helpers';
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

interface RecursiveCommentProps {
  comments: RoseliaComment[]
  canAddComment: boolean
  canDeleteComment(i: number): boolean
  postAuthorUsername?: string
  myUsername?: string
}

export default tsx.componentFactoryOf<RecursiveCommentProps>().create({
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
    },
    postAuthorUsername: String,
    myUsername: String
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
        <VTimeline dense>
          <VSlideXTransition group>
            {comments.map(comment => (
              <VTimelineItem
                key={comment.id}
                class="mb-3" fill-dot
                color={
                  comment.color || ((comment as WithAutor).author ? 'accent' : '#bbbbbb')
                }
                id={`comment-${comment.id}`}
              >
                {/* <VAvatar slot="icon">
                  <VImg src={`https://www.gravatar.com/avatar/${MD5(getNickname(comment))}?d=identicon`}></VImg>
                </VAvatar> */}
                <VLayout justify-space-between>
                  <VFlex xs7>
                    {this.infoLabel(getNickname(comment), comment.color || ((comment as WithAutor).author ? 'secondary' : '#bbbbbb'))}
                    {this.myUsername && caselessEqual(this.getUsername(comment), this.myUsername) ? (
                      this.infoLabel('You', 'accent', true)
                    ) : (
                      this.postAuthorUsername && caselessEqual(this.getUsername(comment), this.postAuthorUsername) ? (
                        this.infoLabel('Author', 'accent', true)
                      ) : null
                    )}
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
                  {comment.replies.length ? (
                  <div>
                    {/* <span class="subheading grey--text">{comment.replies.length === 1 ? 'Reply' : 'Replies'}:</span> */}
                    {this.renderComments(comment.replies)}
                  </div>) : null}
                </VFlex>
              </VTimelineItem>
            ))}
          </VSlideXTransition>
        </VTimeline>
      )
    },
    getUsername(c: RoseliaComment) {
      return ((cmt: WithAutor) => cmt.author && cmt.author.username)(c as WithAutor)
    },
    infoLabel(text: string, color: string, outline: boolean = false) {
      return (
        <VChip small color={color} label outline={outline}>{text}</VChip>
      )
    }
  }
})

