import {
  VTimeline,
  VTimelineItem,
  VRow,
  VCol,
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
import RelativeDateTime from './RelativeTime';
interface CommentBase {
  id: number
  content: string | VNode
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
  components: {
    VTimeline,
    VTimelineItem,
    VRow,
    VCol,
    VChip, 
    VBtn, 
    VSlideXTransition, 
    VIcon,
    VAvatar,
    VImg
  },
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
      <v-col cols={10} sm={7} offset-sm={2}>
        {this.renderComments(this.comments as RoseliaComment[])}
      </v-col>
    )
  },
  methods: {
    renderComments(comments: RoseliaComment[]): VNode {
      return (
        <v-timeline dense align-top>
          <v-slide-x-transition group>
            {comments.map(comment => (
              <v-timeline-item
                key={comment.id}
                class="mb-3" fill-dot
                color={
                  comment.color || ((comment as WithAuthor).author ? 'accent' : '#bbbbbb')
                }
                id={`comment-${comment.id}`}
              >
                {(comment as WithAuthor).author && (comment as WithAuthor).author.avatar ? <v-avatar slot="icon">
                  <v-img src={(comment as WithAuthor).author.avatar}></v-img>
                </v-avatar> : null}
                <v-row justify={"space-between"}>
                  <v-col cols={7}>
                    {this.infoLabel(getNickname(comment), comment.color || ((comment as WithAuthor).author ? 'secondary' : '#bbbbbb'), false,
                      (this.getUsername(comment)) ? { name: 'userTimeline', params: {username: this.getUsername(comment)}} : undefined)}
                    {this.myUsername && caselessEqual(this.getUsername(comment), this.myUsername) ? (
                      this.infoLabel('You', 'accent', true)
                    ) : (
                      this.postAuthorUsername && caselessEqual(this.getUsername(comment), this.postAuthorUsername) ? (
                        this.infoLabel('Author', 'accent', true)
                      ) : null
                    )}
                    { typeof comment.content === 'string' ? (
                      <div domProps-innerHTML={comment.content}></div>
                    ) : comment.content }
                    
                    {this.canAddComment && (<v-btn text icon onClick={() => this.$emit('reply-comment', comment.id)}>
                      <v-icon>reply</v-icon>
                    </v-btn>)}
                    {this.canDeleteComment(comment) ? (<v-btn text icon color="error" small onClick={
                      () => this.$emit('delete-comment', comment.id)
                    }>
                      <v-icon>delete</v-icon>
                    </v-btn>) : null}
                  </v-col>
                  <v-col cols={5} class={"text-right"}>
                    {/* {utils.formatDate(comment.createdAt)} */}
                    <RelativeDateTime props={{date: comment.createdAt, brief: true}} />
                  </v-col>
                </v-row>
                <v-row no-gutters dense justify={"start"}>
                  <v-col cols={12}>
                    {comment.replies.length ? (
                        <div>
                          {/* <span class="subheading grey--text">{comment.replies.length === 1 ? 'Reply' : 'Replies'}:</span> */}
                          {this.renderComments(comment.replies)}
                        </div>) : null}
                  </v-col>
                </v-row>
              </v-timeline-item>
            ))}
          </v-slide-x-transition>
        </v-timeline>
      )
    },
    getUsername(c: RoseliaComment) {
      return ((cmt: WithAuthor) => cmt.author && cmt.author.username)(c as WithAuthor)
    },
    infoLabel(text: string, color: string, outline: boolean = false, to?: object) {
      const calculatingColor = (this as any).$vuetify.theme.currentTheme[color] || color
      const chip = (
        <v-chip small color={color} outlined={outline} class={{
          'ml-0': true,
          'white--text': !outline && selectByLuminance(calculatingColor, false, true, true)
        }} to={to}>{text}</v-chip>
      )
      return to ? (
        <router-link to={to}>{chip}</router-link>
      ) : chip
    }
  }
})

