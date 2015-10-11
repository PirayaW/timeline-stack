function run_timeline(data, container) {
	var all_data = data;
	var margin;
	var width, height;
	var barHeight;
	var yoffset;
	var nTicks;
	var dateFormat;
	var color;
	var tip;
	var x;
	var xAxis;
	var grid;
	var svg;
	var chart;
	var zoom;

	init(container);
	redraw(data);
}


function init(container) {
	margin = {top: 20, right: 125, bottom: 10, left: 125};
	width = $(document).width() - margin.right - margin.left; 
	height = 250 - margin.top - margin.bottom; 

	barHeight = 25;
	yoffset = 5;

	nTicks = 5;

	dateFormat = d3.time.format('%d %b, %Y');

	color = new Array();
	color['SEND REQUEST'] = "#C22326";
	color['GET MORE INFO'] = "#F37338";
	color['IN PROGRESS'] = "#FDB632";
	color['UAT'] = "#027878";
	color['CLOSE AWAITING'] = "#801638";

	tip = d3.tip()
		.attr('class', 'd3-tip')
		.offset([-10, 0])
		.html(function(d) {
			return "<strong style=\"color:yellow;\">" + d[0] + ":</strong> <span>" + d[1] + "</span><hr><span style=\"font-weight:normal; font-size:12;\">" + d[5] + "</span><hr><span style=\"font-weight:normal;\">" + dateFormat(d[2]) + " - " + dateFormat(d[3]) + "<br/>Duration: "+ getDiffDay(d[2], d[3]) + " day(s)</span>";
		});

	zoom = d3.behavior.zoom()
		.scaleExtent([1, 10])
		.on("zoom", zoomed);

	x = d3.time.scale.utc()
		.range([0, width]);

	xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.tickFormat(dateFormat)
		.ticks(nTicks);

	y = d3.scale.ordinal();

	yAxis = d3.svg.axis()
		.scale(y)
		.tickSize(0)
		.orient("left");

	grid = d3.svg.axis()
		.scale(x)
		.ticks(nTicks)
		.tickSize(-height+margin.top);

	svg = d3.select(container).append("svg")
		.attr("width", width + margin.left + margin.right)
		.call(zoom);

	chart = svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	chart.append("g")
		.attr("class", "x axis");

	chart.append("g")
		.attr("class", "grid");

	chart.append("g")
		.attr("class", "y axis")
		.append("line")
		.attr("class", "domain");

	chart.call(tip);
}

function zoomed() {
	svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function redraw(data) {
	var beginning, ending;
	var domain;

	// Calculate date range [beginning, ending]
	if(data.length == 0) { beginning = new Date(); ending = new Date(); }
	else {
		beginning = data[0][2], ending = data[0][3];	
		for (var i=0, n=data.length; i<n; i++) {
		if(data[i][2] < beginning) beginning = data[i][2];
		if(data[i][3] > ending) ending = data[i][3];
		} 
	}	
	
	// set domain
	x.domain([beginning, ending]).nice(10);
	domain = d3.set(data.map(function(d) { return d[0]; })).values();

	height = (barHeight + yoffset) * domain.length; // height is not fixed, depending on domain.length
	svg.attr("height", height + 25 + margin.top + margin.bottom); // x-axis height is 21

	y.domain(domain)
		.rangeBands([0, height], .2);

	var bar = chart.selectAll(".bar")
		.data(data);

	//** NEW BAR **//
	var barEnter = bar.enter().insert("g", "axis")
		.attr("class", "bar")
		.attr("transform", function(d) { return "translate(" + x(d[2]) + ", " + (y(d[0])) + ")"; })
		.attr("fill", function(d) { return color[d[1]]; });

	barEnter.append("rect")
		.attr("width", function(d) { return x(d[3])-x(d[2]); })
		.attr("height", function(d) { return barHeight; })
		.attr("fill", function(d) { return color[d[1]]; })
		.on('click', function(d) { window.open(d[4], '_blank'); })
		.on('mouseover', tip.show) // tooltip
		.on('mouseout', tip.hide); // tooltip;

	// text in the bar
	barEnter.append("text")
		.attr("class", "value")
		.attr("x", 3)
		.attr("y", function(d) { return domain.indexOf(d[0])+barHeight; })
		.attr("dy", ".35em")
		.attr("text-anchor", "start")
		.attr("font-weight", "bold")
		.text(function(d) { return d[1]});

	//** UPDATE BAR **//
	var barUpdate = d3.transition(bar)
		.attr("transform", function(d) { return "translate(" + x(d[2]) + ", " + (d.y0 = y(d[0])) + ")"; })
		.attr("fill", function(d) { return color[d[1]]; });

	barUpdate.select("rect")
		.attr("width", function(d) { return x(d[3])-x(d[2]); })
		.attr("height", function(d) { return barHeight; })
		.attr("fill", function(d) { return color[d[1]]; })
		.on('click', function(d) { window.open(d[4], '_blank'); });

	barUpdate.select(".value")
		.attr("x", 3)
		.attr("y", function(d) { return domain.indexOf(d[0])+barHeight/2; })
		.text(function(d) { return d[1]; });

	//** REMOVE BAR **//
	var barExit = d3.transition(bar.exit())
		.remove();
	barExit.select("rect").remove();
	barExit.select(".value").remove();
	barExit.select(".label").remove();

	chart.select(".x.axis")
		.attr("transform", "translate(0, " + height + ")")
		.call(xAxis);

	chart.select(".grid")
		.attr("transform", "translate(0," + height + ")")
		.call(grid)
		.selectAll(".tick").select("line")
		.attr("y2", -height);

	chart.select(".y.axis").select(".domain")
		.attr("y2", height);

	chart.select(".y.axis")
        .call(yAxis);

	}

// ** http://stackoverflow.com/questions/1036742/date-difference-in-javascript-ignoring-time-of-day ** //
function getDiffDay(first, second) {
	// Copy date parts of the timestamps, discarding the time parts.
	var one = new Date(first.getFullYear(), first.getMonth(), first.getDate());
	var two = new Date(second.getFullYear(), second.getMonth(), second.getDate());

	// Do the math.
	var millisecondsPerDay = 1000 * 60 * 60 * 24;
	var millisBetween = two.getTime() - one.getTime();
	var days = millisBetween / millisecondsPerDay;

	// Round down.
	return Math.floor(days);
}


