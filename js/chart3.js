//Global Variable declaration
var cleanedhimarkdata;
var svgchart3;
var himarkgeojson;
var timenodenum = 10;
var mapcolorscale;
var mapeventcount;
var mapRadius;
var chart3width;
var chart3height;
var arccounter = 0;
const MAP_COLOR_SCHEME = ["#4e79a7", "#f28e2c", "#e15759", "#59a14f", "#76b7b2", "#edc949", "#af7aa1", "#ff9da7", "#9c755f", "#bab0ab"]
var incidentlocationwise= [];
var timearray = [new Date('04/06/2020'), new Date('04/06/2020 06:00:00 AM'), new Date('04/06/2020 06:00:00 PM'), new Date('04/07/2020 06:00:00 AM'), new Date('04/07/2020 06:00:00 PM'), new Date('04/08/2020 06:00:00 AM'), new Date('04/08/2020 06:00:00 PM'), new Date('04/09/2020 06:00:00 AM'), new Date('04/09/2020 06:00:00 PM'), new Date('04/10/2020 06:00:00 AM'), new Date('04/10/2020 12:00:00 PM')];
const radialstackcolorscheme = d3.scaleOrdinal(d3.schemeCategory10);
var typesofincidents = ["FIRE","RADIATION"];
var incidentlocationwisefiltered = [


{TIMENODEVAL: 'Night 5', FIREVAL: 0, RADIATIONVAL: 0, radialx: 0, radialy: 0, TOTALVAL: 0, radialrotation: 0},
{TIMENODEVAL: 'Day 5', FIREVAL: 0, RADIATIONVAL: 0, radialx: 0, radialy: 0, TOTALVAL: 0, radialrotation: 0},{TIMENODEVAL: 'Night 1', FIREVAL: 0, RADIATIONVAL: 0, radialx: 0, radialy: 0, TOTALVAL: 0, radialrotation: 0},
{TIMENODEVAL: 'Day 1', FIREVAL: 0, RADIATIONVAL: 0, radialx: 0, radialy: 0, TOTALVAL: 0, radialrotation: 0},
{TIMENODEVAL: 'Night 2', FIREVAL: 0, RADIATIONVAL: 0, radialx: 0, radialy: 0, TOTALVAL: 0, radialrotation: 0},{TIMENODEVAL: 'Day 2', FIREVAL: 0, RADIATIONVAL: 0, radialx: 0, radialy: 0, TOTALVAL: 0, radialrotation: 0},
{TIMENODEVAL: 'Night 3', FIREVAL: 0, RADIATIONVAL: 0, radialx: 0, radialy: 0, TOTALVAL: 0, radialrotation: 0},
{TIMENODEVAL: 'Day 3', FIREVAL: 0, RADIATIONVAL: 0, radialx: 0, radialy: 0, TOTALVAL: 0, radialrotation: 0},
{TIMENODEVAL: 'Night 4', FIREVAL: 0, RADIATIONVAL: 0, radialx: 0, radialy: 0, TOTALVAL: 0, radialrotation: 0},{TIMENODEVAL: 'Day 4', FIREVAL: 0, RADIATIONVAL: 0, radialx: 0, radialy: 0, TOTALVAL: 0, radialrotation: 0}];
const timenodemarginTop = 20;
const timenodemarginRight = 50;
const timenodemarginBottom = 40;
const timenodemarginLeft = 50;
const timenodewrapper = d3.select("#dateSliderWrapper");

var timenodewidth;
var timenodeheight;
var daterange;
var xscaletimenode;


