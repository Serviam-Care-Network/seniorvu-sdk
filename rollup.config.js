import buble from 'rollup-plugin-buble';
import builtins from 'rollup-plugin-node-builtins';
import filesize from 'rollup-plugin-filesize';
import globals from 'rollup-plugin-node-globals';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import visualizer from 'rollup-plugin-visualizer';
import pkg from './package.json'; // eslint-disable-line import/extensions

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.js',
    output: {
      name: 'seniorvu',
      file: pkg.browser,
      format: 'umd',
      sourcemap: true,
    },
    plugins: [
      globals(),
      builtins(),
      resolve(),
      commonjs(),
      json({
        preferConst: true,
      }),
      buble({
        transforms: { dangerousForOf: true },
        objectAssign: true,
      }),
      filesize(),
      visualizer(),
    ],
  },

  {
    input: 'src/index.js',
    external: ['axios'],
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true },
    ],
  },
];
