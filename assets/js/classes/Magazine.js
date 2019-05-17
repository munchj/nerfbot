const $ = require("jquery");
const c = require('../constants');

module.exports = class Magazine  {
    constructor(container_id, number_of_darts) {
        this.container = container_id;
        this.n_darts = number_of_darts;
        this.current_darts = number_of_darts;
    }

    dartUsed() {
        this.current_darts--;
        this.refresh();
    }

    reload() {
        console.log("reload");
        this.current_darts = this.n_darts;
        this.refresh();
    }

    refresh() {
        console.log("Magazine::refresh()" + this.n_darts);
        
        var html = $("<div class='darts-container'/>");
        html.append($("<div>"+ this.current_darts + "/" +  this.n_darts + "</div>"));
        //for(var i=0;i<this.current_darts;i++) {
        //    html.append($("<img class='dart' src='images/dart.png'></img>"));
        //}
        
        $(this.container).html(html);
    }
}
