function getFilteredData(startTime, endTime) {
    // console.log(allData)
    return allData.filter(d => d.parsedTime >= startTime && d.parsedTime <= endTime);
}

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
    "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"
]);


let allData = [];

function filterMessagesByTime(startTime, endTime) {
    return allData.filter(d => {
        const messageTime = new Date(d.time); // Assuming 'time' is your datetime field in the dataset
        return messageTime >= startTime && messageTime <= endTime;
    });
}

function calculateWordFrequencies(messages) {
    const wordCounts = {};
    messages.forEach(message => {
        const words = message.message.split(/\s+/);
        words.forEach(word => {
            word = word.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (word && !stopWords.has(word)) {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
        });
    });
    return wordCounts;
}

function combineWordFrequencies(messages) {
    const combinedWordCounts = {};
    
    messages.forEach(message => {
        const wordFreq = message.wordFreq; // Assume each message has precalculated 'wordFreq'
        for (const [word, count] of Object.entries(wordFreq)) {
            if (!combinedWordCounts[word]) {
                combinedWordCounts[word] = count;
            } else {
                combinedWordCounts[word] += count;
            }
        }
    });

    return combinedWordCounts;
}


function preprocessDataset(data) {
    data.forEach(entry => {
      const wordCounts = {};
      const words = entry.message.split(/\s+/);
      words.forEach(word => {
        word = word.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (word && !stopWords.has(word)) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
      // Store the word counts with the message
      entry.wordFreq = wordCounts;
    });
  }


function createWordCloud(wordFrequencies) {
    const words = Object.keys(wordFrequencies).map(word => {
        return { text: word, size: wordFrequencies[word] };
    });

    const chartDiv = document.getElementById('chart-1');
    const width = chartDiv.clientWidth;  // Get the width of the div
    const height = chartDiv.clientHeight; // Get the height of the div

    // Select the existing SVG if it exists, or create one otherwise
    let svg = d3.select('#chart-1').select('svg');
    if (svg.empty()) {
        svg = d3.select('#chart-1').append('svg');
        svg.attr('width', width)
           .attr('height', height)
           .append('g')
           .attr('transform', `translate(${width / 2}, ${height / 2})`);
    }

    // Update the word cloud layout
    const layout = d3.layout.cloud()
                     .size([width, height])
                     .words(words)
                     .padding(5)
                     .rotate(() => ~~(Math.random() * 2) * 90)
                     .fontSize(d => d.size * 10) // Scale font size
                     .on('end', draw);

    layout.start();

    function draw(words) {
        // Bind the words data to your text elements
        const text = svg.select('g').selectAll('text')
                        .data(words, d => d.text);

        // Enter new words
        text.enter().append('text')
            .style('font-size', d => d.size + 'px')
            .attr('text-anchor', 'middle')
            .attr('transform', d => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
            .text(d => d.text);

        // Update existing words
        text.transition().duration(600)
            .style('font-size', d => d.size + 'px')
            .attr('transform', d => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
            .text(d => d.text);

        // Exit old words
        text.exit().remove();
    }
}




function createTimeline(data) {
    // ... time scale setup ...

    


    const svg = d3.select("#time-range-selector");
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const timeExtent = d3.extent(data, d => d.parsedTime);
    const xScale = d3.scaleTime()
                     .domain(timeExtent)
                     .range([0, width]); // 'width' is the width of your SVG container

    // Brush
    const brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on("end", function() {
        if (!d3.event.selection) return; // Make sure d3.event is correctly used
        const [selectedStartTime, selectedEndTime] = d3.event.selection.map(xScale.invert);
       
        console.log(selectedStartTime);
        console.log(selectedEndTime);
        // Example usage when time period is selected
        const filteredData = getFilteredData(selectedStartTime, selectedEndTime);
        // console.log(filteredData)
        const wordFrequencies = calculateWordFrequencies(filteredData);
        // console.log(wordFrequencies)
        createWordCloud(wordFrequencies);
    });


    g.append("g").call(d3.axisBottom(xScale));
    g.append("g").attr("class", "brush").call(brush);

}






// Load CSV file
d3.csv('YInt.csv').then(data => {
    allData = data.map(d => {
        // console.log(d.time)
        d.parsedTime = new Date(d.time); // Assuming 'time' is the datetime field
        return d;
    });

    preprocessDataset(allData);

    // createTimeline(allData)
   
    // Example usage when time period is selected
    const filteredData = getFilteredData(new Date("4/6/2020 12:12:00 AM"), new Date("4/6/2020 12:16:00 AM"));
    console.log(filteredData)
    const wordFrequencies = calculateWordFrequencies(filteredData);
    console.log(wordFrequencies)
    createWordCloud(wordFrequencies);

});