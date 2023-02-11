import Vue, { CreateElement } from 'vue'
import {
  VContainer,
  VDialog,
  VCard,
  VCardTitle,
  VCardSubtitle,
  VRow,
  VCol,
  VTextField, VTextarea,
  VCardActions,
  VCardText,
  VAvatar,
  VImg,
  VBadge,
  VBtn, VIcon
} from 'vuetify/lib'
import { Component, Prop, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { INotification } from '@/common/api/notifications';
import RecursiveComments from './RecursiveComments';
import type { IRoseliaUserData } from '@/common/UserInfoManager';
import { IRoseliaUserMeta, IRoseliaPostComment } from '@/common/post-information';
import { markdown } from '../common/roselia-markdown'
import { botUserMeta, getUserMeta } from '@/common/api/user';
import { IInComechatMessage, sendMessage, getOnlineStatus } from '@/common/api/chat';
import { askStream } from '@/common/api/chaptgpt';


@Component({
  components: {
    RecursiveComments,
    VContainer,
    VDialog,
    VCard,
    VCardTitle,
    VCardSubtitle,
    VRow,
    VCol,
    VTextField, VTextarea,
    VCardActions,
    VCardText,
    VAvatar,
    VImg,
    VBadge,
    VBtn, VIcon
  }
})
export class ChatBox extends Vue {
  @Prop() username!: string;
  @Prop() dialog!: boolean;
  @Prop({default: false}) chatWithBot!: boolean;
  private targetUserMeta: IRoseliaUserMeta | undefined = undefined;
  private message: string = '';
  private isTargetUserOnline: boolean = false;
  private isMultiLine: boolean = false;
  private get dummyTargetUserMeta(): IRoseliaUserMeta {
    return {
      id: 0,
      username: this.username,
      role: 0,
      nickname: this.username
    }
  }
  
  @Getter chatHistoryOf!: (username: string) => IInComechatMessage[]

  get chatMessages() {
    return this.chatHistoryOf(this.username)
  }

  get conversation(): IRoseliaPostComment[] {
    return this.chatMessages.map((message, id) => ({
      id,
      content: markdown(message.content),
      replies: [],
      createdAt: message.createdAt ?? new Date,
      author: message.from === this.username ? (this.targetUserMeta || this.dummyTargetUserMeta) : this.myUserMeta
    }))
  }
  @Watch('conversation') onConversationChanged() {
    this.$nextTick(() => {
      const element = this.$refs.history as Element
      element.scrollTop = element.scrollHeight;
    })
  }

  get myUserData(): IRoseliaUserData | undefined {
    return this.$store.state.userData as IRoseliaUserData
  }

  get myUserMeta(): IRoseliaUserMeta | undefined {
    return this.$store.state.currentUser as IRoseliaUserMeta
  }

  addSingleConversation(message: string, isIncoming: boolean) {
    const myUsername = this.myUserData?.username || ''
    const sender = isIncoming ? this.username : myUsername
    const receiver = isIncoming ? myUsername : this.username
    const dialog: IInComechatMessage = {
      content: message,
      from: sender,
      to: receiver,
      createdAt: new Date
    }
    this.$store.commit('addChatHistory', {
      username: this.username,
      chat: dialog
    })
  }

  resetConversation() {
    this.$store.commit('resetChatHistory', this.username)
  }

  async sendMessage(message: string) {
    const messages = [...this.chatMessages]
    this.addSingleConversation(message, false)
    if (this.chatWithBot) {
      this.addSingleConversation('.', true)
      const index = this.chatMessages.length - 1
      let lastHistory = this.chatMessages[index]
      const updateChatContent = (response: string) => {
        lastHistory = {...lastHistory, content: response}
        this.$store.commit('setChatHistory', {
          index, username: lastHistory.from, chat: lastHistory
        })
      }
      let printDotTimer = setInterval(() => {
        const lastContent = lastHistory.content
        updateChatContent(lastContent.length > 6 ? '.' : `${lastContent}.`)
      }, 500)
      for await (const response of askStream(message, messages)) {
        if (printDotTimer) {
          clearInterval(printDotTimer)
          printDotTimer = 0
        }
        updateChatContent(response)
      }
    }
    else sendMessage({
      content: message,
      to: this.username,
      createdAt: new Date
    })
  }

  handleSendMessage() {
    if (!this.message) return;
    this.sendMessage(this.message)
    this.message = '';
    this.isMultiLine = false;
  }

  public render(h: CreateElement) {
    const InputComponent = this.isMultiLine ? 'v-textarea' : 'v-text-field';
    return (
      <v-dialog
        value={this.dialog}
        onInput={(v: boolean) => this.$emit('input', v)}
        width={this.conversation.length ? 1000 : 500}
        scrollable
      >
        <v-card>
          <v-card-title
            class="headline"
            primary-title
          >
            <v-badge
              bordered
              bottom
              color={this.isTargetUserOnline ? 'success' : 'grey'}
              dot
              offset-x="10"
              offset-y="10"
            >
              <v-avatar size="40">
                {this.targetUserMeta?.avatar ? <v-img src={this.targetUserMeta.avatar} /> :
                  <span>{(this.targetUserMeta?.nickname || '')[0]}</span>}
              </v-avatar>
            </v-badge>
            <span class="ma-2">Chat with @{this.username}</span>
            {!!this.chatMessages.length && <v-btn
              small
              onClick={this.resetConversation}
            >Reset</v-btn>}
          </v-card-title>
          <v-card-text style="max-height: 62vh;" ref="history">
            <v-container grid-list-md>
              <v-row wrap>
                <v-col cols="12">
                  {!!this.conversation.length && <recursive-comments
                    comments={this.conversation}
                    canAddComment={false}
                    canDeleteComment={() => false}
                    myUsername={this.myUserData?.username}
                  ></recursive-comments>}
                  {!this.conversation.length && this.targetUserMeta && (
                    <v-card>
                      <div class="d-flex flex-no-wrap justify-space-between">
                        <div>
                          <v-card-title class="headline">
                            {this.targetUserMeta.avatar && (
                              <v-avatar class="elevation-6">
                                <v-img src={this.targetUserMeta.avatar} />
                              </v-avatar>)}
                            <span class={{ 'ma-2': !!this.targetUserMeta.avatar }}>{this.targetUserMeta.nickname}</span>
                          </v-card-title>
                          <v-card-subtitle>@{this.targetUserMeta.username}</v-card-subtitle>
                          <v-card-subtitle>{this.targetUserMeta.motto}</v-card-subtitle>
                        </div>
                        
                        {this.targetUserMeta.banner && <v-avatar
                          size="180"
                          tile
                        >
                          <v-img src={this.targetUserMeta.banner}></v-img>
                        </v-avatar>}
                      </div>
                    </v-card>
                  )}
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          
          <v-card-actions>
              <InputComponent
                hide-details
                prepend-icon="question_answer"
                label={`Say Something to ${this.targetUserMeta?.nickname ?? this.username}`}
                single-line
                autofocus
                value={this.message}
                onInput={(v: string) => this.message = v}
                onKeydown={(event: KeyboardEvent) => {
                  if (event.key === 'Enter') {
                    if (event.shiftKey) this.isMultiLine = true;
                    else if (event.isComposing !== true) {
                      if (!this.isMultiLine || event.ctrlKey) this.handleSendMessage()
                    }
                  }
                }}
            />
            
            {this.isMultiLine && <v-btn
              color="primary"
              rounded
              disabled={!this.message}
              onClick={this.handleSendMessage}
            >
              <v-icon>send</v-icon>
            </v-btn>}
          </v-card-actions>
          <v-divider></v-divider>
        </v-card >
      </v-dialog >
    )
  }

  @Watch('dialog', {
    immediate: true
  }) onDialogChanged(value: boolean) {
    if (value) {
      if (this.chatWithBot) this.isTargetUserOnline = true
      else getOnlineStatus(this.username).then((onlineStatus) => {
        this.isTargetUserOnline = onlineStatus
      })
    }
  }

  public mounted() {
    if (this.chatWithBot) {
      this.targetUserMeta = botUserMeta
    }
    else getUserMeta({ username: this.username }).then((userMeta) => {
      this.targetUserMeta = userMeta
    })
  }
}
