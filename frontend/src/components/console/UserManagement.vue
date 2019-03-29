<template>
  <div>
    <v-btn flat @click.native="addUser.form = true">
      <v-icon>person_add</v-icon>
    </v-btn>
    <v-data-table
      :items="userList"
      :loading="loading"
      :headers="headers"
      class="elevation-1"
    >
      <v-progress-linear slot="progress" color="blue" indeterminate></v-progress-linear>
      <template slot="items" slot-scope="props">
        <td>{{ props.item.username }}</td>
        <td class="text-xs-right">
          <v-btn flat icon small :disabled="props.item.role <= 0" @click="shiftRole(props.item, -1)">-</v-btn>
          {{ props.item.role }}
          <v-btn flat icon small :disabled="props.item.role + 1 >= userData.role" @click="shiftRole(props.item, 1)">+</v-btn>
        </td>
        <td class="text-xs-right">
          <v-btn icon flat color="secondary" @click="setPasswordForm(props.item.username)">
            <v-icon>edit</v-icon>
          </v-btn>
          <v-btn icon flat color="error" @click="deleteUserForm(props.item.username)">
            <v-icon>delete</v-icon>
          </v-btn>
        </td>
      </template>
      <template v-slot:no-data>
        <div>I am sorry to announce that you can manage nobody. :(</div>
      </template>
    </v-data-table>
    <v-layout row justify-center>
      <v-dialog v-model="addUser.form" persistent max-width="500px">
        <v-card>
          <v-card-title>
            <span class="headline">Add User</span>
          </v-card-title>
          <v-card-text>
            <v-form v-model="addUser.valid">
              <v-container grid-list-md>
                <v-layout wrap>
                  <v-flex xs12>
                    <v-text-field :rules="addUser.rules" v-model="addUser.username" label="Username" required></v-text-field>
                  </v-flex>
                  <v-flex xs12>
                    <v-text-field :rules="addUser.rules" v-model="addUser.password" label="Password" type="password" required></v-text-field>
                  </v-flex>
                  <v-flex xs12 sm6>
                    <v-select
                      :items="addUser.items"
                      label="Permission Level"
                      required
                      v-model="addUser.role"
                    ></v-select>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" flat @click.native="addUser.form = false">Close</v-btn>
            <v-btn color="blue darken-1" flat @click="doAddUser"
                   :disabled="!addUser.valid" :loading="loading">Add</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog v-model="loginForm" persistent max-width="500px">
        <v-card>
          <v-card-title>
            <span class="headline">Enter Password</span>
          </v-card-title>
          <v-card-text>
            <h4>For your safety, please input your password.</h4>
            <v-container grid-list-md>
              <v-layout wrap>
                <v-flex xs12>
                  <v-text-field v-model="loginPassword" @keyup.enter="getSUToken" label="Password" type="password" required></v-text-field>
                </v-flex>
              </v-layout>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" flat @click="leave">Close</v-btn>
            <v-btn color="info" flat @click="getSUToken">OK</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>
    <v-dialog v-model="setPassword.form" persistent max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Set Password of {{setPassword.username}}</span>
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="" v-model="setPassword.valid">
            <v-container grid-list-md>
              <v-layout wrap>
                <v-flex xs12>
                  <v-text-field
                    @keyup.enter="doSetPassword"
                    :rules="addUser.rules" v-model="setPassword.password" label="Password" type="password" required></v-text-field>
                </v-flex>
              </v-layout>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" flat @click.native="setPassword.form = false">Close</v-btn>
          <v-btn color="blue darken-1" flat @click="doSetPassword"
                 :disabled="!setPassword.valid" :loading="loading">Set</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="deleteUser.form" persistent max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline error--text">Delete {{deleteUser.username}}</span>
        </v-card-title>
        <v-card-text>
          <span>Please make sure by retyping username</span>
          <v-form @submit.prevent="" v-model="deleteUser.valid">
            <v-container grid-list-md>
              <v-layout wrap>
                <v-flex xs12>
                  <v-text-field
                    @keyup.enter="doDeleteUser"
                    :rules="deleteUser.rules" v-model="deleteUser.typedUsername" label="Retype Username" required></v-text-field>
                </v-flex>
              </v-layout>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" flat @click.native="deleteUser.form = false">Close</v-btn>
          <v-btn color="error" flat @click="doDeleteUser"
                 :disabled="!deleteUser.valid" :loading="loading">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>

</template>

<script>
import utils from '../../common/utils'
export default {
  name: 'user-management',
  props: ['userData', 'toast'],
  data: function () {
    return {
      suToken: '',
      loading: false,
      userList: [],
      headers: [
        {
          text: 'Username',
          align: 'left',
          sortable: true,
          value: 'username'
        },
        {text: 'Role Level', value: 'role'},
        {text: 'Action'}

      ],
      loginForm: false,
      addUser: {
        form: false,
        username: '',
        password: '',
        role: 0,
        items: Array.from(Array(this.userData.role).keys()).map((_, i) => ({text: `Level ${i}`, value: i})),
        rules: [
          v => !!v || 'Required',
          v => (v && v.length > 4 && v.length < 20) || 'Length is not valid'
        ],
        valid: false
      },
      setPassword: {
        form: false,
        valid: false,
        username: '',
        password: ''
      },
      deleteUser: {
        form: false,
        valid: false,
        username: '',
        typedUsername: '',
        rules: [v => (v && v.toLowerCase() === this.deleteUser.username.toLowerCase()) || 'Username should be same to target user']
      },
      loginPassword: ''
    }
  },
  methods: {
    leave () {
      this.$router.go(-1)
    },
    getSUToken () {
      this.loading = true
      utils.fetchJSON(utils.apiFor('user', 'su'), 'POST', {
        password: this.loginPassword
      }).then(data => {
        this.loading = false
        if (!data.success) {
          this.toast('Wrong Password', 'error')
          this.loginPassword = ''
          return
          // return this.leave()
        }
        this.loginForm = false
        this.suToken = data.token
        utils.saveSUToken(data.token)
        this.loadUser()
      })
    },
    loadUser () {
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'list')).then(data => {
        this.loading = false
        this.userList = data
      }).catch(reason => {
        this.toast(reason, 'error')
        this.leave()
      })
    },
    doAddUser () {
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'add'), 'POST', {
        username: this.addUser.username,
        password: this.addUser.password,
        role: this.addUser.role,
        token: this.suToken
      }, false).then(data => {
        this.addUser.form = false
        this.addUser.username = ''
        this.addUser.password = ''
        this.loadUser()
      }).catch(reason => {
        this.toast(reason, 'error')
      }).finally(_ => {
        this.loading = false
      })
    },
    setPasswordForm (name) {
      this.setPassword.username = name
      this.setPassword.form = true
    },
    doSetPassword () {
      if (!this.setPassword.valid) return
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'change'), 'POST', {
        username: this.setPassword.username,
        newPassword: this.setPassword.password,
        token: this.suToken
      }, false).then(data => {
        this.toast('Why must you change the password?', 'success')
        this.setPassword.form = false
      }).catch(reason => {
        this.toast(reason, 'error')
      }).finally(_ => {
        this.loading = false
      })
    },
    deleteUserForm (name) {
      this.deleteUser.username = name
      this.deleteUser.form = true
    },
    doDeleteUser () {
      if (!this.deleteUser.valid) return
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'remove'), 'POST', {
        username: this.deleteUser.username,
        token: this.suToken
      }, false).then(data => {
        this.toast('Success!', 'success')
        this.deleteUser.form = false
        this.loadUser()
      }).catch(reason => {
        this.toast(reason, 'error')
      }).finally(_ => {
        this.loading = false
      })
    },
    shiftRole(user, shiftCount) {
      const role = user.role + shiftCount
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'change-role'), 'POST', {
        username: user.username,
        role,
        token: this.suToken
      }, false, false).then(() => {
        user.role = role
        this.loading = false
        this.toast('It feels good to change privileges, right?', 'success')
      }).catch(err => {
        this.loading = false
        this.toast('There must be something wrong', 'error')
      })
    }
  },
  mounted () {
    let token = utils.getSUToken()
    if (!this.userData.role) {
      this.toast('You are not supposed to do this.', 'warning')
      return this.leave()
    }
    this.suToken = token
    if (!token) {
      this.loginForm = true
    } else {
      this.loadUser()
    }
    if (this.$route.params.firstRun) {
      this.addUser.form = true
    }
  },
  watch: {
    'setPassword.form': function () {
      this.setPassword.password = ''
    },
    'deleteUser.form': function () {
      this.deleteUser.password = ''
    }
  }
}
</script>

<style scoped>

</style>
