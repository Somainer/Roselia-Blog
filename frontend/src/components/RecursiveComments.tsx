import {
  VTimeline,
  VTimelineItem, 
  VFlex, 
  VLayout, 
  VChip, 
  VBtn, 
  VSlideXTransition, 
  VIcon,
  VAvatar,
  VImg
} from 'vuetify/lib'
import * as tsx from 'vue-tsx-support'
import { VNode } from 'vue';
import utils from '@/common/utils';
import { caselessEqual, selectByLuminance } from '@/common/helpers';
interface CommentBase {
  id: number
  content: string
  replies: RoseliaComment[]
  createdAt: Date
  color: string
  replyTo: number
}
interface WithAuthor extends CommentBase {
  author: {
    id: number,
    nickname: string,
    role: number,
    username: string,
    avatar: string
  }
}
interface WithNickname extends CommentBase {
  nickname: string
}

type RoseliaComment = WithAuthor | WithNickname

function getNickname(rc: RoseliaComment) {
  return hasAuthor(rc) ? rc.author.nickname : rc.nickname;
  // const nickname = (rc as WithNickname).nickname
  // return typeof nickname === 'string' ? nickname : (rc as WithAuthor).author.nickname
}

function hasAuthor(rc: RoseliaComment): rc is WithAuthor {
  return !!(rc as WithAuthor).author
}

interface RecursiveCommentProps {
  comments: RoseliaComment[]
  canAddComment: boolean
  canDeleteComment(c: RoseliaComment): boolean
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
                  comment.color || ((comment as WithAuthor).author ? 'accent' : '#bbbbbb')
                }
                id={`comment-${comment.id}`}
              >
                {(comment as WithAuthor).author && (comment as WithAuthor).author.avatar ? <VAvatar slot="icon">
                  <VImg src={(comment as WithAuthor).author.avatar}></VImg>
                </VAvatar> : null}
                <VLayout justify-space-between>
                  <VFlex xs7>
                    {this.infoLabel(getNickname(comment), comment.color || ((comment as WithAuthor).author ? 'secondary' : '#bbbbbb'), false,
                      (this.getUsername(comment)) ? { name: 'userTimeline', params: {username: this.getUsername(comment)}} : undefined)}
                    {this.myUsername && caselessEqual(this.getUsername(comment), this.myUsername) ? (
                      this.infoLabel('You', 'accent', true)
                    ) : (
                      this.postAuthorUsername && caselessEqual(this.getUsername(comment), this.postAuthorUsername) ? (
                        this.infoLabel('Author', 'accent', true)
                      ) : null
                    )}
                    <div domProps-innerHTML={comment.content}></div>
                    {this.canAddComment && (<VBtn text icon onClick={() => this.$emit('reply-comment', comment.id)}>
                      <VIcon>reply</VIcon>
                    </VBtn>)}
                    {this.canDeleteComment(comment) ? (<VBtn text icon color="error" small onClick={
                      () => this.$emit('delete-comment', comment.id)
                    }>
                      <VIcon>delete</VIcon>
                    </VBtn>) : null}
                  </VFlex>
                  <VFlex xs5 text-xs-right>
                    {utils.formatDate(comment.createdAt)}
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
      return ((cmt: WithAuthor) => cmt.author && cmt.author.username)(c as WithAuthor)
    },
    infoLabel(text: string, color: string, outline: boolean = false, to?: object) {
      const calculatingColor = (this as any).$vuetify.theme.currentTheme[color] || color
      const chip = (
        <VChip small color={color} outline={outline} class={{
          'ml-0': true,
          'white--text': !outline && selectByLuminance(calculatingColor, false, true, true)
        }} to={to}>{text}</VChip>
      )
      return to ? (
        <router-link to={to}>{chip}</router-link>
      ) : chip
    }
  }
})

