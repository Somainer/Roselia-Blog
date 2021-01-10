module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    'eslint:recommended',
    '@vue/typescript'
  ],
  rules: {
    'no-console': 'off', // process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': 'off',
    'no-prototype-builtins': 'off',
    'vue/valid-v-slot': 'off',
    'vue/no-mutating-props': 'off'
  },
  parserOptions: {
      parser: '@typescript-eslint/parser'
  }
}
