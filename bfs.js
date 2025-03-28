//queue implementation which uses objects (supposedly faster than simply using arrays)
//taken from https://www.javascripttutorial.net/javascript-queue/
//(in Python, I used https://docs.python.org/3/library/queue.html)
//here supposedly native JS solution is fast enough
class Queue {
  constructor() {
    this.elements = {};
    this.head = 0;
    this.tail = 0;
  }
  put(element) { //enqueue
    this.elements[this.tail] = element;
    this.tail++;
  }
  get() { //dequeue
    const item = this.elements[this.head];
    delete this.elements[this.head];
    this.head++;
    return item;
  }
  peek() {
    return this.elements[this.head];
  }
  get length() {
    return this.tail - this.head;
  }
  get empty() { //isEmpty
    return this.length === 0;
  }
}

document.getElementById("fakefileinput").addEventListener("keydown", function(event){
	console.log(event.key);
	if(event.key == "Enter"){
		document.getElementById("inputfile").click();
	}
});

document.getElementById("helpButton").addEventListener("click", function(){
	let a = document.getElementById("format");
	a.classList.remove("hidden");
	document.getElementById("formatOK").focus(); //By default the browser will scroll the element into view after focusing it
	a.scroll(0,0); //for that reason scroll after .focus();
});

let mazeAppClassHolderVariable; //the instance of the maze app
let fronta;
let animationDelay = document.getElementById("visualisationDelayPicker");

document.getElementById("resume").addEventListener("click", function(){
	mazeAppClassHolderVariable.zcelaHotovo = false;
	animationDelay.value = 0;
	mazeAppClassHolderVariable.runBFS();
});

class BFSMazeApp{
	constructor() {
		this.fronta = new Queue();
		this.pocetColumns = 0;
		this.pocetRows = 0;
		this.maze = [];
		this.startCoordinates = [];
		this.endCoordinates = [];
		this.zcelaHotovo = false;
		this.poleVidena = {};
		this.zJakehoPoleJsmeSemPrisli = {};
		this.delkaCesty = 0;
	}
	hideMaze(){
		this.graphicalMaze.hidden = true;
		//document.getElementById("funFact").hidden = true; did not work
		document.getElementById("funFact").classList.add("hiddenWithNoHeight");
	}
	createMaze(){
		const d = new Date();
		let table = document.createElement("table");
		table.id = "tableParent" + d.getSeconds() + d.getMilliseconds();
		let tbody = document.createElement("tbody");
		tbody.id = "maze" + d.getSeconds() + d.getMilliseconds();
		table.appendChild(tbody);
		document.getElementById("tableContainer").appendChild(table);
		this.graphicalMaze = tbody;
	}
	handleTabletChange(e) {
		  // Check if the media query is true
		  //solved with  this.handleTabletChange.bind(this) //which gave the function the necessary value of this as a reference of the class (and thus the possibility to call this. handleTabletChange, and give it this.graphicalMaze) and instead of the MediaQueryList value (which is passed as the e parameter)
		  //previously: THE VALUE OF this WHEN CALLED FROM this.handleTabletChange(mediaQuery); => IS THE CLASS BFSMazeApp, AS EXPECTED
		  //HOWEVER, THE VALUE OF this WHEN CALLED FROM mediaQuery.addListener(this.handleTabletChange); IS MediaQueryList!!!!!!
		  //MediaQueryList { media: "(max-width: 954px)", matches: false, onchange: null }
			// matches: false
			// media: "(max-width: 954px)"
			
		let tableElement = this.graphicalMaze.parentElement;
		if (e.matches) {
		    // Then log the following message to the console
		    console.log('Media Query Matched!');
		    tableElement.className = "useFullWidthForMobile"; //same as document.getElementById("tableParent")
		}else{
		    console.log("media query not matched");
		    tableElement.className = "";
		}
	}

