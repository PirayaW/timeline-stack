function run_stacked(data, container){
	var tip;
	var toPercent, numFormat;

	init();
	drawStackedChart(data, container);
}

function init() {
	tip = d3.tip()
		.attr('class', 'd3-tip');

	toPercent = d3.format("0.1%");
	numFormat = d3.format(",.2f");

}

function drawStackedChart(data, container) {
	d3.selectAll("svg").remove();

	data.forEach(function(d) {
		d[1] = +d[1];
		d[2] = +d[2];
		d[3] = +d[3];
	});

	var step = 25, fixpadding = 2, fixouterpadding = 10; //padding is included in step
	var margin = {top:70, right:125, bottom:10, left:275};
	var width = document.getElementById('info').offsetWidth - margin.right - margin.left;
	var height = data.length * step + 2 * fixouterpadding - fixpadding;

	var x = d3.scale.linear().range([0, width]),
		y = d3.scale.ordinal().rangeBands([0, height], fixpadding/step, fixouterpadding/step);

	var xAxis = d3.svg.axis().scale(x).orient("top").tickSize(-height),
		yAxis = d3.svg.axis().scale(y).orient("left").tickSize(0);

	var svg = d3.select(container)
			.style("width", (width + margin.right + margin.left) + "px")
			.style("height", (height + margin.top + margin.bottom) + "px")
		.append("svg")
			.attr("width", width + margin.right + margin.left)
			.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	tip.offset([0, 0])
		.html(function(d) {
			var duration = (d.y1-d.y0) * (d.y0 < 0 ? -1:1);
			return "<strong style=\"color:yellow;\">" + d.key + "</strong><br/><span style=\"color:orange;\">" + d.name + ": </span><span>" + numFormat(duration) + " (" + toPercent(duration/d.total) + ")</span>";
		});

	var color = d3.scale.ordinal()
			.range([ "#6b486b", "#a05d56", "#d0743c", "#ff8c00", "#98abc5", "#8a89a6", "#7b6888"]);

	color.domain(["Project", "Internal", "Available"]);
	var range = [1, 2, 3];

	data.forEach(function(d) {
		var y1_minus = 0, y0_plus = 0;
		var sum = 0;
		var label;
		var subtotal = d[1] + d[2] + d[3];
		d.hours = range.map(function(index) { 
			sum += Math.abs(d[index]);
			label = index == 1 ? "Project" : index == 2 ? "Internal" : "Available";
			if(d[index] >= 0) {
				return {key: d[0], name: label, y0: y0_plus, y1: y0_plus += d[index], total: subtotal}; 
			} else {
				return {key: d[0], name: label, y1: y1_minus, y0: y1_minus += d[index], total: subtotal};
			}
		});
		d.total = Math.round(sum);
	}); 

	data.sort(function(a, b) { 
		var dif = b.total - a.total;
		if(dif != 0) return dif; 
		else {
			dif = b[1] - a[1];
			if(dif != 0) return dif;
			else return b[2] - a[2];
		}
	});

	y.domain(data.map(function(d) { return d[0]; }));
	x.domain([d3.min(data, function(d) { return d3.min(d.hours, function(d) { return d.y0; }); }), d3.max(data, function(d) { return d3.max(d.hours, function(d) { return d.y1; }); })]); 
			
	svg.append("g")
		.attr("class", "x axis")
		.call(xAxis);

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);

	var bar = svg.selectAll(".bar")
			.data(data)
		.enter().append("g")
			.attr("class", "g")
			.attr("transform", function(d) { return "translate(0, " + y(d[0]) + ")"; });

	bar.selectAll("rect")
			.data(function(d) { return d.hours; })
		.enter().append("rect")
			.attr("height", y.rangeBand())
			.attr("x", function(d) { return x(d.y0); })
			.attr("width", function(d) { return x(d.y1) - x(d.y0); })
			.style("fill", function(d) { return color(d.name); })
			.on('mouseover', tip.show)
			.on('mouseout', tip.hide);

	var legend = svg.selectAll(".legend")
			.data(color.domain().slice())
		.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) { return "translate(" + (-200 + i * 75) + ", -50)"; });

	legend.append("rect")
			.attr("x", width - 50)
			.attr("width", 18)
			.attr("height", 18)
			.style("fill", color);

	legend.append("text")
			.attr("x", width - 30)
			.attr("y", 9)
			.attr("dy", ".35em")
			.style("text-anchor", "start")
			.text(function(d) { return d; });

	bar.call(tip);
}