const countEventsByLocationMAP = (cleaneddata, slider) => {
    const eventCountsByLocation = {};
    const dateExtent = slider.value;
    for(const message of cleaneddata){
        // Filter based on date slider value
        if(!(dateExtent[0] <= message.time && message.time <= dateExtent[1])){
            continue;
        }
        const locationEventCounts = eventCountsByLocation[message.location] ??= {};
        if(message.events != null){
            for(const event of message.events){
                locationEventCounts[event] = (locationEventCounts[event] ?? 0) + 1;
            }
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
    incidentlocationwise = inverse;
    
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


//Function to be called on loading the document
document.addEventListener('DOMContentLoaded', function () {
    // Hint: create or set your svg element inside this function
    
 
    // This will load your two CSV files and store them into two arrays.
    Promise.all([d3.csv('cleaned_json.csv', d3.autoType), d3.json('data/StHimark.geojson')])
         .then(function (values) {
             console.log('loaded the cleaned yint data');
             
             cleanedhimarkdata = values[0];
             for(const message of cleanedhimarkdata){
                try {
                    message.events = JSON.parse(message.events);
                } catch(error){
                    message.events = [];
                }
                message.time = new Date(message.time);
            }

             himarkgeojson = values[1];
             createIncidentData();
             //renderRadial();
             constructHimarkMap();
             
             slider.addEventListener('change', updateMapColor);
             var temp =0;

             var boundingvalues= timenodewrapper.node().getBoundingClientRect();

             timenodewidth = boundingvalues.width;

             daterange = [new Date('04/06/2020'), new Date('04/10/2020 12:00:00 PM')];
             xscaletimenode = d3.scaleTime()
                    .domain(daterange)
                    .range([timenodemarginLeft, timenodewidth - timenodemarginRight]);


 
             
         });
 });


function updateMapColor(){
    mapeventcount = countEventsByLocationMAP(cleanedhimarkdata,slider);

    mapcolorscale = d3.scaleOrdinal()
            .domain(mapeventcount.events)
            .range(MAP_COLOR_SCHEME);
    svgchart3.selectAll("path.map").each(function(d, i) {
        const currregion = d3.select(this);

        // Access the attribute value of the current circle
        const currregionname = currregion.attr("regionname");
        
        var currrow = mapeventcount[currregionname];
        let maxLabel = null;
        let maxValue = -Infinity;

        for (const label in currrow) {
            if (currrow[label] > maxValue && label != "total" && RESOURCES.includes(label)) {
                maxLabel = label;
                maxValue = currrow[label];
            }
        }
        var currregiontitle = currregion.select("title");
        currregiontitle.text("Area Name: " + currregionname + "\n" + "Most Demanded Resource: " + (maxLabel != null ? maxLabel : ""));
        currregion.transition()
        .duration(3000).style("fill", d => resourceColor(maxLabel));
        
    });
}

function constructHimarkMap(){
    

    var chart3Div = document.getElementById('chart-3');
     chart3width = chart3Div.clientWidth;  // Get the width of the div
     chart3height = chart3Div.clientHeight; // Get the height of the div
    
    var relativeCenterX = 0.5; // 50% from the left
var relativeCenterY = 0.5; // 50% from the top

// Calculate the actual center point based on the division size
var centerCoordinates = [
    (chart3width),
    (chart3height)
];

    svgchart3 = d3.select('#chart-3').select('svg');
    if (svgchart3.empty()) {
        svgchart3 = d3.select('#chart-3').append('svg');
        svgchart3.attr('width', chart3width)
           .attr('height', chart3height)
           .attr("id", "mapsvg")
           .append('g')
           .attr('transform', `translate(${chart3width / 2}, ${chart3height / 2})`);
    }
    // renderRadial();
    
    // Create a projection
    var projection = d3.geoMercator()
        .fitSize([chart3width/2, chart3height/2], himarkgeojson)
        ;

    // Create a path generator
    var path = d3.geoPath().projection(projection);

    // Draw the map
    svgchart3.selectAll("path.map")
        .data(himarkgeojson.features)
        .enter()
        .append("path")
        .attr("class", "map")
        .attr("d", path)
        .attr("regionname",d => d.properties.Nbrhood)
        .attr("regionid",d => d.properties.Id)
        .attr("stroke", "black") // Set the stroke color to blue
        .attr("stroke-width", 1)
        .attr('transform', `translate(${chart3width / 4}, ${chart3height / 4})`)
        .style("opacity", "1.0")
        .on("click", handleRegionClick)
        .append("title")
        .text(d => "Area Name: " + d.properties.Nbrhood + "\n" + "Most Demanded Resource: ")
        ;

        // Append text labels for each region
svgchart3.selectAll("text.label")
.data(himarkgeojson.features)
.enter()
.append("text")
.attr("class", "label")
.attr("transform", d => {
    const centroid = path.centroid(d);
    var textrotationangle = 0;
    var textlableval = d.properties.Nbrhood;
    if(textlableval == "Wilson Forest" ){
        textrotationangle = -90;
    }
    else if(textlableval == "Scenic Vista" ){
        textrotationangle = -25;
    }
    else if(textlableval == "Chapparal" ){
        textrotationangle = -90;
    }
    return `translate(${centroid[0] + chart3width / 4},${centroid[1] + chart3height / 4}) rotate(${textrotationangle})`;
})
.text(d => d.properties.Nbrhood)
.style("text-anchor", "middle") // Center the text
.style("font-size", "10px") // Adjust font size as needed
.style("font-weight", "bold") // Set font weight to bold if needed
.style("fill", "white"); // Set text color


     mapRadius = (chart3height / 4)* 1.4;
    // Draw the circle around the map
    svgchart3.append("circle")
        .attr("cx", chart3width / 2)
        .attr("cy", chart3height / 2)
        .attr("r", mapRadius)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-dasharray", "5,5");


        const timenodes = [];
        for (let i = 0; i < timenodenum; i++) {
            const angle = (i / timenodenum) * 2 * Math.PI;
            const x = (chart3width / 2) + Math.cos(angle) * mapRadius;
            const radx = (chart3width / 2) + Math.cos(angle) * mapRadius;
            const y = (chart3height / 2) + Math.sin(angle) * mapRadius;
            const rady = (chart3height / 2) + Math.sin(angle) * mapRadius;
            
            var nodename = "";
            var nodecolor = "black";
            var nodestarttime = timearray[i];
            var nodeendtime = timearray[i+1];
            if(i%2 == 1){
                nodename = "Day " + (parseInt(i/2) + 1).toString();
                nodecolor = "yellow";
            }
            else{
                nodename = "Night " + (parseInt(i/2) + 1).toString();
                nodecolor = "black";
            }

            const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === nodename);
            if (timenodeindex !== -1) {
            incidentlocationwisefiltered[timenodeindex].radialx = radx;
            incidentlocationwisefiltered[timenodeindex].radialy = rady;
            incidentlocationwisefiltered[timenodeindex].radialrotation = angle;
            }

            timenodes.push({x, y, nodename, nodecolor, nodestarttime, nodeendtime});
        }
    
        // Draw the nodes and create curved lines to country centroids
        svgchart3.selectAll("circle.node")
            .data(timenodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 20) 
            .attr("id", d => d.nodename)
            .attr("nodestarttime", d => d.nodestarttime)
            .attr("nodeendtime", d => d.nodeendtime)
            .attr("fill", d => d.nodecolor)
            .on("click", handleTimeNodeClick)
            .append("title")
            .text(d => d.nodename + "\n" + "Start Time: " + d.nodestarttime.toString() +  "\n" + "End Time: " + d.nodeendtime.toString())
            ;

            svgchart3.selectAll("text.node")
    .data(timenodes)
    .enter()
    .append("text")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("dy", ".35em") // Adjust the vertical position as needed
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("fill", d => (d.nodecolor === "black") ? "white" : "black") // Adjust the color as needed
    .text(function(d) { return parseInt((d.nodename).match(/\d+/)[0]); });


            mapeventcount = countEventsByLocationMAP(cleanedhimarkdata,slider);

            mapcolorscale = d3.scaleOrdinal()
            .domain(mapeventcount.events)
            .range(MAP_COLOR_SCHEME);

            svgchart3.selectAll("path").each(function(d, i) {
                const currregion = d3.select(this);
                const currregiontitle = currregion.select("title");
                // Access the attribute value of the current circle
                const currregionname = currregion.attr("regionname");
                
                var currrow = mapeventcount[currregionname];
                let maxLabel = null;
                let maxValue = -Infinity;

                for (const label in currrow) {
                    if (currrow[label] > maxValue && label != "total" && RESOURCES.includes(label)) {
                        maxLabel = label;
                        maxValue = currrow[label];
                    }
                }

                currregion.style("fill", d => resourceColor(maxLabel));
                currregiontitle.text("Area Name: " + currregionname + "\n" + "Most Demanded Resource: " + (maxLabel != null ? maxLabel : ""));
            });
    
    
    constructDayNightLabels();
    constructRadialLabels();
renderRadial();

}

function constructRadialLabels(){
    // Define legend data
const elementLegendData = [
    { elementLabel: "Fire", elementColor: "purple" },
    { elementLabel: "Radiation", elementColor: "orange" }
  ];
  
  // Add legend group
  const elementLegend = svgchart3.append("g")
    .attr("class", "element-legend")
    .attr("transform", "translate("+ chart3width * 0.8 +  "," + chart3height * 0.4 + ")"); // Adjust the translate values as needed
  
  // Add legend title
  elementLegend.append("text")
  .attr("x", -10)
  .attr("y", -30)
    .text("Element Type")
    .attr("font-weight", "bold");
  
  // Add legend items
  const elementLegendItems = elementLegend.selectAll(".element-legend-item")
    .data(elementLegendData)
    .enter().append("g")
    .attr("class", "element-legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);
  
  // Add colored rectangles
  elementLegendItems.append("rect")
  .attr("x", -10)
    .attr("y", -8)
    .attr("width", 16) // Adjust the width as needed
    .attr("height", 16) // Adjust the height as needed
    .style("fill", d => d.elementColor);
  
  // Add text labels
  elementLegendItems.append("text")
    .attr("x", 10) // Adjust the distance between rectangle and text
    .attr("y", 4) // Adjust the vertical alignment
    .text(d => d.elementLabel);
}

function constructDayNightLabels(){
    // Define legend data
const legendData = [
    { label: "Day", color: "yellow" },
    { label: "Night", color: "black" }
  ];
  
  // Add legend group
  const legend = svgchart3.append("g")
    .attr("class", "legend")
    .attr("transform", "translate("+ chart3width * 0.8 +  "," + chart3height * 0.2 + ")"); // Adjust the translate values as needed
  
  // Add legend title
  legend.append("text")
    .attr("x", -10)
    .attr("y", -30)
    .text("Time Node Color")
    .attr("font-weight", "bold");
  
  // Add legend items
  const legendItems = legend.selectAll(".legend-item")
    .data(legendData)
    .enter().append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);
  
  // Add colored circles
  legendItems.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 8) // Adjust the radius as needed
    .style("fill", d => d.color);
  
  // Add text labels
  legendItems.append("text")
    .attr("x", 15) // Adjust the distance between circle and text
    .attr("y", 4) // Adjust the vertical alignment
    .text(d => d.label);
}

function renderRadial(){
    // Chart dimensions

var innerRadius = mapRadius *1.1;
var outerRadius = mapRadius * 1.4;

var svgWidth = 500;
var svgHeight = 500;

// Create an SVG container in the body of the document
var svg = d3.select('#chart-3').select('svg');
// Create scales
var angleScale = d3.scaleBand()
  .domain(incidentlocationwisefiltered.map(function(d) { return d.TIMENODEVAL; }))
  .range([0, 2 * Math.PI]);

var radiusScale = d3.scaleLinear()
  .domain([0, d3.max(incidentlocationwisefiltered, function(d) { return d.FIREVAL + d.RADIATIONVAL; })])
  .range([innerRadius, outerRadius]);

// Stack the data
var radstackedData = d3.stack()
  .keys(['RADIATIONVAL','FIREVAL'])(incidentlocationwisefiltered);

// Create arcs
var arc = d3.arc()
  .innerRadius(function(d) { return radiusScale(d[0]); })
  .outerRadius(function(d) { return radiusScale(d[1]); })
  .startAngle(function(d) { return angleScale(d.data.TIMENODEVAL); })
  .endAngle(function(d) { return angleScale(d.data.TIMENODEVAL) + angleScale.bandwidth(); });


// Add arcs to the chart
svg.selectAll('g.radial-chart')
        .data(radstackedData)
        .enter().append('g')
        .attr('class', 'radial-chart')
        .selectAll('path')
        .data(function (d) { return d; })
        .enter().append('path')
  .attr('d', function(d) {
    try {
        console.log(d);
        
      return arc(d);
    } catch (error) {
      console.error("Error generating arc:", error);
      // You can handle the error here, e.g., by providing a fallback or logging the error.
      // For now, returning an empty string to skip rendering the arc.
      return "";
    }
  })
  .attr('fill', function(d, i) { return d[0] === 0 ? 'orange' : 'purple'; })
  .attr('transform', `translate(${chart3width / 2}, ${chart3height / 2})`)
  .append("title")
  .text(d => "Time Segment: " + d.data.TIMENODEVAL + "\n" + "Incident Type: " + arccounterIncidentType() + "\n" + "Incident Count: " + findIncidentCount(d.data));

}

function arccounterIncidentType(){
    if(arccounter < 10){
        arccounter++;
        return "RADIATION";
    }
    else if(arccounter >= 10 && arccounter < 20){
        arccounter++;
        return "FIRE";

    }
    else{
        arccounter++;
        return "FIRE";
    }
}

function findIncidentCount(incdata){
    var inccountstring = "undefined";
    if(arccounter < 10){
     inccountstring = incdata.RADIATIONVAL.toString();
    }
    else if(arccounter >= 10 && arccounter < 20){
        inccountstring = incdata.FIREVAL.toString();

    }
    else{
        inccountstring = incdata.FIREVAL.toString();
    }
    return inccountstring;
}

function handleLineChart(regionName, check){

    if(regionName===""){
        LOCATIONS.forEach(location =>{
            var checkboxToCheck = document.querySelector(`input[value="${location}"]`);
            checkboxToCheck.checked = check;
        } );
    }else{
        var checkboxToCheck = document.querySelector(`input[value="${regionName}"]`);
        checkboxToCheck.checked = check;
    }

    const selectedOptions = getSelectedLocations();
    console.log(selectedOptions);
    createLineChart(selectedOptions['selectedLocations'], selectedOptions['selectedMeasures'][0]);
}

function handleRegionClick(){

    if(selectedregionarray.length == 0){
    LOCATIONS.forEach(location =>{
        console.log(`input[value="${location}"]`)
        var checkboxToCheck = document.querySelector(`input[value="${location}"]`);
        checkboxToCheck.checked = false;
    } );}

    var currregion = d3.select(this);
    var currregionname = currregion.attr("regionname");
    if(selectedregionarray.includes(currregionname)){
        selectedregionarray = selectedregionarray.filter(item => item !== currregionname);
        currregion.style("opacity", "1.0");
        
        handleLineChart(currregionname, false);
    }
    else{
        selectedregionarray.push(currregionname);
        currregion.style("opacity", "0.5");
        handleLineChart(currregionname, true);
    }

    updateWordCloud();
    if(selectedregionarray.length == 0){
        handleLineChart("", true);
    }

    
}

function handleTimeNodeClick(){
    

    var currtimenode = d3.select(this);
    var currstarttime = currtimenode.attr("nodestarttime");
    var currendtime = currtimenode.attr("nodeendtime");

    slider.value = [new Date(currstarttime), new Date(currendtime)];
    var minxcoordinate = xscaletimenode(new Date(currstarttime));
    var maxxcoordinate = xscaletimenode(new Date(currendtime));

    const timedraggableElements = d3.selectAll(".draggable").nodes();

    // Select the first element
    var leftslider = timedraggableElements[0]; 
    var rightslider = timedraggableElements[1];

    const circlesInLeftSlider = d3.select(leftslider).selectAll("circle");

    // Set the cx attribute of all circles to a certain value, e.g., 50
    circlesInLeftSlider.attr("cx", minxcoordinate);

    const circlesInRightslider = d3.select(rightslider).selectAll("circle");

    // Set the cx attribute of all circles to a certain value, e.g., 50
    circlesInRightslider.attr("cx", maxxcoordinate);

    const rectsInLeftSlider = d3.select(leftslider).selectAll("rect");
    rectsInLeftSlider.attr("x", (minxcoordinate - (2 / 2)));

    const rectsInRightSlider = d3.select(rightslider).selectAll("rect");
    rectsInRightSlider.attr("x", (maxxcoordinate - (2 / 2)));

    const svgElement = document.getElementById('dateSlider');

// Create a new event
const changeEvent = new Event('change', { bubbles: true });

slider.dispatchEvent(changeEvent);
// Dispatch the event on the SVG element
svgElement.dispatchEvent(changeEvent);



}

function createIncidentData(){
    for(const message of cleanedhimarkdata){
        // Filter based on date slider value

        if(timearray[0] <= message.time && message.time < timearray[1]){
            if(message.events != null){
                for(const event of message.events){
                    if(event == "FIRE"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Night 1');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].FIREVAL += 1;
                        } 
                    }
                    else if(event == "RADIATION"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Night 1');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].RADIATIONVAL += 1;
                        } 
                    }
                }
            }
        }
        else if(timearray[1] <= message.time && message.time < timearray[2]){
            if(message.events != null){
                for(const event of message.events){
                    if(event == "FIRE"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Day 1');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].FIREVAL += 1;
                        } 
                    }
                    else if(event == "RADIATION"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Day 1');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].RADIATIONVAL += 1;
                        } 
                    }
                }
            }
        }
        else if(timearray[2] <= message.time && message.time < timearray[3]){
            if(message.events != null){
                for(const event of message.events){
                    if(event == "FIRE"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Night 2');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].FIREVAL += 1;
                        } 
                    }
                    else if(event == "RADIATION"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Night 2');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].RADIATIONVAL += 1;
                        } 
                    }
                }
            }
        }
        else if(timearray[3] <= message.time && message.time < timearray[4]){
            if(message.events != null){
                for(const event of message.events){
                    if(event == "FIRE"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Day 2');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].FIREVAL += 1;
                        } 
                    }
                    else if(event == "RADIATION"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Day 2');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].RADIATIONVAL += 1;
                        } 
                    }
                }
            }
        }
        else if(timearray[4] <= message.time && message.time < timearray[5]){
            if(message.events != null){
                for(const event of message.events){
                    if(event == "FIRE"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Night 3');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].FIREVAL += 1;
                        } 
                    }
                    else if(event == "RADIATION"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Night 3');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].RADIATIONVAL += 1;
                        } 
                    }
                }
            }
        }
        else if(timearray[5] <= message.time && message.time < timearray[6]){
            if(message.events != null){
                for(const event of message.events){
                    if(event == "FIRE"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Day 3');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].FIREVAL += 1;
                        } 
                    }
                    else if(event == "RADIATION"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Day 3');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].RADIATIONVAL += 1;
                        } 
                    }
                }
            }
        }
        else if(timearray[6] <= message.time && message.time < timearray[7]){
            if(message.events != null){
                for(const event of message.events){
                    if(event == "FIRE"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Night 4');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].FIREVAL += 1;
                        } 
                    }
                    else if(event == "RADIATION"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Night 4');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].RADIATIONVAL += 1;
                        } 
                    }
                }
            }
        }
        else if(timearray[7] <= message.time && message.time < timearray[8]){
            if(message.events != null){
                for(const event of message.events){
                    if(event == "FIRE"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Day 4');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].FIREVAL += 1;
                        } 
                    }
                    else if(event == "RADIATION"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Day 4');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].RADIATIONVAL += 1;
                        } 
                    }
                }
            }
        }
        else if(timearray[8] <= message.time && message.time < timearray[9]){
            if(message.events != null){
                for(const event of message.events){
                    if(event == "FIRE"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Night 5');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].FIREVAL += 1;
                        } 
                    }
                    else if(event == "RADIATION"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Night 5');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].RADIATIONVAL += 1;
                        } 
                    }
                }
            }
        }
        else if(timearray[9] <= message.time && message.time < timearray[10]){
            if(message.events != null){
                for(const event of message.events){
                    if(event == "FIRE"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Day 5');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].FIREVAL += 1;
                        } 
                    }
                    else if(event == "RADIATION"){
                        const timenodeindex = incidentlocationwisefiltered.findIndex(item => item.TIMENODEVAL === 'Day 5');
                        if (timenodeindex !== -1) {
                        incidentlocationwisefiltered[timenodeindex].RADIATIONVAL += 1;
                        } 
                    }
                }
            }
        }
        
    }
}