	tryToFitTheMazeOnScreen(){

		const tdMinWidthInclPadding = 12; //10 + 1px padding
		const tableBorderSpacing = 1.5;
		let calculateMinWidth = tdMinWidthInclPadding * this.pocetColumns;
		calculateMinWidth += 30;
		calculateMinWidth += (this.pocetColumns - 1) * tableBorderSpacing;
		const mediaQuery = window.matchMedia('(max-width:'+ calculateMinWidth +'px)');
		
		// Register event listener

		//for the callback event listener, i.e. handleTabletChange will be the value of *this* MediaQueryList and not BFSMAzeApp
		//therefore it is not possible to write: mediaQuery.addListener(this.handleTabletChange); //(will raise TypeError)
		//mediaQuery.addListener(function(){alert(this)}) //the value of this is a MediaQueryList, so  this.handleTabletChange cannot be called from here with the tableElement parameter 
		//mediaQuery.addListener(function(){this.handleTabletChange(tableElement)}) //exactly: Uncaught TypeError: this.handleTabletChange is not a function
		//=> so doint it like this:
		mediaQuery.addListener(this.handleTabletChange.bind(this)); //nice, src bind fix https://stackoverflow.com/questions/36794934/pass-argument-to-matchmedia-addlistener-callback-function

		// Initial check
		this.handleTabletChange(mediaQuery);
	}
	renderMaze(text){
		this.createMaze()
	    if(text[text.length - 1].trim() == ""){
	    	text.pop();
	    }
	    this.pocetRows = text.length;
	    this.pocetColumns = text[0].length;
	    console.log(text)
	   
	    this.tryToFitTheMazeOnScreen();

	    for(let x = 0; x < text.length - 2; x++){ //last 2 lines are start and stop (and possibly an empty line => which I removed already)

	    	let row = text[x].split("")
	    	console.log(row)
	    	const tr = this.graphicalMaze.insertRow();
	    	
	    	//the 2D array, storing the maze in place
			this.maze.push(row);

	    	for(let y of row){
					const td = tr.insertCell();
					const div = document.createElement("div");
					div.className = "s";
					td.appendChild(div);
	  			if(y == "X"){
	  				td.classList.add("green");
	  			}
	    	}
		}

	   	let k;
	    if(text[this.pocetRows - 1].includes("end")){
	    	k = text[this.pocetRows - 1].trim().split(" "); //ten text end 153, 25 na konci vstupu
	    }
	    else{
	     	document.getElementById("endNotSpecified").classList.remove("hidden");
	     	this.zcelaHotovo = true;
	     	return;
	    }

	    this.endCoordinates = []; //column: row (will be reversed in startBFS, this format is for compatibility with mazes other created)
	    for(let x = 1; x < k.length; x++){
	    	this.endCoordinates.push( parseInt(k[x]) );	
	    }
	    console.log("this.endCoordinates", this.endCoordinates)

	    let s;
	    //same here, unlike Python, IN JS 'in' operator only for objects, for strings use .includes()
	    if(text[this.pocetRows - 2].includes("start")){
	    	s = text[this.pocetRows - 2].trim().split(" ") //text start 67, 11
	    }else{
	    	document.getElementById("startNotSpecified").classList.remove("hidden");
	    	this.zcelaHotovo = true;
	     	return;
	    }

	    this.startCoordinates = []; //column: row (will be reversed in startBFS, this format is for compatibility with mazes other created)
	    for(let x = 1; x < s.length; x++){
	    	this.startCoordinates.push( parseInt(s[x]) );	
	    }
	    console.log("this.startCoordinates", this.startCoordinates)
	    
	  }
	  presentResult(){
	  	let row = this.graphicalMaze.insertRow()
	  	let holder = row.insertCell();
	  	holder.colSpan = this.pocetColumns;
	  	holder.className = "presentResult";
	  	holder.innerHTML = "<b class='pathText'>Path</b> length from <b class='startText'>start</b> to <span class='endText'><b>end</b></span> is " + this.delkaCesty + " cells long";

	  	document.getElementById("funFact").classList.remove("hiddenWithNoHeight");
	  }
	  async startBFS(){ //async so I can use wait function
			//each item in the fronta queue has a row number, a column number and the distance from start (= length of the path) 
			//coordinates (row : column), distance
			//tuple, integer
			// (67, 11), 0
			this.startCoordinates.reverse();
			this.endCoordinates.reverse();
			this.fronta.put([this.startCoordinates, 0]);
			this.addClassToCell(this.startCoordinates, "start");
			this.addClassToCell(this.endCoordinates, "end");
			this.runBFS();
		}
		async runBFS(){
			let evaluatedVrchol;
			let vzdalenost;
			console.log(this.fronta);
			while(this.fronta.empty == false && this.zcelaHotovo == false){
				[evaluatedVrchol, vzdalenost] = this.fronta.get();

				console.error("compare field", evaluatedVrchol, "with end", this.endCoordinates) //just for aestetic purposes, not an error
				//=>IN PYTHON, evaluatedVrchol == this.endCoordinates WORKS
				//=>IN JS, that would compare memory locations, so I use String()
				//performance OK, the arrays have 2 items each
				if(String(evaluatedVrchol) == String(this.endCoordinates)){
					this.zcelaHotovo = true;
					this.delkaCesty = vzdalenost;
					//alert("DONE!!!, the length of path from start to end is: " + vzdalenost + " cells");
					this.presentResult();
				}
				await wait(parseInt(animationDelay.value));
				await this.evaluateKolemPole(evaluatedVrchol, vzdalenost, this.endCoordinates);
			}
			this.calculatePath();
			this.attachClickListenerToDrawPathToAnyField();
		}

