
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
    function startDrag(evt) {
        const target = findDraggable(evt.target);
        if (target && target.classList.contains('draggable')) {
            selectedElement = target;
            offset = getMousePosition(evt);
            value = selectedElement.value;
            // Get all the transforms currently on this element
            var transforms = selectedElement.transform.baseVal;
            // Ensure the first transform is a translate transform
            if (transforms.length === 0 ||
                transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
              // Create an transform that translates by (0, 0)
              var translate = svg.createSVGTransform();
              translate.setTranslate(0, 0);
              // Add the translation to the front of the transforms list
              selectedElement.transform.baseVal.insertItemBefore(translate, 0);
            }
            // Get initial translation amount
            transform = transforms.getItem(0);
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
            const oldValue = selectedElement.cx.baseVal.value;
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
  }

const createDoubleSlider = () => {
    const wrapper = d3.select("#dateSliderWrapper");
    const svg = wrapper.append("svg")
        .attr("id", "dateSlider");
    
    const marginTop = 20;
    const marginRight = 50;
    const marginBottom = 40;
    const marginLeft = 50;
    
    const { width, height } = wrapper.node().getBoundingClientRect();
    svg
        .attr("width", width)
        .attr("height", height);

    const extent = [new Date('04/06/2020'), new Date('04/11/2020')];
    const x = d3.scaleTime()
        .domain(extent)
        .range([marginLeft, width - marginRight]);

    makeDraggable(svg.node(), {
        xAxis: {
            min: marginLeft, 
            max: width - marginRight
        }
    });

    const y = height / 2;

    const label = svg.append("g")
        .attr("transform", `translate(0,${marginTop})`)
    const minLabel = label.append("text")
        .attr("text-anchor", "middle")
        .attr("x", "50%")
        .text(`Min: ${extent[0]}`);
    
    const maxLabel = label.append("text")
        .attr("text-anchor", "middle")
        .attr("x", "50%")
        .attr("transform", `translate(0, 20)`)
        .text(`Max: ${extent[1]}`);

    // Add the x-axis.
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x));

    svg.append("rect")
        .attr("y", y)
        .attr("x", marginLeft)
        .attr("width", width - (marginRight + marginLeft))
        .attr("height", 10)
        .attr("fill", "black");

    const minDateInput = svg.append("circle")
        .attr("class", "draggable")
        .attr("r", 20)
        .attr("cx", marginLeft)
        .attr("cy", y)
        .attr("fill", "red");

    const maxDateInput = svg.append("circle")
        .attr("class", "draggable")
        .attr("r", 20)
        .attr("cx", width - (marginRight))
        .attr("cy", y)
        .attr("fill", "red");

    svg.node().value = [...extent];

    minDateInput.on('change', function(d) {
        const e = d3.event;
        const extent = svg.node().value
        extent[0] = x.invert(e.target.value);
        if(extent[0] > extent[1]){
            [extent[1], extent[0]] = [extent[0], extent[1]]
        }
    });

    maxDateInput.on('change', function(d) {
        const e = d3.event;
        const extent = svg.node().value
        extent[1] = x.invert(e.target.value);
        if(extent[1] < extent[0]){
            [extent[1], extent[0]] = [extent[0], extent[1]]
        }
    });

    svg.on("change", function(d) {
        const e = d3.event;
        const extent = svg.node().value;
        minLabel.text(`Min: ${extent[0]}`);
        maxLabel.text(`Max: ${extent[1]}`);
    });

    return svg.node();
}

// createDoubleSlider();