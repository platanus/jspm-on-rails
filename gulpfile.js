const gulp = require("gulp");
const spawn = require("child_process").spawn;

function runCommand(command, callback) {
  command.stdout.on("data", (data) => process.stdout.write(data.toString()));
  command.stderr.on("data", (data) => process.stdout.write(data.toString()));
  command.on("close", (code) => {
    console.log(`child process exited with code ${code}`)
    callback(code);
  });
}

function commandTask(command, args) {
  return (callback) => runCommand(spawn(command, args), callback);
}

gulp.task("build", commandTask("jspm",
  [
    "bundle",
    "app/bootstrap", "app/assets/javascripts/build.js",
    "--skip-source-maps"
  ]
))
