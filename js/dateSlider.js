
/**
 * https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
 * @param {SVGElement} svg 
 */
const makeDraggable = (svg, {xAxis, yAxis} = {}) => {
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);
    let selectedElement = false, offset = null, transform = null, value = null;
    const findDraggable = (element) => {
        while (element && !element.classList.contains('draggable') 
            && element.nodeName !== 'svg') {
            element = element.parentElement;
        }
        if(!element || element.nodeName === 'svg'){
            return null;
        }
        return element;
    }
    const getTransform = (draggable) => {
        var transforms = draggable.transform.baseVal;
        // Ensure the first transform is a translate transform
        if (transforms.length === 0 ||
            transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
          // Create an transform that translates by (0, 0)
          var translate = svg.createSVGTransform();
          translate.setTranslate(0, 0);
          // Add the translation to the front of the transforms list
          draggable.transform.baseVal.insertItemBefore(translate, 0);
        }
        // Get initial translation amount
        return transforms.getItem(0);
    }
    function startDrag(evt) {
        const target = findDraggable(evt.target);
        if (target && target.classList.contains('draggable')) {
            selectedElement = target;
            offset = getMousePosition(evt);
            value = selectedElement.value;
            transform = getTransform(selectedElement);
            offset.x -= transform.matrix.e;
            offset.y -= transform.matrix.f;
          }
    }
    function getMousePosition(evt) {
        var CTM = svg.getScreenCTM();
        return {
          x: (evt.clientX - CTM.e) / CTM.a,
          y: (evt.clientY - CTM.f) / CTM.d
        };
      }
    function drag(evt) {
        if (selectedElement) {
            evt.preventDefault();
            const coord = getMousePosition(evt);
            let diffX = (coord.x - offset.x), y = coord.y -  offset.y;
            const boundingBox = selectedElement.getBBox();
            const centerX = boundingBox.x + (boundingBox.width / 2);
            const oldValue = centerX;
            const newValue = oldValue + diffX;
            if(xAxis){
                if(newValue < xAxis.min){
                    diffX = 0;
                } else if(newValue > xAxis.max){
                    diffX = 0;
                }
            } else {
                diffX = 0;
            }
            if(transform.matrix.e != diffX){
                console.log('what')
            }

            selectedElement.value = oldValue + diffX;

            transform.setTranslate(
                diffX, 
                yAxis ? Math.max(0, coord.y -  offset.y) : 0);
          }
    }
    function endDrag(evt) {
        if(!selectedElement){
            return;
        }
        if(value !== selectedElement.value){
            selectedElement.dispatchEvent(new Event("change", {
                cancelable: false,
                bubbles: true,
            }));
        }
        value = null;
        selectedElement = null;
    }
    return function setPostion(draggable, {x, dispatch}) {
        if(x === draggable.value){
            return;
        }
        draggable.value = x;
        const transform = getTransform(draggable);
        // const offsetX = transform.matrix.e / transform.matrix.a;
        const boundingBox = draggable.getBBox();
        const centerX = boundingBox.x + (boundingBox.width / 2);
        transform.setTranslate(x - centerX, 0);
        if(dispatch){
            draggable.dispatchEvent(new Event("change", {
                cancelable: false,
                bubbles: true,
            }));
        }
    }
  }

