function colorize(color, output) {
    return ['\033[', color, 'm', output, '\033[0m'].join('');
}

function date() {
	var date = new Date();
	var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
	return "[" + date.toLocaleDateString('en-US') + " " + hour + ":" + min + ":" + sec + "]";
}

module.exports = {
	error: function(print) {
		process.stdout.write(date() + " " + colorize("31", '[ERRO] ') + print + "\n");
	},

	debug: function(print) {
		process.stdout.write(date() + " " + colorize("35", '[DBUG] ') + print + "\n");
	},

	warn: function(print) {
		process.stdout.write(date() + " " + colorize("33", '[WARN] ') + print + "\n");
	},

	info: function(print) {
		process.stdout.write(date() + " " + colorize("36", '[INFO] ') + print + "\n");
	},

	success: function(print) {
		process.stdout.write(date() + " " + colorize("92", '[ OK ] ') + print + "\n");
	}
}