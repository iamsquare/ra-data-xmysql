import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import babel from 'rollup-plugin-babel';
import externals from 'rollup-plugin-node-externals';
import { eslint } from 'rollup-plugin-eslint';

import pkg from './package.json';

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: [externals({ deps: true, devDeps: false }), eslint(), json(), babel(), commonjs()]
  }
];
