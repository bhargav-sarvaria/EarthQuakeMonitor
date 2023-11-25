let DATA = [];

const createLineChart = (locations) => {
    d3.select("#chart5-linechart svg").remove();
    const dateExtent = document.getElementById('dateSlider').value;
    const data = DATA.filter(obj => {
        return dateExtent[0] <= obj.time_rounded && obj.time_rounded <= dateExtent[1]
    });

    const margin = { top: 10, right: 10, bottom: 50, left: 50 };
    const wrapper = d3.select("#chart5-linechart");
    let { width, height } = wrapper.node().getBoundingClientRect();
    console.log(height);
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;


    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    var color = d3.scaleOrdinal(d3.schemeCategory10);
    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisLeft(y);


    var line = d3.line()
        .x(function (d) { return x(d.time_rounded); })
        .y(function (d) { return y(d.count_of_tweets); });

    var svg = wrapper.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    color.domain(d3.keys(data[0]).filter(function (key) {
        return key !== "time_rounded" && locations.indexOf(key) > -1;
    }));

    var cities = color.domain().map(function (name) {
        return {
            name: name,
            values: data.map(function (d) {
                return {
                    time_rounded: d.time_rounded,
                    count_of_tweets: +d[name]
                };
            })
        };
    });

    x.domain(d3.extent(data, function (d) {
        return d.time_rounded;
    }));

    y.domain([
        d3.min(cities, function (c) {
            return d3.min(c.values, function (v) {
                return v.count_of_tweets;
            });
        }),
        d3.max(cities, function (c) {
            return d3.max(c.values, function (v) {
                return v.count_of_tweets;
            });
        })
    ]);


    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Temperature (ºF)");

    var city = svg.selectAll(".city")
        .data(cities)
        .enter().append("g")
        .attr("class", "city");

    city.append("path")
        .attr("class", "line")
        .attr("d", function (d) {
            return line(d.values);
        })
        .style("fill", "none")
        .style("stroke", function (d) {
            return color(d.name);
        })
        .style("stroke-width", 2);

    var mouseG = svg.append("g")
        .attr("class", "mouse-over-effects");

    mouseG.append("path") // this is the black vertical line to follow mouse
        .attr("class", "mouse-line")
        .style("stroke", "black")
        .style("stroke-width", "1px")
        .style("opacity", "0");

    var lines = document.getElementsByClassName('line');

    var mousePerLine = mouseG.selectAll('.mouse-per-line')
        .data(cities)
        .enter()
        .append("g")
        .attr("class", "mouse-per-line");

    mousePerLine.append("circle")
        .attr("r", 7)
        .style("stroke", function (d) {
            return color(d.name);
        })
        .style("fill", "none")
        .style("stroke-width", "1px")
        .style("opacity", "0");

    mousePerLine.append("text")
        .attr("transform", "translate(10,3)");

    mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
        .attr('width', width) // can't catch mouse events on a g element
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', function () { // on mouse out hide line, circles and text
            d3.select(".mouse-line")
                .style("opacity", "0");
            d3.selectAll(".mouse-per-line circle")
                .style("opacity", "0");
            d3.selectAll(".mouse-per-line text")
                .style("opacity", "0");
        })
        .on('mouseover', function () { // on mouse in show line, circles and text
            d3.select(".mouse-line")
                .style("opacity", "1");
            d3.selectAll(".mouse-per-line circle")
                .style("opacity", "1");
            d3.selectAll(".mouse-per-line text")
                .style("opacity", "1");
        })
        .on('mousemove', function () { // mouse moving over canvas
            var mouse = d3.mouse(this);

            d3.selectAll(".mouse-per-line")
                .attr("transform", function (d, i) {

                    var xDate = x.invert(mouse[0]),
                        bisect = d3.bisector(function (d) { return d.time_rounded; }).left;
                    idx = bisect(d.values, xDate);

                    d3.select(this).select('text')
                        .text(y.invert(y(d.values[idx].count_of_tweets)).toFixed(2));

                    d3.select(".mouse-line")
                        .attr("d", function () {
                            var data = "M" + x(d.values[idx].time_rounded) + "," + height;
                            data += " " + x(d.values[idx].time_rounded) + "," + 0;
                            return data;
                        });
                    return "translate(" + x(d.values[idx].time_rounded) + "," + y(d.values[idx].count_of_tweets) + ")";
                });
        });

    // Append X axis label
    svg.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height + margin.top + 30) // Adjust position as needed
        .text('Time');

    // Append Y axis label
    svg.append('text')
        .attr('class', 'y-axis-label')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 20) // Adjust position as needed
        .text('Count');
}

window.addEventListener('DOMContentLoaded', async () => {
    fetch('data/chart5.json')
        .then(response => response.json())
        .then(data => {
            var parseDate = d3.timeParse("%Y-%m-%d %H:%M");
            data.forEach(function (d) {
                d.time_rounded = parseDate(d.time_rounded);
            });

            DATA = data;
            const locations = Object.keys(data[0]).filter(key => {
                return key !== "time_rounded";
            }).sort();
            locations.forEach(location => addOption(location, location == 'Downtown'));

            var details = document.querySelector('fieldset details');
            details.addEventListener('toggle', function () {
                if (!details.open) {
                    const selectedOptions = getSelectedLocations();
                    createLineChart(selectedOptions);
                }
            });

            const selectedOptions = getSelectedLocations();
            createLineChart(selectedOptions);
        })
        .catch(error => console.error('Error fetching the JSON file:', error));

    document.getElementById('dateSlider').addEventListener('change', function () {
        // getSelectedLocations()
        createLineChart(getSelectedLocations());
    });
});


function addOption(value, checked = false) {
    var ul = document.querySelector('#chart5-container fieldset details ul');
    var li = document.createElement('li');
    var label = document.createElement('label');
    var checkbox = document.createElement('input');

    checkbox.type = 'checkbox';
    checkbox.name = 'fc';
    checkbox.value = value;
    checkbox.checked = checked;

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(value));
    li.appendChild(label);
    ul.appendChild(li);
}

function getSelectedLocations() {
    var selectedColors = [];
    var checkboxes = document.querySelectorAll('input[name="fc"]:checked');

    checkboxes.forEach(function (checkbox) { selectedColors.push(checkbox.value); });
    return selectedColors;
}

var dropdown = document.getElementById('chart5-value-dropdown');
function handleDocumentClick(event) {
    if (!dropdown.contains(event.target)) {
        dropdown.removeAttribute('open');
    }
}

document.addEventListener('click', handleDocumentClick);