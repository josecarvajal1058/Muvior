import { Platform } from 'react-native';

export const Palette = {
  black: '#1E1E1E',
  gray950: '#222222',
  gray900: '#2C2C2C',
  gray800: '#3E3E3E',
  gray600: '#555555',
  gray400: '#999999',
  gray200: '#CCCCCC',
  white: '#F5F5F5',
  orange: '#d9320d',
};

const coreTheme = {
  text: Palette.white,
  textSecondary: Palette.gray400,
  background: Palette.black,
  card: Palette.gray900,
  border: Palette.gray800,
  tint: Palette.orange,
  icon: Palette.gray200,
  tabIconDefault: Palette.gray400,
  tabIconSelected: Palette.orange,
};

export const Colors = {
  light: coreTheme,
  dark: coreTheme,
  core: coreTheme,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "system-ui, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});

export const F = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;
