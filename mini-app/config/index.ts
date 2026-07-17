import { defineConfig, type UserConfigExport } from '@tarojs/cli';
import path from 'path';

export default defineConfig(async (merge) => {
  const base: UserConfigExport = {
    projectName: 'egofind',
    date: '2026-7-17',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: [],
    defineConstants: {},
    copy: { patterns: [], options: {} },
    framework: 'react',
    compiler: 'webpack5',
    cache: { enable: false },
    mini: {
      postcss: {
        pxtransform: { enable: true, config: {} },
        cssModules: { enable: false },
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
    },
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
    },
  };

  if (process.env.NODE_ENV === 'development') {
    return merge({}, base, await import('./dev').then((m) => m.default));
  }
  return merge({}, base, await import('./prod').then((m) => m.default));
});
