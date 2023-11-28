window.addEventListener('DOMContentLoaded', async () => {
    d3.csv('cleaned_json.csv').then(data => {
        const updateHeatmap = createHeatmap(data);
        slider.addEventListener('change', updateHeatmap);
    });
});

let heatSVG;

let isHighlighted = false;

function createHeatmap(dataset) {
//     const chartDiv = document.getElementById('chart-2');
//     const width = chartDiv.clientWidth;
//     const height = chartDiv.clientHeight;

//     heatSVG = d3.select('#chart-2').select('svg');
//     if (heatSVG.empty()) {
//         heatSVG = d3.select('#chart-2').append('svg');
//         heatSVG.attr('width', width)
//             .attr('height', height)
//             .append('g')
//             .attr('transform', `translate(${width / 2}, ${height / 2})`);
//     }

//     // Extract unique incidents for dropdown options
    const incidents = ["RADIATION","EARTHQUAKE", "DEATH", "POWER", "FIRE", "GAS", "FLOOD"];

// // Create a container for the dropdown and label
// const dropdownContainer = heatSVG.append("foreignObject")
//     // .attr("x", 200)
//     .attr("width", 500)
//     .attr("height", 60) // Adjusted height to accommodate label and dropdown
//     .append("xhtml:div")
//     .attr("class", "dropdown-container");

// // Append label to the container
// dropdownContainer.append("xhtml:label")
//     .attr("for", "incidentDropdown")
//     .style("display", "block")
//     .style("margin-bottom", "5px")
//     .text("Select Incident Type:");

// // Append dropdown to the container
// const dropdown = dropdownContainer.append("xhtml:select")
//     .attr("id", "incidentDropdown")
//     .style("width", "100%")
//     .style("height", "30px");

// // Populate dropdown options using D3
// dropdown.selectAll("option")
//     .data(incidents) // Assuming 'incidents' is your data array
//     .enter()
//     .append("xhtml:option")
//     .text(d => d)
//     .attr("value", d => d);

//     // Set initial incident
    let selectedIncident = incidents[0];

//     // // Add event listener to update selectedIncident on dropdown change
//     // dropdown.select("#incidentDropdown").on("change", function () {
//     //     selectedIncident = this.value;
//     //     updateHeatmap();
//     // });

//     // Handle change event
// dropdown.on("change", function(event) {
//     const selectedValue = d3.select(this).node().value;
//     // Add your code to handle the change event
//     selectedIncident = this.value;
//     updateHeatmap();

// });

d3.select("#chart-2 svg").remove();

const margin = { top: 10, right: 10, bottom: 50, left: 50 };
const wrapper = d3.select("#chart-2");
let { width, height } = wrapper.node().getBoundingClientRect();
console.log(height);
width = width - margin.left - margin.right;
height = height - margin.top - margin.bottom;

heatSVG = wrapper.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left-20 + "," + margin.top -20+ ")");

// Append X axis label
heatSVG.append('text')
.attr('class', 'title')
.attr('text-anchor', 'middle')
.attr('x',width*0.5)
.attr('y', 20) // Adjust position as needed
// .style("font-size","px")
.style("font-size","12px")
.text('Incident Heatmap');

    const slider = document.getElementById('dateSlider');
    slider.addEventListener('input', updateHeatmap());
    


// Create a container for the dropdown and label
const dropdownContainer = heatSVG.append("foreignObject")
    .attr("x", width*0.8)
    .attr("y", height*0.02)
    .attr("width", width*0.3)
    .attr("height", height*0.08) // Adjusted height to accommodate label and dropdown
    .append("xhtml:div")
    .attr("class", "dropdown-container");

// // Append label to the container
// dropdownContainer.append("xhtml:label")
//     .attr("for", "incidentDropdown")
//     .style("display", "block")
//     .style("margin-bottom", "5px")
//     .text("Select Incident Type:");

// Append dropdown to the container
const dropdown = dropdownContainer.append("xhtml:select")
    .attr("id", "incidentDropdown")
    .style("width", "100%")
    .style("height", "19px")
    .style("text-align","center")
    .style("font-size","10px");

