const test = require('eslint-config-xo-typescript/index')
const rs = test.rules['@typescript-eslint/naming-convention'];
module.exports = {
  space: 2,
  prettier: true,
  rules: {
    'new-cap':0,
    'unicorn/filename-case': "off",
    'unicorn/no-array-reduce': "off",
    'unicorn/prefer-node-protocol': "off",
    'no-bitwise': "off",
    'import/no-unassigned-import': "off",
    '@typescript-eslint/no-unsafe-assignment': "off",
    '@typescript-eslint/no-unsafe-call': "off",
    '@typescript-eslint/no-unsafe-member-access': "off",
    '@typescript-eslint/restrict-template-expressions': "off",
    '@typescript-eslint/unified-signatures': "off",
    'no-implicit-globals': "off",
    '@typescript-eslint/no-unused-vars': "off",
    '@typescript-eslint/member-ordering': "off",
    '@typescript-eslint/padding-line-between-statements': "off",
    'import/extensions': "off",
    '@typescript-eslint/naming-convention': [
      'warn',{
        selector: 'variable',
        modifiers: ['const'],
        filter: {
					regex: '[- ]',
					match: false
				},
        format:['UPPER_CASE','strictCamelCase']
      },
      {
        selector: 'variable',
        modifiers: ['destructured'],
        filter: {
					regex: '[- ]',
					match: false
				},
        format:['UPPER_CASE','strictCamelCase','PascalCase']
      },
      ...rs.slice(1),
      
    ]
  },
};
