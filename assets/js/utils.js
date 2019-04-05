module.exports = {
	writeCanvas: function (id, text) {
		var canvas = document.getElementById(id);
		var ctx = canvas.getContext("2d");
		ctx.font = "16px Arial";
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.fillText(text, canvas.width / 2, canvas.height / 2);
	}
};