
var globalData;

function getSeconds(d) {
  return moment(d).hour() * 3600 + moment(d).minute() * 60 + moment(d).second();
}

var svgWidth = 720,
    svgHeight = 6000;

var margin = {top: 20, left: 50, bottom: 20, right: 20};

var width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom;

var svg = d3.select('body').append('svg')

svg.attr("width",svgWidth)
  .attr("height",svgHeight)

var g = svg.append('g')
  .attr("width", width)
  .attr("height", height)
  .attr("transform", `translate(${margin.left},${margin.top})`)

var bgGrid = g.append('g')

var tooltipDiv = d3.select('body').append('div')
  .attr('class', 'tooltip')
  .style('display','none')

function color(level) {
    if (level == 'deep') return d3.color('#456199').darker(1);
    if (level == 'asleep') return d3.color('#456199').darker(0.5);
    if (level == 'rem') return d3.color('#456199');
    if (level == 'restless') return d3.color('#456199').brighter(0.5);
    if (level == 'light') return d3.color('#456199').brighter(1);

    if (level == 'wake' || level == 'awake') return d3.color('#AA0000');
}


// function color(level) {
//     if (level == 'light') return '#99bbff';
//     if (level == 'rem') return '#456199';
//     if (level == 'deep') return '#001e59';
//     if (level == 'wake') return '#AA0000';
//     if (level == 'restless') return '#6f94de';
//     if (level == 'asleep') return '#1a3e87';
//     if (level == 'awake') return '#AA0000';
// }

d3.json('sleep.json').then(function(data) {

  overnights = [];

  for(var i=0; i<data.length; i++) {

    datum = data[i];
    datum.startTime = moment(datum.dateTime);
    datum.endTime = moment(datum.dateTime).add(datum.seconds-1, 'seconds')
    if (datum.endTime.day() != datum.startTime.day()) {
      overnights.push(datum);
    }
  }

  for(var i=0; i < overnights.length; i++) {
    datum = overnights[i];

    newDatum = {
      dateTime:moment(datum.dateTime).add(1, 'days').startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS'),
      level: datum.level,
      seconds: datum.seconds - (24*60*60 - getSeconds(datum.dateTime))
    }
    newDatum.startTime = moment(datum.dateTime),
    newDatum.endTime = moment(datum.dateTime).add(datum.seconds-1, 'seconds'),
    
    data.push(newDatum)
    datum.seconds = (24*60*60 - getSeconds(datum.dateTime))
  }

//   data.sort((a, b) => a.startTime - b.startTime)

  console.log(data.length);

  globalData = data;

//   function dataSorter(a, b) {
//     levels = {
//       'deep':0,
//       'asleep':1,
//       'rem':2,
//       'restless':3,
//       'light':4,
//       'awake':5,
//       'wake':6
//     }

//     if (a.startTime.startOf('day').diff(b.startTime.startOf('day'), 'days') == 0 ) {
//       if (levels[a.level] != levels[b.level]) {
//         return levels[a.level] - levels[b.level]
//       } else {
//         return a.startTime.diff(b.startTime, 'seconds');
//       }
//     } else {
//       return a.startTime.diff(b.startTime, 'seconds');
//     }
//   }

//   data.sort(dataSorter)

  //var dateParse = d3.timeParse('%Y-%m-%d')
  var dateParse = d3.isoParse

  dataStartTime = moment(d3.min(data, x=>x.dateTime)).startOf('day');
  dataEndTime = moment(d3.max(data, x=>x.dateTime)).add(1, 'day').startOf('day');

//   offset = 0
//   startDate = dataStartTime
//   for (var i = 0; i < data.length; i++) {
//     datum = data[i]
//     if(datum.level == 'wake' || datum.level == 'awake') {
//       datum.offset = getSeconds(datum.dateTime);
//     } else {
//       if(datum.startTime.diff(startDate, 'days') < 1) {
//         datum.offset = offset;
//         offset += datum.seconds;
//       } else {
//         offset = 0;
//         datum.offset = offset;
//         startDate = datum.startTime.startOf('day')
//       }
//     }
//   }


  yScale = d3.scaleTime().domain([dataStartTime, dataEndTime]).range([0,height])
  var xScale = d3.scaleLinear().domain([0, 24*60*60]).range([0,width])

  var yAxis = d3.axisLeft(yScale).ticks(dataEndTime.diff(dataStartTime, 'days'))
  var xAxis = d3.axisBottom(xScale)

  g.selectAll(".axis-y").data([0]).enter().append("g")
      .classed("axis-y", true)
  g.selectAll(".axis-y").transition().call(yAxis)

  g.selectAll(".axis-x").data([0]).enter().append("g")
      .classed("axis-x", true)
      .attr("transform", `translate(0, ${height})`)
  g.selectAll(".axis-x").transition().call(xAxis)

  //var lineHeight = yScale(dateParse(moment(startDay).add(1, 'days').format('YYYY-MM-DD'))) - yScale(dateParse(moment(startDay).format('YYYY-MM-DD')));
  var lineHeight = height / dataEndTime.diff(dataStartTime, 'days');


  bgGrid.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'white')

  bgGrid.selectAll('.grid').data([...Array(25).keys()]).enter()
    .append('rect')
    .attr('class','grid')
    .attr('x', d => xScale(d*60*60))
    .attr('y',0)
    .attr('width', 1)
    .attr('height', height)
    .attr('fill','white')

  sleep = g.selectAll('.data').data(data)

  sleep.enter().append('rect')
    .attr('class', d => 'data ' + d['level'])
    .attr('x', d => xScale(getSeconds(d.dateTime)))
    //.attr('x', d => xScale(d.offset))
    //.attr('y', d => yScale(d.startTime.startOf('day').subtract(12, 'hours')))
    .attr('y', function(d) {
        return yScale(d.endTime);
    })
    .attr('width', d => xScale(d.seconds + 30))
    .attr('height', lineHeight)
    .style('fill', d => color(d.level))
    .on('mouseover', function(d) { 
    //   var xPosition = d3.event.pageX - 15,
    //       yPosition = d3.event.pageY - 100;

      var xPosition = xScale(getSeconds(d.dateTime)),
          yPosition = yScale(d.startTime.startOf('day').subtract(12, 'hours')) - 50;
      var xPosition = xScale(d.startTime.seconds + d.startTime.minutes * 60 + d.startTime.hours * 3600);

      d3.select(this).style('fill', color(d.level).brighter(1.5));  
      
      tooltipDiv
        .style('left', xPosition + 'px')
        .style('top', yPosition + 'px')
        console.log(d)

      tooltipDiv.style('display', null)
        .html(`${moment(d.dateTime).format('ddd MMM Do')}<br>
          ${d.startTime.format('h:mm a')} to ${d.endTime.format('h:mm a')}<br>${d.seconds / 60}min ${d.level}`)
    })
    .on('mouseout', function(d) { 
        tooltipDiv.style('display', 'none'); 
        d3.select(this).style('fill', color(d.level));  
        })
        
    .on('mousemove', function(d) { 

      // var xPosition = d3.mouse(this)[0] - 15;
      // var yPosition = d3.mouse(this)[1] - 25;
     })

}).then(function() {

  // console.log('saving...')
  // var svgString = getSVGString(svg.node());
	// svgString2Image( svgString, 2*width, 2*height, 'png', save ); // passes Blob and filesize String to the callback

	// function save( dataBlob, filesize ){
	// 	saveAs( dataBlob, 'D3 vis exported to PNG.png' ); // FileSaver.js function
	// }
  
})


