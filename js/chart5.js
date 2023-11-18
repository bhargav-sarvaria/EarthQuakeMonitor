// Load CSV file
d3.csv('YInt.csv').then(data => {
    allData = data.map(d => {
        d.parsedTime = new Date(d.time); // Assuming 'time' is the datetime field
        return d;
    });
    

    // Create SVG element
    const svgWidth = 800, svgHeight = 200;
    const margin = {top: 20, right: 20, bottom: 30, left: 50};
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select('#chart-5')
                .append('svg')
                .attr('width', svgWidth)
                .attr('height', svgHeight)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

    // Assuming allData is your loaded and processed dataset
    const x = d3.scaleTime()
                .rangeRound([0, width])
                .domain(d3.extent(allData, d => d.parsedTime));

    svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));

    const brush = d3.brushX()
                .extent([[0, 0], [width, height - margin.bottom]])
                .on('brush end', brushed);

svg.append('g')
   .attr('class', 'brush')
   .call(brush);

function brushed(event) {
    const selection = event.selection;
    if (selection) {
        const [start, end] = selection.map(xScale.invert);
        updateDataAndView(start, end); // Function to filter data and update the view
    }
}


});