// Populate dropdown options using D3
dropdown.selectAll("option")
    .data(incidents) // Assuming 'incidents' is your data array
    .enter()
    .append("xhtml:option")
    .text(d => d)
    .attr("value", d => d)
    .style("font-size","10px");

    // Handle change event
    dropdown.on("change", function(event) {
        const selectedValue = d3.select(this).node().value;
        // Add your code to handle the change event
        selectedIncident = this.value;
        updateHeatmap();

    });




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
        // .filter(d => d.location !== 'Wilson Forest')
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

    
    const intervalData = [];

    // Iterate through each location in locationData
    const uniqueData = {};
    const uniqueLocations = [];
    const uniqueIntervals = Array.from({ length: numberOfIntervals }, (_, i) => i);

        const uniqueIntervalsTime = new Array(numberOfIntervals)

        // Iterate through each location in locationData
        Object.keys(locationData).forEach(location => {
            const locationInfo = locationData[location];

            // Iterate through each time in the location
            locationInfo.time.forEach(time => {
                // Calculate the interval index for the given time
                const intervalIndex = Math.floor((time - startTime) / intervalWidth);

                if(uniqueIntervalsTime[intervalIndex] == undefined){
                    console.log(time)
                    uniqueIntervalsTime[intervalIndex] = time;
                }

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


        console.log(uniqueIntervalsTime)

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

        console.log(uniqueData)

        const heatmapData = Object.values(uniqueData);
        heatSVG.selectAll(".old-x-axis").remove();


        // Calculate interval start times
        const intervalStartTimes = Array.from({ length: numberOfIntervals }, (_, i) => new Date(startTime + i * intervalWidth));

        // Format time for display
        function formatTime(date) {
        // Example: format as 'HH:mm:ss'. You can adjust the format as needed
        return  d3.timeFormat("%B %d %I:%M %p")(date);
        }




        var x = d3.scaleBand()
            .range([0, width / 1.5])
            .domain(uniqueIntervals)
            .padding(0.01);



uniqueIntervalsTime.push(endTime);
    
heatSVG.append("g")
    .attr("class", "old-x-axis") 
    .attr("transform", "translate(120," + (height+30) + ")")
    .call(d3.axisBottom(x)
    .tickValues(uniqueIntervals) // Set the tick values to match your domain
    .tickFormat(function(d, i) {
        console.log(d, i)
        // Use customTickLabels for formatting
        return formatTime(uniqueIntervalsTime[d]);
    }))
    .selectAll("text")
    .style("text-anchor", "end") // Align text to the end of the tick
    // .attr("dx", "-.8em") // Adjust text position
    // .attr("dy", ".15em")
    .style("font-size","5px")
    .attr("transform", "rotate(-20)")
    


            

        // Build Y scales and axis:
        heatSVG.selectAll(".old-y-axis").remove();

// Build Y scales and axis:
var y = d3.scaleBand()
    .range([height, 0])
    .domain(uniqueLocations)
    .padding(0.01);
heatSVG.append("g")
    .attr("class", "old-y-axis") // Add a class to identify the old y-axis
    .attr("transform", "translate(120, 30)")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    // .style("font-size","15px");

        const maxEventCount = d3.max(heatmapData, d => d.eventCount);
        const minEventCount = 1;

        colors = ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#253494','#081d58'];

        var myColor = d3.scaleQuantile()
        .domain([0, maxEventCount/2, maxEventCount])
        .range(colors);

        heatSVG.selectAll(".legend").remove();

// Define the dimensions of the legend bar
const legendHeight = height*0.8; // Height of the vertical legend
const legendWidth = 20;  // Width of the vertical legend

// Append a legend group to your SVG
const legend2 = heatSVG.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${width-20},` + (height*0.2) + ")"); // Adjust for legend height and position

        // Create a vertical gradient for the legend
        const linearGradient = legend2.append("defs")
        .append("linearGradient")
        .attr("id", "vertical-linear-gradient")
        .attr("x1", "0%")   // Gradient goes from the top to the bottom
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

        // Define the gradient stops
        const colorRange = [minEventCount, maxEventCount];
        linearGradient.selectAll("stop")
        .data(colorRange.map((t, i, n) => ({ offset: `${100*i/(n.length-1)}%`, color: myColor(t) })))
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

        // Draw the rectangle and fill with the vertical gradient
        legend2.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#vertical-linear-gradient)");

// Add min and max value labels next to the legend
legend2.selectAll(".legend-value-text")
  .data(colorRange)
  .enter().append("text")
  .attr("class", "legend-value-text")
  .attr("x", legendWidth + 5) // Position labels to the right of the legend bar
  .attr("y", (d, i) => i * legendHeight) // Vertical position based on the height of the legend
  .attr("alignment-baseline", (d, i) => i === 0 ? "hanging" : "baseline") // Align text based on position
  .text(d => d)
  .style("font-size","15px");

// Add a label to explain the color scale, rotated for the vertical legend
legend2.append("text")
  .attr("transform", "translate(" + (legendWidth +20) + "," + (legendHeight / 2) + ") rotate(-90)") // Position and rotate text
  .attr("text-anchor", "middle") // Center the text
  .style("font-size","12px")
  .style("font-weight", "bold") // Optionally, make the text bold
  .text("← More Incidents"); // Replace with your desired text

        // Create tooltip div (no parent elements can use postition: relative or hover will not work)
        var tooltip = d3.select("#chart-2-tooltip")
        .style("opacity", 1)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")

        let rt = heatSVG.selectAll(".heatmap-rect:not(.highlighted-row)");
        console.log(rt);

        // Draw rectangles for the heatmap
        heatSVG.selectAll(".heatmap-rect").remove();
        heatSVG.selectAll(".heatmap-rect")
            .data(heatmapData)
            .enter()
            .append("rect")
            // .attr("class", "heatmap-rect")
            .attr("class", function(d) { return "heatmap-rect location-" + d.location.replace(/\s+/g, '-'); }) // Add unique class based on location

    .attr("x", function (d) { return x(d.interval)+120; })
    .attr("y", function (d) { return y(d.location)+30; })
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .style("fill", function (d) { return myColor(d.eventCount*10); })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);


    // Append X axis label
    heatSVG.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x',width*0.9)
        .attr('y', height+50) // Adjust position as needed
        // .style("font-size","px")
        .style("font-size","17px")
        .text('Time');
    // Append Y axis label
    heatSVG.append('text')
        .attr('class', 'y-axis-label')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y',  30) // Adjust position as needed
        .style("font-size","10px")
        .text(`Location`);
    

            if(isHighlighted){
                selectedregionarray.forEach(location => highlightRow(location))
            }

        // Rest of your code remains unchanged

        function mouseover(d) {
            tooltip.style("display", "block");

            if(!isHighlighted){
                this.oldFill = d3.select(this).style("fill");
                d3.select(this)
            .style("stroke", "black")
            .style("stroke-width", "5px") // Increase the stroke width
            .style("opacity", 1)
            .style("fill", d => d3.rgb(myColor(d.eventCount * 10)).brighter(0.5)); // Slightly brighten the fill color
            }
            
        }



        function mousemove(d) {
            const e = d3.event;
            tooltip
            .html(`<strong>Location: ${d.location}<br>Interval: ${d.interval}<br>Incident Count: ${d.eventCount}`)
            .style("color", "#6ae123")
            .style('left', (e.pageX + 10) + 'px')
            .style('top', (e.pageY + 10) + 'px');
        }

        function mouseleave(d) {
            tooltip.style("display", "none");
            if(!isHighlighted)
            d3.select(this)
            .style("stroke", "none")
            .style("fill", this.oldFill);
        }
    } // END updateHeatmap
    return updateHeatmap
} 
    


function highlightRow(selectedLocation) {
    isHighlighted = true;
    heatSVG.selectAll(".heatmap-rect:not(.highlighted-row)")
    .style("opacity", 0.2);
    heatSVG.selectAll(".location-" + selectedLocation.replace(/\s+/g, '-')).style("opacity", 1);
    // Highlight the selected row
    heatSVG.selectAll(".location-" + selectedLocation.replace(/\s+/g, '-')).classed("highlighted-row", true);
  }


function dehighlightAll(){
    isHighlighted = false;
    heatSVG.selectAll(".heatmap-rect").classed("highlighted-row", false);
    heatSVG.selectAll(".heatmap-rect").style("opacity", 1);
}

function dehighlightRow(selectedLocation) {
    // Highlight the selected row
    heatSVG.selectAll(".location-" + selectedLocation.replace(/\s+/g, '-')).classed("highlighted-row", false);
    heatSVG.selectAll(".location-" + selectedLocation.replace(/\s+/g, '-')).style("opacity", 0.2);
}