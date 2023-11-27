/**
 * Bar chart for resources per location
 */

const countEventsByLocation = (data, slider) => {
    const eventCountsByLocation = {};
    const dateExtent = slider.value;
    const mapSvg = document.getElementById('mapsvg');
    const selectedRegions = mapSvg?.value;
    for(const message of data){
        // Filter based on user input
        if(!(dateExtent[0] <= message.time && message.time <= dateExtent[1])
            || (selectedRegions?.length > 0 && !selectedRegions.includes(message.location))){
            continue;
        }
        const locationEventCounts = eventCountsByLocation[message.location] ??= {};
        for(const event of message.events){
            locationEventCounts[event] = (locationEventCounts[event] ?? 0) + 1;
        }
    }

    const inverse = {};
    for(const [location, eventCounts] of Object.entries(eventCountsByLocation)) {
        let total = 0;
        for(const [event, eventCount] of Object.entries(eventCounts)){
            total += eventCount;
            inverse[event] ??= {};
            inverse[event][location] = eventCount
        }
        eventCounts.total = total;
    }
    Object.defineProperties(eventCountsByLocation, {
        events: {
            enumerable: false,
            value: Object.keys(inverse).sort()
        },
        inverse: {
            enumerable: false,
            value: inverse
        },
        locations: {
            enumerable: false,
            value: Object.keys(eventCountsByLocation).sort()
        }
    });
    return eventCountsByLocation;
}

const getStackedBarData = data => {
    // const slider = document.getElementById('dateSlider');
    const eventCountsByLocation = countEventsByLocation(data, slider);
    // x-axis data
    const entries = Object.entries(eventCountsByLocation);
 
    const events = d3.stack()
        .keys(eventCountsByLocation.events)
        .value(function([location, eventCounts], event){ 
            return eventCounts[event] ?? 0;  
        } ) 
        (entries);
    
    const inverse = {};
    let max = 0;
    for(const event of events){
        const {key} = event;
        for(const location of event){
            const locationName = location.data[0]
            inverse[locationName] ??= {};
            inverse[locationName][key] = location
            max = Math.max(max, location[1]);
        }
    }

    return {
        data: Object.entries(inverse),
        x: {
            domain: [0, max],
        },
        y: {
            domain: eventCountsByLocation.locations,
        },
        events: eventCountsByLocation.events,
    };
}

const createStackedBarChart = (data) => {
    const wrapper = d3.select("#chart-4");

    const svg = wrapper
        .append("svg");

    const defs = svg.append("defs");

    const filter = defs.append("filter")
        .attr("id", "dropshadow");

    filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 4)
        .attr("result", "blur");
    filter.append("feOffset")
        .attr("in", "blur")
        .attr("dx", 2)
        .attr("dy", 2)
        .attr("result", "offsetBlur");
    filter.append("feFlood")
        .attr("in", "offsetBlur")
        .attr("flood-color", "black")
        .attr("flood-opacity", "1")
        .attr("result", "offsetColor");
    filter.append("feComposite")
        .attr("in", "offsetColor")
        .attr("in2", "offsetBlur")
        .attr("operator", "in")
        .attr("result", "offsetBlur");

    const feMerge = filter.append("feMerge");

    feMerge.append("feMergeNode")
        .attr("in", "offsetBlur")
    feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");

    const xAxis = svg.append("g");
    const xAxisLabel = svg.append("text");

    const yAxis = svg.append("g");

    window.addEventListener("resource-hover", e => {
        const resource = e.detail.resource;
        svg.selectAll(".sbc-rect")
            .filter(d => d[0] === resource)
            .attr("filter", "url(#dropshadow)");
    });

    window.addEventListener("resource-leave", e => {
        const resource = e.detail.resource;
        svg.selectAll(".sbc-rect")
            .filter(d => d[0] === resource)
            .attr("filter", "");
    });

    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 40;
    const marginLeft = 85;

    const updateChart = () => {
        const { width, height } = wrapper.node().getBoundingClientRect();
        svg
            .attr("width", width)
            .attr("height", height);

        const stackedBarData = getStackedBarData(data);

        const y = d3.scaleBand()
            .domain(stackedBarData.y.domain)
            .range([height - marginBottom, marginTop])
            .padding([0.2]);
            
        const x = d3.scaleLinear()
            .domain(stackedBarData.x.domain)
            .range([marginLeft, width - marginRight])


        // Add the x-axis.
        xAxis
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x));
        xAxisLabel
            .attr("x", "50%")
            .attr("y", height - marginBottom + 35)
            .text("Messages")

        // Add the y-axis.
        yAxis
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y));


        svg.selectAll(".sbc-bar")
            .data(stackedBarData.data, d => d[0])
            .join(enter => {
                const group = enter.append("g")
                    .attr("class", "sbc-bar");
                return group;
            })
            .selectAll(".sbc-rect")
            .data(d => Object.entries(d[1]), d => d[0])
            .join(enter => {
                const rect = enter.append("rect")
                    .attr("class", "sbc-rect")
                    .on('mouseover', function (d) {
                        const e = d3.event;
                        d3.select(window.tooltip)
                            .style('visibility', 'visible');
                        window['tooltip-name'].textContent = d[0];
                        window['tooltip-value'].textContent = `${d[1].data[1][d[0]]} messages`;
                        e.target.dispatchEvent(resourceEvent('hover', d[0]));
                    })
                    .on('mousemove', function (d) {
                        const e = d3.event;
                        const tooltip = d3.select(window.tooltip)
                            .style('left', (e.pageX + 10) + 'px')
                            .style('top', (e.pageY + 10) + 'px');
                    })
                    .on('mouseout', function (d) {
                        const e = d3.event;
                        d3.select(window.tooltip)
                            .style('visibility', 'hidden');
                        e.target.dispatchEvent(resourceEvent('leave', d[0]));
                    });
                return rect;
            })
            .transition()
            .duration(500)
            .ease(d3.easeQuad)
            .attr("y", d => y(d[1].data[0]))
            .attr("x", d => x(d[1][0]))
            .attr("width", d => x(d[1][1]) - x(d[1][0]))
            .attr("height", y.bandwidth())
            .attr("fill", d => resourceColor(d[0]));
    }
    updateChart();
    return updateChart;
}

window.addEventListener('DOMContentLoaded', async () => {
    const messages = await d3.csv('../cleaned_json.csv');
    const filtered = [];
    const invalidLocations = ['UNKNOWN', '<Location with-held due to contract>']
    for(const message of messages){
        if(invalidLocations.includes(message.location)){
            continue;
        }
        try {
            message.events = JSON.parse(message.events);
        } catch(error){
            continue;
        }
        message.events = message.events.filter(event => RESOURCES.includes(event));
        if(message.events.length <= 0){
            continue;
        }
        message.time = new Date(message.time);
        filtered.push(message);
    }
    // const slider = document.getElementById('dateSlider');
    const updateChart = createStackedBarChart(filtered);
    slider.addEventListener('change', updateChart);
    window.addEventListener('region-click', updateChart);
}, {once: true});