		calculatePath(){
			let pole = this.endCoordinates;
			for(let x = 0; x < this.delkaCesty - 1; x++){ // -1 so we don't color the start coordinate too
				pole = this.zJakehoPoleJsmeSemPrisli[pole];
				this.addClassToCell(pole, "cesta");
			}
		}

		customCalculatePath(coordinates){
			let pole = coordinates;
			this.addClassToCell(coordinates, "end");
			//while(pole !== undefined){ //that doesn't work, because some neighbor field can include start to its neighboring fields and go there (i.e. on 84.txt) => the fix would be to add start to poleVidena in startBFS
			//however right now it means even start can have a zJakehoPoleJsmePrisli value (according to this data structure it is possible to come to start)
			//so then it went into a indefinite loop
			//so fixed to this:
			while(pole !== this.startCoordinates){
				pole = this.zJakehoPoleJsmeSemPrisli[pole];
				this.addClassToCell(pole, "cesta2");			
			}
		}

		async najdiOkolniPole(coordinates){
			let column = coordinates[1]
			let row = coordinates[0]
			let okolniPolePos = [];

			if(row > 0){
				if(this.maze[row - 1][column] != "X"){
					okolniPolePos.push([row - 1, column]);
				}
			}
			//is last row
			if(row < this.pocetRows - 1){
				if(this.maze[row + 1][column] != "X"){
					okolniPolePos.push([row + 1, column]);
				}
			}
			if(column > 0){
				if(this.maze[row][column - 1] != "X"){
					okolniPolePos.push([row, column - 1]);
				}
			}
			//is last column
			if(column < this.pocetColumns - 1){
				if(this.maze[row][column + 1] != "X"){
					okolniPolePos.push([row, column + 1]);
				}
			}
			console.log(okolniPolePos);
			return okolniPolePos;
		}
		
		async evaluateKolemPole(coordinates, vzdalenost, end) {
			let okolniPolePosLoc = await this.najdiOkolniPole(coordinates);
			this.addClassToCell(coordinates, "considered");
			await wait(parseInt(animationDelay.value)) // so that the viewer can prepare for new surrounding fields
			for (let x = 0; x < okolniPolePosLoc.length; x++) {
				let pole = okolniPolePosLoc[x];

				if(pole in this.poleVidena){
					console.log("skips");
					this.addClassToCell(okolniPolePosLoc[x],"skipped")
				}else{
					this.addClassToCell(okolniPolePosLoc[x], "visited");
					this.poleVidena[okolniPolePosLoc[x]] = vzdalenost + 1;
					this.fronta.put([okolniPolePosLoc[x], vzdalenost + 1]);
					this.zJakehoPoleJsmeSemPrisli[okolniPolePosLoc[x]] = coordinates;
				}
			}
			await wait(parseInt(animationDelay.value));
			this.removeClassFromCell(coordinates, "considered");
		}