const createDoubleSlider = () => {
    const wrapper = d3.select("#dateSliderWrapper");
    const svg = wrapper.append("svg")
        .attr("id", "dateSlider");
    
    const defs = svg.append("defs");
    const radialGradient = defs.append("radialGradient")
        .attr("id", "redToGoldRadialGradient");
    const goldStop = radialGradient.append("stop")
        .attr("offset", "10%")
        .attr("stop-color", "gold");
    const redStop = radialGradient.append("stop")
        .attr("offset", "95%")
        .attr("stop-color", "red");

    const highlightedDate = new Date('04/06/2020 01:00:00 PM')
    
    // Calculate dates for 5-hour and 30-hour windows after the highlighted date
    const fiveHoursAfter = new Date(highlightedDate.getTime() + 5 * 60 * 60 * 1000);
    const thirtyHoursAfter = new Date(highlightedDate.getTime() + 30 * 60 * 60 * 1000);


    const marginTop = 20;
    const marginRight = 50;
    const marginBottom = 40;
    const marginLeft = 50;
    
    const { width, height } = wrapper.node().getBoundingClientRect();
    svg
        .attr("width", width)
        .attr("height", height);

    const extent = [new Date('04/06/2020'), new Date('04/10/2020 12:00:00 PM')];
    const x = d3.scaleTime()
        .domain(extent)
        .range([marginLeft, width - marginRight]);

    const setPostion = makeDraggable(svg.node(), {
        xAxis: {
            min: marginLeft, 
            max: width - marginRight
        }
    });

    const formatDate = date => date.toLocaleString();
    const y = height / 2;

    const label = svg.append("g")
        .attr("transform", `translate(0,${marginTop})`)
    const minLabel = label.append("text")
        .attr("text-anchor", "middle")
        .attr("x", "50%")
        .text(`Min: ${formatDate(extent[0])}`);
    
    const maxLabel = label.append("text")
        .attr("text-anchor", "middle")
        .attr("x", "50%")
        .attr("transform", `translate(0, 20)`)
        .text(`Max: ${formatDate(extent[1])}`);

    const xAxis = {
        y: height - marginBottom
    }

    // Add the x-axis.
    svg.append("g")
        .attr("transform", `translate(0,${xAxis.y})`)
        .call(d3.axisBottom(x));

    svg.append("rect")
        .attr("y", y)
        .attr("x", marginLeft)
        .attr("width", width - (marginRight + marginLeft))
        .attr("height", 3)
        .attr("fill", "white");

    const circleDim = {
        r: 20
    }

    const rectDim = {
        width: 2,
        height: xAxis.y - y,
    }

    const range = svg.append("g")
    // .style("outline", "solid 3px green");
    
    const addSliderButton = (selection, {centerX}) => {
        const sliderButton = selection.append("g")
            .attr("class", "draggable");
        sliderButton.append("circle")
            .attr("r", circleDim.r)
            .attr("cx", centerX)
            .attr("cy", y)
            .attr("fill", "url('#redToGoldRadialGradient')")
            .attr("filter", "url('#dropshadow')");
        
        sliderButton.append("rect")
            .attr("x", (centerX - (rectDim.width / 2)))
            .attr("y", y)
            .attr("width", rectDim.width)
            .attr("height", rectDim.height)
            .attr("fill", "white");
        sliderButton.append("circle")
            .attr("r", circleDim.r / 4)
            .attr("cx", centerX)
            .attr("cy", y)
            .attr("fill", "white")
        return sliderButton;
    }
    
    const minDateInput = addSliderButton(range, {centerX: marginLeft});
    const maxDateInput = addSliderButton(range, {centerX: width - marginRight});
    
    svg.node().value = [...extent];
    
    svg.on("change", function(d) {
        const e = d3.event;
        this.value = [minDateInput, maxDateInput]
        .map((selection, i) => selection.node().value ?
        x.invert(selection.node().value) : this.value[i])
        .sort((a, b) => a < b ? -1 : 1);
        minLabel.text(`Min: ${formatDate(this.value[0])}`);
        maxLabel.text(`Max: ${formatDate(this.value[1])}`);
    });

    const setDateRange = (minDate, maxDate) => {
        setPostion(minDateInput.node(), {x: x(minDate), dispatch: false});
        setPostion(maxDateInput.node(), {x: x(maxDate), dispatch: true});
    }

    // Add a line to represent the highlighted date
    const highlightedLine = svg.append("line")
        .attr("x1", x(highlightedDate))
        .attr("x2", x(highlightedDate))
        .attr("y1", y - 10) // Adjust the y position as needed
        .attr("y2", xAxis.y)
        .attr("stroke", "white")
        .attr("stroke-width", 2);

        // Add lines to represent 5-hour and 30-hour windows
    const fiveHoursLine  =  svg.append("line")
        .attr("x1", x(fiveHoursAfter))
        .attr("x2", x(fiveHoursAfter))
        .attr("y1", y - 0) // Adjust the y position as needed
        .attr("y2", xAxis.y)
        .attr("stroke", "red")
        .attr("stroke-width", 2);

    const thirtyHoursLine = svg.append("line")
        .attr("x1", x(thirtyHoursAfter))
        .attr("x2", x(thirtyHoursAfter))
        .attr("y1", y - 10) // Adjust the y position as needed
        .attr("y2", xAxis.y)
        .attr("stroke", "#f28e2c")
        .attr("stroke-width", 2);

   // Add labels for the marks with tooltips
    svg.append("text")
    .attr("x", x(highlightedDate))
    .attr("y", y - 20) // Adjust the y position as needed
    .attr("text-anchor", "middle")
    .text("Earthquake Hit")
    .style("fill", "white")
    .append("title")
    .text(`Time: ${highlightedDate.toLocaleTimeString()}`);

    svg.append("text")
    .attr("x", x(fiveHoursAfter))
    .attr("y", y - 5) // Adjust the y position as needed
    .attr("text-anchor", "middle")
    .text("5 Hours After")
    .style("fill", "red")
    .append("title")
    .text(`Time: ${fiveHoursAfter.toLocaleTimeString()}`);

    svg.append("text")
    .attr("x", x(thirtyHoursAfter))
    .attr("y", y - 20) // Adjust the y position as needed
    .attr("text-anchor", "middle")
    .text("30 Hours After")
    .style("fill", "#f28e2c")
    .append("title")
    .text(`Time: ${thirtyHoursAfter.toLocaleTimeString()}`);
     // Add tooltips to the marks
    highlightedLine.append("title").text(`Time: ${highlightedDate.toLocaleTimeString()}`);
    fiveHoursLine.append("title").text(`Time: ${fiveHoursAfter.toLocaleTimeString()}`);
    thirtyHoursLine.append("title").text(`Time: ${thirtyHoursAfter.toLocaleTimeString()}`);

    return {slider: svg.node(), setDateRange};
}

// createDoubleSlider();