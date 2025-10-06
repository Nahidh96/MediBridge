import { createTheme, rem } from '@mantine/core';

export const mediBridgeTheme = createTheme({
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  headings: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: '600'
  },
  defaultRadius: 'md',
  primaryColor: 'teal',
  colors: {
    teal: [
      '#e6fcf5',
      '#c3fae8',
      '#96f2d7',
      '#63e6be',
      '#38d9a9',
      '#20c997',
      '#12b886',
      '#0ca678',
      '#099268',
      '#087f5b'
    ],
    brandGray: ['#f8f9fb', '#edeff4', '#dfe3ec', '#ced5df', '#b7c2d0', '#97a6b9', '#6f81a0', '#4d6282', '#384b67', '#293b55']
  },
  spacing: {
    xs: rem(8),
    sm: rem(12),
    md: rem(16),
    lg: rem(24),
    xl: rem(32)
  },
  shadows: {
    sm: '0 6px 18px rgba(20, 110, 90, 0.08)',
    md: '0 12px 32px rgba(20, 110, 90, 0.12)'
  }
});
