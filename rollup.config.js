import buble from "rollup-plugin-buble"

export default {
    entry: "src/index.js",
    dest: "dist/index.js",
    format: "cjs",
    plugins: [ buble() ],
}
