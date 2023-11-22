const stopWords = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", 
    "you've", "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 
    'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 
    'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 
    'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', "that'll", 
    'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 
    'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 
    'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 
    'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 
    'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 
    'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 
    'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should', "should've", 
    'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', 
    "couldn't", 'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', 
    "hasn't", 'haven', "haven't", 'isn', "isn't", 'ma', 'mightn', "mightn't", 
    'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', 
    "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't",
    'anyone', 'someone', 'anything', 'something', 'anywhere', 'somewhere'
]);


const disaster_keywords = new Set([
    'help', 'trapped', 'stuck', 'emergency', 'urgent', 'assistance',
    'aid', 'SOS', 'danger', 'unsafe', 'evacuate', 'evacuation',
    'shelter', 'injury', 'injured', 'hurt', 'medical', 'collapse',
    'collapsed', 'destruction', 'debris', 'rubble', 'seismic',
    'tremor', 'aftershock', 'quake', 'earthquake', 'shaking', 'damage',
    'damaged', 'destroy', 'destroyed', 'crisis', 'disaster', 'rescue',
    'missing', 'survival', 'survive', 'victim', 'casualties', 'fatality',
    'fatalities', 'alert', 'warning', 'impact', 'quivering','trembling','wobbling','rumble',
    'shuddering','vibrating','evacuating','holes','meds','food', 'rubble','hotspots','volunteers','red tag','not safe',
    'fuel','flash lights','batteries','stocked up','camp','road','outage','shortages','escape','apocalypse','lives','aftershock','freindatalities',
    'trapped','shower','restore','park','patients','brick','blood','died','shuddering'
    ])

const irrelavant_words = ['parking spot','parked','parking']

const wordPattern = new RegExp(irrelavant_words.join("|"), "i");

let allData = [];

function createWordCloud(messages) {
   
    const chartDiv = document.getElementById('chart-1');
    const width = chartDiv.clientWidth;  // Get the width of the div
    const height = chartDiv.clientHeight; // Get the height of the div

    let svg = d3.select('#chart-1').select('svg');
    if (svg.empty()) {
        svg = d3.select('#chart-1').append('svg');
        svg.attr('width', width)
           .attr('height', height)
           .append('g')
           .attr('transform', `translate(${width / 2}, ${height / 2})`);
    }

    const tooltip = d3.select('#chart-1').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    messages = messages.filter(d => {
        if(!wordPattern.test(d.essential_words)){
            return d
        }
    });

    function updateWordCloud(){
        svg.selectAll("*").remove();
        allData = messages.map(d => {
            d.parsedTime = new Date(d.time);
            return d;
        });
        const [startTime, endTime] = slider.value;
        messages_filtered = allData.filter(d => {
            const messageTime = new Date(d.time);
            return messageTime >= startTime && messageTime <= endTime;
        });

        let wordFrequencies = "";
        messages_filtered.forEach(message => {
            wordFrequencies = wordFrequencies +" " +message.essential_words;

        });   
        words = wordFrequencies
                .trim()
                .split(/[\s.]+/g)
        
        words = words.filter(word => {
            if (word && !stopWords.has(word)) {
                return word;
            }
        })

        var nest = d3.nest()
            .key(function(d) { return d; })
            .rollup(function(group) { return group.length; })
            .entries(words);
    
        nest.sort(function(a, b) {
            return d3.descending(a.value, b.value);
        });
    
        var slicedNest = nest.slice(0, 200);
        var mappedData = slicedNest.map(function(entry) {
            return { text: entry.key, size: entry.value };
        });
    
        mappedData.sort((a, b) => b.size - a.size);
        var layout = d3.layout.cloud()
                        .size([width, height])
                        .words(mappedData.map(function(d) { return {text: d.text, size: disaster_keywords.has(d.text) && !irrelavant_words.includes(d.text)? d.size :d.size/10}; }))
                        .padding(5)  
                        .rotate(function() { return ~~(Math.random() * 2) * 90; })
                        .fontSize(function(d) { return d.size; })  
                        .on("end", draw);
        layout.start();
  
        function draw(words) {
            svg
            .append("g")
                .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", function(d) { return d.size; })
                .style("fill", "#69b3a2")
                .attr("text-anchor", "middle")
                .style("font-family", "Impact")
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function(d) { return d.text; })
                .on('mouseover', function (event, d) {
                    const word = event.text;
                    const filteredMessages = messages_filtered.filter((message) =>
                        message.essential_words.includes(word)
                    );
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 1);
                    tooltip.html('<b>Messages containing "' + word + '":</b><br>' +
                        filteredMessages.slice(0,10)
                            .filter((message) => message.is_disaster_related === "True" && !message.message.startsWith("re:"))
                            .map((message) => message.message)
                        .join('<br>'))
                        .style('left', (event.pageX+600) + 'px')
                        .style('top', (event.pageY - 28000) + 'px');
                })
                .on('mouseout', function () {
                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });
        }
    }
    updateWordCloud();
    return updateWordCloud;
}


window.addEventListener('DOMContentLoaded', async () => {
    d3.csv('words_essential_2.csv').then(data => {
        const updateWordCloud = createWordCloud(data);
        slider.addEventListener('change', updateWordCloud);
    });    
});