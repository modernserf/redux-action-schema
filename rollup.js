const rollup = require("rollup")
const buble = require("rollup-plugin-buble")

build("src/index.js", "index.js")
build("src/connector.js", "connector.js")
build("src/types/index.js", "types.js")

function build (entry, dest) {
    rollup.rollup({
        entry: entry,
        plugins: [ buble() ],
    }).then((bundle) => bundle.write({
        dest: dest,
        format: "cjs",
    })).catch((e) => {
        console.error(e)
    })
}