// from http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177
// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
function getSVGString( svgNode ) {
	svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
	var cssStyleText = getCSSStyles( svgNode );
	appendCSS( cssStyleText, svgNode );

	var serializer = new XMLSerializer();
	var svgString = serializer.serializeToString(svgNode);
	svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
	svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

	return svgString;

	function getCSSStyles( parentElement ) {
		var selectorTextArr = [];

		// Add Parent element Id and Classes to the list
		selectorTextArr.push( '#'+parentElement.id );
		for (var c = 0; c < parentElement.classList.length; c++)
				if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
					selectorTextArr.push( '.'+parentElement.classList[c] );

		// Add Children element Ids and Classes to the list
		var nodes = parentElement.getElementsByTagName("*");
		for (var i = 0; i < nodes.length; i++) {
			var id = nodes[i].id;
			if ( !contains('#'+id, selectorTextArr) )
				selectorTextArr.push( '#'+id );

			var classes = nodes[i].classList;
			for (var c = 0; c < classes.length; c++)
				if ( !contains('.'+classes[c], selectorTextArr) )
					selectorTextArr.push( '.'+classes[c] );
		}

		// Extract CSS Rules
		var extractedCSSText = "";
		for (var i = 0; i < document.styleSheets.length; i++) {
			var s = document.styleSheets[i];
			
			try {
			    if(!s.cssRules) continue;
			} catch( e ) {
		    		if(e.name !== 'SecurityError') throw e; // for Firefox
		    		continue;
		    	}

			var cssRules = s.cssRules;
			for (var r = 0; r < cssRules.length; r++) {
				if ( contains( cssRules[r].selectorText, selectorTextArr ) )
					extractedCSSText += cssRules[r].cssText;
			}
		}
		

		return extractedCSSText;

		function contains(str,arr) {
			return arr.indexOf( str ) === -1 ? false : true;
		}

	}

	function appendCSS( cssText, element ) {
		var styleElement = document.createElement("style");
		styleElement.setAttribute("type","text/css"); 
		styleElement.innerHTML = cssText;
		var refNode = element.hasChildNodes() ? element.children[0] : null;
		element.insertBefore( styleElement, refNode );
	}
}


function svgString2Image( svgString, width, height, format, callback ) {
	var format = format ? format : 'png';

	var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");

	canvas.width = width;
	canvas.height = height;

	var image = new Image();
	image.onload = function() {
		context.clearRect ( 0, 0, width, height );
		context.drawImage(image, 0, 0, width, height);

		canvas.toBlob( function(blob) {
			var filesize = Math.round( blob.length/1024 ) + ' KB';
			if ( callback ) callback( blob, filesize );
		});

		
	};

	image.src = imgsrc;
}

