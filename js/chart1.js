let updateWordCloud = null;

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
    'anyone', 'someone', 'anything', 'something', 'anywhere', 'somewhere','ca'
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
    'trapped','shower','restore','park','patients','brick','blood','died','shuddering','power'
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
        .attr('class', 'chart1Tooltip')
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
            return (messageTime >= startTime && messageTime <= endTime) && (selectedregionarray.length == 0 || selectedregionarray.includes(d.location));
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
    
        var slicedNest = nest.slice(0, 300);
        var mappedData = slicedNest.map(function(entry) {
            return { text: entry.key, size: entry.value };
        });
    
        mappedData.sort((a, b) => b.size - a.size);
        var layout = d3.layout.cloud()
                        .size([width, height])
                        .words(mappedData.map(function(d) { return {text: d.text, size: disaster_keywords.has(d.text) && !irrelavant_words.includes(d.text)? d.size :d.size/10 , isDisasterRelated: disaster_keywords.has(d.text)}; }))
                        .padding(20)  
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
                .style("fill", function(d) {
                    return d.isDisasterRelated ? "#FF0000" : "#000000"; 
                  })
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
                    const initialMessages = filteredMessages.slice(0, 10)
                            .filter((message) => message.is_disaster_related === "True" && !message.message.startsWith("re:"))
                            .map((message) => message.message)
                            .join('<br>');
                    let tooltipHtml = '<b>Messages containing "' + word + '":</b><button class="close-tooltip">Close</button><br>';
                    tooltipHtml += '<table><thead><tr><th>Location</th><th>User</th><th>Message</th></tr></thead><tbody>';
                    filteredMessages.slice(0, 10).forEach(function(message) {
                        tooltipHtml += '<tr><td>' + message.location + '</td><td>' + message.account + '</td><td>' + message.message + '</td></tr>';
                    });

                    tooltipHtml += '</tbody></table>';
                    if (filteredMessages.length > 10) {
                        tooltipHtml += '<br><a href="#" class="expand-tooltip">More...</a>';
                    }
                    tooltip.transition()
                    .duration(200)
                    .style('opacity', 1)
                    .style('pointer-events', 'auto');
                    
                    tooltip.html(tooltipHtml)
                    .style('left', (d3.event.pageX + 10) + 'px')
                    .style('top', (d3.event.pageY -1800) + 'px');

                    const closeBtn = document.getElementsByClassName('close-tooltip')[0];
                    if (closeBtn) {
                        closeBtn.addEventListener('click', function() {
                            console.log('button');
                            tooltip.transition()
                                    .duration(500)
                                    .style('opacity', 0);
                        });
                    }
                    const moreLink = document.getElementsByClassName('expand-tooltip')[0];
                    if (moreLink) {
                        moreLink.onclick = function(e) {
                            e.preventDefault();
                            let expandedTooltipHtml = '<b>Messages containing "' + word + '":</b><button class="close-tooltip">Close</button><br>';
                            expandedTooltipHtml += '<table><thead><tr><th>Location</th><th>User</th><th>Message</th></tr></thead><tbody>';
                            filteredMessages.forEach(function(message) {
                                expandedTooltipHtml += '<tr><td>' + message.location + '</td><td>' + message.account + '</td><td>' + message.message + '</td></tr>';
                            });

                            expandedTooltipHtml += '</tbody></table>';
                            tooltip.html(expandedTooltipHtml)
                                .style('opacity', 1)
                                .style('left', (d3.event.pageX + 50) + 'px')
                                .style('top', (d3.event.pageY -1500) + 'px');

                            const newCloseBtn = document.getElementsByClassName('close-tooltip')[0];
                            if (newCloseBtn) {
                                newCloseBtn.addEventListener('click', function() {
                                    tooltip.transition()
                                        .duration(500)
                                        .style('opacity', 0);
                                });
                            }
                        };
                    }
                })
                .on('mouseout', function() {
                    const tooltip = d3.select('.chart1Tooltip');
                    tooltip.transition().duration(5000).style('opacity', 0);
                })
                
        }
    }
    updateWordCloud();
    return updateWordCloud;
}

window.addEventListener('DOMContentLoaded', async () => {
    d3.csv('words_essential_2.csv').then(data => {
        updateWordCloud = createWordCloud(data);
        slider.addEventListener('change', updateWordCloud);
    });    
});