		addClassToCell(coordinates, className){
			//coordinates are row : column
			//tables (tbody) support only rows : column (cells is the method of td only, not tbody) 
			let row, column;
			[row, column] = coordinates;
			try{
				this.graphicalMaze.rows[row].cells[column].classList.add(className);
			}catch(TypeError){
				console.warn("TypeError caught", "row", row, "column", column);
			}
		}
		removeClassFromCell(coordinates, className){
			let row, column;
			[row, column] = coordinates;
			try{
				this.graphicalMaze.rows[row].cells[column].classList.remove(className);
			}catch(TypeError){
				console.warn("TypeError caught", "row", row, "column", column);
			}

		}

		attachClickListenerToDrawPathToAnyField(){
			this.graphicalMaze.addEventListener("click", function(e){
				let a = e.target;
				if(a.matches("td.presentResult")){
					return;
				}else if(a.matches("div.s")){
					console.log("skrrrt", this);
													//div  td 					tr 										div		td
					let coordinates = [a.parentElement.parentElement.rowIndex, a.parentElement.cellIndex];
					console.log(coordinates);
					this.customCalculatePath(coordinates); //this.calculatePath is not a function => need to bind this
				}else if(a.matches("td")){
					console.log("brrr");
					let coordinates = [a.parentElement.rowIndex, a.cellIndex];
					this.customCalculatePath(coordinates);
				}
			}.bind(this));
		}

}

function whichLineEnding(source) {
	var temp = source.indexOf('\n');
	if (source[temp - 1] === '\r')
		return 'CRLF' //Windows
	return 'LF' //Linux
}

let mazePicker = document.getElementById("mazePicker");
mazePicker.addEventListener("change", function(e){
	let mazeSelected = mazePicker.value;
	if(mazeSelected != ""){
		let mazeUrl = ""

		if(window.location.protocol == "file:"){
			//Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at file:///C:/Users/Andrey/Documents/ksp/84.txt. (Reason: CORS request not http).
			//=> that is on purpose: 
			//	https://amp.thehackernews.com/thn/2019/07/firefox-same-origin-policy-hacking.html 
			//	https://bugzilla.mozilla.org/show_bug.cgi?id=1558299
			//so show user an alert
			document.getElementById("loadOnLocalServer").classList.remove("hidden");
			document.getElementById("loadOnLocalServerOK").focus();
			return;
		}else{
			mazeUrl = "./"  + mazeSelected;
		}
		
		fetch(mazeUrl)
		.then( r => r.text() )
		.then( t => {
			//Fun fact: when I don't stop the previous instance, I can have 5 mazes running at the same time no problem, and even responsive design works :)
			if(mazeAppClassHolderVariable != undefined){
				mazeAppClassHolderVariable.zcelaHotovo = true;
				mazeAppClassHolderVariable.hideMaze();
			}
			mazeAppClassHolderVariable = new BFSMazeApp();
			let lineEnding = whichLineEnding(t);
			if(lineEnding == "CRLF"){
				mazeAppClassHolderVariable.renderMaze(t.split("\r\n"));
			}else if(lineEnding == "LF"){
				mazeAppClassHolderVariable.renderMaze(t.split("\n"));
			}
			mazeAppClassHolderVariable.startBFS();
		});
	}
});

//reading and parsing the input into a table to display as well as the correspoding 2D Array
document.getElementById('inputfile').addEventListener('change', function(event) {
	console.log(event);
	let text = "";
    var fr = new FileReader();
    fr.onload = function(){
        let lineEnding = whichLineEnding(fr.result);
		if(lineEnding == "CRLF"){
			text = fr.result.split("\r\n");
		}else if(lineEnding == "LF"){
			text = fr.result.split("\n");
		}
        if(mazeAppClassHolderVariable != undefined){
			mazeAppClassHolderVariable.zcelaHotovo = true;
			mazeAppClassHolderVariable.hideMaze();
	   	}
		mazeAppClassHolderVariable = new BFSMazeApp();
		mazeAppClassHolderVariable.renderMaze(text);
        mazeAppClassHolderVariable.startBFS(); //entry point to our actual program
    }
    fr.readAsText(this.files[0]);
    document.getElementById("selectedFileLabel").textContent = this.files[0].name;
});

//https://stackoverflow.com/a/53452241/11844784
function wait(ms) {
	if(ms > 0){
		return new Promise((resolve, reject) => {
			setTimeout(() => {
			resolve(ms)
			}, ms )
		})
	}else{
		return;
	}
}
