/**
 * Legend for each resource and its color
 */

const COLOR_SCHEME = ["#4e79a7", "#f28e2c", "#e15759", "#59a14f", "#76b7b2", "#edc949", "#af7aa1", "#ff9da7", "#9c755f", "#bab0ab"];

const RESOURCES = [
    "WATER",
    "TRANSPORT",
    "GAS",
    "GARBAGE",
    "POWER",
    "POLICE",
    "MEDICAL",
    // "EVACUATE",
    // "BUILDING",
    // "RADIATION",
    // "DEATH",
    // "FATALITY",
    // "EARTHQUAKE"
];

const RESOURCE_COLOR_MAP = RESOURCES.reduce((map, location, index) => {
    map[location] = COLOR_SCHEME[index];
    return map;
}, {});

const resourceColor = resource => RESOURCE_COLOR_MAP[resource];


const createResourceColorLegend = () => {
    const wrapper = d3.select("#slider-container");
    const marginTop = 0;
    const marginRight = 10;
    const marginBottom = 20;
    const marginLeft = 10;

    const getBoundingRect = () => {
        const { width, height } = wrapper.node().getBoundingClientRect();
        return { width, height: Math.max(height, 80)};
    }
    const {width, height} = getBoundingRect();
    
    const svg = wrapper.append("svg")
    .attr("width", width)
    .attr("height", height);
    
    const x = d3.scaleBand()
    .domain(RESOURCES)
    .range([marginLeft, width - marginRight]);
    
    
    svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x));
    
    svg.selectAll(".resource-legend-glyph")
    .data(RESOURCES)
    .join(enter => enter.append('circle')
    .attr("class", "resource-legend-glyph")
    .on("mouseover", function(resource){
        this.dispatchEvent(resourceEvent("hover", resource));
    }))
    .on("mouseout", function(resource){
        this.dispatchEvent(resourceEvent("leave", resource));
    })
    .attr("cx", resource => x(resource) + (x.bandwidth() / 2))
    .attr("cy", "50%")
    .attr("r", 10)
    .attr("fill", resourceColor);
    window.addEventListener("resource-hover", e => {
        const resource = e.detail.resource;
        svg.selectAll(".resource-legend-glyph")
            .filter(r => r === resource)
            .attr("filter", "url(#dropshadow)");
    });

    window.addEventListener("resource-leave", e => {
        const resource = e.detail.resource;
        svg.selectAll(".resource-legend-glyph")
            .filter(r => r === resource)
            .attr("filter", "");
    });
}
        
window.addEventListener("DOMContentLoaded", async () => {
    createResourceColorLegend();
}, {once: true});