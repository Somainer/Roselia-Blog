<template>
  <v-layout row justify-center>
    <v-dialog
      v-model="dialog"
      width="400"
    >
      <v-card>
        <v-card-title class="headline">{{ title }}</v-card-title>

        <v-card-text>
          {{ message }}
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            color="primary"
            @click="commitReject"
          >
            Disagree
          </v-btn>

          <v-btn
            color="primary"
            flat
            @click="commitConfirm"
          >
            Agree
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>
<script lang="ts" src="./CustomDialog.vue.ts"></script>
