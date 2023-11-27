window.addEventListener('DOMContentLoaded', async () => {
    d3.csv('cleaned_json.csv').then(data => {
        const updateHeatmap = createHeatmap(data);
        slider.addEventListener('change', updateHeatmap);
    });
});

function createHeatmap(dataset) {
    const chartDiv = document.getElementById('chart-2');
    const width = chartDiv.clientWidth;
    const height = chartDiv.clientHeight;

    let svg = d3.select('#chart-2').select('svg');
    if (svg.empty()) {
        svg = d3.select('#chart-2').append('svg');
        svg.attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);
    }

    // Extract unique incidents for dropdown options
    const incidents = ["RADIATION","EARTHQUAKE", "DEATH", "POWER", "FIRE", "GAS"];

    // Create dropdown options
    const dropdown = svg.append("foreignObject")
        .attr("width", 750)
        .attr("height", 30)
        .append("xhtml:body")
        .html('<select id="incidentDropdown" style="width:100%;height:100%;"></select>');

    // Append options to the dropdown
    dropdown.select("#incidentDropdown")
        .selectAll("option")
        .data(incidents)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Set initial incident
    let selectedIncident = incidents[0];

    // Add event listener to update selectedIncident on dropdown change
    dropdown.select("#incidentDropdown").on("change", function () {
        selectedIncident = this.value;
        updateHeatmap();
    });

    const slider = document.getElementById('dateSlider');
    slider.addEventListener('input', updateHeatmap());
    

    // Add event listener to update dateSliderValue on slider change
    // Update the heatmap based on selected incident and slider value
    function updateHeatmap() {
        // Filter data based on the selected incident
        const filteredData = dataset.filter(d => {
            try {
                const eventsArray = JSON.parse(d.events);
                return Array.isArray(eventsArray) && eventsArray.includes(selectedIncident);
            } catch (error) {
                return false;
            }
        });

        filteredData.sort((a, b) => a.location.localeCompare(b.location));
    
        // Get the start and end values directly from the slider
        const startTime = slider.value[0];
        const endTime = slider.value[1];
    
        // Filter data based on the time range
        const filteredAndTimeData = filteredData
        .filter(d => d.location !== '<Location with-held due to contract>')
        .filter(d => d.location !== 'Wilson Forest')
        .filter(d => {
            
            const messageTime = new Date(d.time);
            return messageTime >= startTime && messageTime <= endTime;
        });

        
        const locationData = {};

        filteredAndTimeData.forEach(d => {
            const location = d.location;
            const time = new Date(d.time);
            
            // Check if the location exists in the locationData object
            if (!locationData[location]) {
                locationData[location] = {
                    time: [],
                    eventCount: 0
                };
            }

            // Add time and increment event count for the location
            locationData[location].time.push(time);
            locationData[location].eventCount++;
        });

    // Now locationData object contains the desired information
    console.log(locationData);

    const totalTimeRange = endTime - startTime;

    // Specify the number of intervals
    const numberOfIntervals = 10;

    // Calculate the width of each interval in milliseconds
    const intervalWidth = totalTimeRange / numberOfIntervals;

    // Initialize an array to store interval data
// Initialize an array to store interval data
// Initialize an array to store interval data
const intervalData = [];

// Iterate through each location in locationData
const uniqueData = {};
const uniqueLocations = [];
const uniqueIntervals = Array.from({ length: numberOfIntervals }, (_, i) => i);

// Iterate through each location in locationData
Object.keys(locationData).forEach(location => {
    const locationInfo = locationData[location];

    // Iterate through each time in the location
    locationInfo.time.forEach(time => {
        // Calculate the interval index for the given time
        const intervalIndex = Math.floor((time - startTime) / intervalWidth);

        // Create a unique key for each combination of location and interval
        const key = location + '-' + intervalIndex;

        // Ensure that the interval index and location are in the uniqueArrays
        if (uniqueLocations.indexOf(location) === -1) {
            uniqueLocations.push(location);
        }

        // Create or update the combination in the uniqueData object
        if (!uniqueData[key]) {
            uniqueData[key] = {
                location: location,
                interval: intervalIndex,
                eventCount: 0,
            };
        }

        // Increment the eventCount for the location and interval
        uniqueData[key].eventCount += locationInfo.eventCount;
    });
});


uniqueLocations.forEach(location => {
    uniqueIntervals.forEach(intervalIndex => {
        const key = location + '-' + intervalIndex;

        // Check if the combination already exists in uniqueData
        if (!uniqueData[key]) {
            // If not, add a default entry with eventCount set to 0
            uniqueData[key] = {
                location: location,
                interval: intervalIndex,
                eventCount: 0,
            };
        }
    });
});


const heatmapData = Object.values(uniqueData);
// console.log('Unique Locations:', uniqueLocations);
// console.log('Unique Intervals:', uniqueIntervals);
// console.log(heatmapData);

// Rest of your code remains unchanged

svg.selectAll(".old-x-axis").remove();

var x = d3.scaleBand()
    .range([0, width / 1.5])
    .domain(uniqueIntervals)
    .padding(0.01);
svg.append("g")
    .attr("class", "old-x-axis") 
    .attr("transform", "translate(110," + (height / 1.5 + 105) + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end") // Align text to the end of the tick
    .attr("dx", "-.8em") // Adjust text position
    .attr("dy", ".15em");

// Build Y scales and axis:
svg.selectAll(".old-y-axis").remove();

// Build Y scales and axis:
var y = d3.scaleBand()
    .range([height / 1.5, 0])
    .domain(uniqueLocations)
    .padding(0.01);
svg.append("g")
    .attr("class", "old-y-axis") // Add a class to identify the old y-axis
    .attr("transform", "translate(110, 100)")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em");

const maxEventCount = d3.max(heatmapData, d => d.eventCount);
const minEventCount = 1;

var myColor = d3.scaleSequential()
.interpolator(d3.interpolateInferno)
.domain([minEventCount, maxEventCount]);

// Create tooltip div
var tooltip = d3.select("#chart-2")
.append("div")
.style("opacity", 0)
.attr("class", "tooltip")
.style("background-color", "white")
.style("border", "solid")
.style("border-width", "2px")
.style("border-radius", "5px")
.style("padding", "5px")

// Draw rectangles for the heatmap
svg.selectAll(".heatmap-rect").remove();
svg.selectAll(".heatmap-rect")
    .data(heatmapData)
    .enter()
    .append("rect")
    .attr("class", "heatmap-rect")
    .attr("x", function (d) { return x(d.interval)+110; })
    .attr("y", function (d) { return y(d.location)+100; })
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .style("fill", function (d) { return myColor(d.eventCount*10); })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);

// Rest of your code remains unchanged

function mouseover(d) {
    tooltip.style("opacity", 1);
    d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1)
}

function mousemove(d) {
    tooltip
        .html(`<strong>Location: ${d.location}<br>Interval: ${d.interval}<br>Incident Count: ${d.eventCount}`)
        .style("color", "#6ae123")
        .style("left", (d3.mouse(this)[0] + 10) + "px")
        .style("top", (d3.mouse(this)[1] + 600) + "px");
}

function mouseleave(d) {
    tooltip.style("opacity", 0);
    d3.select(this)
    .style("stroke", "none")

}
        }
   
    return updateHeatmap
} 
    
