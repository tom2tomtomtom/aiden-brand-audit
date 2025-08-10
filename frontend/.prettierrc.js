export default {
  // Basic formatting options
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,

  // JSX specific options
  jsxSingleQuote: true,
  jsxBracketSameLine: false,

  // Additional options
  arrowParens: 'avoid',
  endOfLine: 'lf',
  bracketSpacing: true,
  quoteProps: 'as-needed',

  // File-specific overrides
  overrides: [
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always',
      },
    },
    {
      files: '*.json',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.css',
      options: {
        singleQuote: false,
      },
    },
  ],
};