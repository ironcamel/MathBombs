import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

const config = {
  input: 'src/ReactMathJax.js',
  output: [
    {
      file: 'public/javascripts/bundle.js',
      format: 'iife',
      name: 'ReactMathJax',
      globals: {
        'react': 'React',
      }
    },
  ],
  plugins: [
    commonjs(),
    resolve()
  ],
  external: ['react'],
};

export default config;
