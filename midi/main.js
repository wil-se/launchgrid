var midi = null;
var midiIn = null;
var midiOut = null;

var play = false
var time = 1000

var row = 8
var col = 8

let matrix = getClearMatrix(row, col)
setMatrixValue(matrix, 6, 0, 1)
setMatrixValue(matrix, 5, 1, 1)
setMatrixValue(matrix, 7, 2, 1)
setMatrixValue(matrix, 6, 2, 1)
setMatrixValue(matrix, 5, 2, 1)


 //-----------------------------
// connessione

if (navigator.requestMIDIAccess) {
    console.log('This browser supports WebMIDI!');

    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

} else {
    console.log('WebMIDI is not supported in this browser.');
}


function onMIDIFailure() {
    console.log('Error: Could not access MIDI devices.');
}

function onMIDISuccess(midiAccess) {
    var inputs = midiAccess.inputs;
    var outputs = midiAccess.outputs;

    console.log(midiAccess)

    for (var input of inputs.values()) {
        if (input.name == "Launchpad MK2 MIDI 1"){
            midiIn = input;
        }
        input.onmidimessage = getMIDIMessage;
    }

    for (var output of outputs.values()) {
        if (output.name == "Launchpad MK2 MIDI 1"){
            midiOut = output;
        }
    }

    setInterval(function(){
        play ? update(matrix):draw(matrix)
    }, time); 
}

function getMIDIMessage(message) {
    var command = message.data[0];
    var note = message.data[1];
    var velocity = (message.data.length > 2) ? message.data[2] : 0; // a velocity value might not be included with a noteOff command

    if(command == 144) {
        if (velocity > 0) {
            noteOn(note);
        }
    }
}

function noteOn(note) {
    coord = toMatrixValue(note)
    // play-pause button
    if (coord[0] == 0 && coord[1] == 8){
        console.log("play")
        play = !play
    }else if(coord[0] == 1 && coord[1] == 8){
        console.log("clear")
        reset()
        matrix = getClearMatrix(row, col)
    }else if(coord[0] == 2 && coord[1] == 8){
        reset()
        printMatrix(matrix)
        matrix = getRandomMatrix(row, col)
    }
    else if(coord[0] < 8 && coord[1] < 8){
        setMatrixValue(matrix, coord[0], coord[1], 1)
    }
}

function noteOff(note) {
    console.log("porcamadonna");
}

function reset() {
    for (i = 11; i <= 88; i++) {
        midiOut.send( [144, i, 0] )
    }
}


 //--------------------------------------------------------------------------
// Struttura astratta prima di essere scritta sul  launchpad

function printMatrix(mtrx){
    row = "cell ages: \n"
    for(var r=0; r<mtrx.length; r++){
        for(var c=0; c<mtrx[r].length; c++){
            row = row + mtrx[r][c]['age'] + " "
        }
        row = row + "\n"
    }
    console.log(row)
}

function getClearMatrix(row, col){
    var mtrx = []
    for(var r=0; r<row; r++) {
        mtrx[r] = new Array(col);
    }
    for(var r=0; r<row; r++){
        for(var c=0; c<col; c++){
            mtrx[r][c] = {'age': 0}
             // un dizionario in prospettiva del fatto che ci potranno essere più elementi
            // age è la vita. se è 0 la cella è non viva / morta, se è >1 è viva da 1 o più generazioni
        }
    }
    return mtrx
}

function getRandomMatrix(row, col){
    var mtrx = []
    for(var r=0; r<row; r++) {
        mtrx[r] = new Array(col);
    }
    for(var r=0; r<row; r++){
        for(var c=0; c<col; c++){
            mtrx[r][c] = {'age': Math.floor(Math.random()*2)}
             // un dizionario in prospettiva del fatto che ci potranno essere più elementi
            // age è la vita. se è 0 la cella è non viva / morta, se è >1 è viva da 1 o più generazioni
        }
    }
    return mtrx
}

function setMatrixValue(mtrx, row, col, age){
    mtrx[7-row][col] = {'age': age}
}

function getCellValue(mtrx, row, col) {
    return mtrx[7-row][col]
}

function getCellAge(mtrx, row, col) {
    return getCellValue(mtrx, row, col)['age']
}

// ritorna un array di vicini di una cella
function getNeighborsValues(mtrx, row, col) {
    // qui c'è da divertirsi con la ricorsione per cambiare le regole di visione dei vicini
    neighbors = []
    for(let x=1; x>-2; x--){
        for(let y=1; y>-2; y--){
            if (x != 0 || y != 0){
                if (row-x>=0 && row-x<=7 && col-y>=0 && col-y<=7){
                    neighbors[neighbors.length] = [row-x, col-y, getCellValue(mtrx, row-x, col-y)['age']]
                }
            }        
        }
    }
     // return [[x,y,age],...]
    // si potrebbe ritornare anche solo una lista di età, tanto quello serve
    
    return neighbors
}


function countAliveNeighbors(mtrx, row, col){
    neighbors = getNeighborsValues(mtrx, row, col)
    aliveNeighbors = 0
    for(var n=0; n<neighbors.length; n++){
        if(neighbors[n][2]>0){
            aliveNeighbors++
        }
    }
    return aliveNeighbors
}

function sendInput(row, col, colour) {
    (colour >= 0 && colour <=127) ? midiOut.send( [144, toNoteValue(row, col), colour] ) : midiOut.send( [144, toNoteValue(row, col), 127] )
}

// traduce da xy a valore nota midi
function toNoteValue(row, col){
    if (row >= 0 && row < 8 && col >= 0 && col < 8){
        return ((row+1)*10)+col+1;
    }
    return null
}

// traduce da nota midi a valore matrice
function toMatrixValue(val){
    if(val>10 && val < 89){
        return [parseInt((val/10))-1, (val%10)-1]
    }
    return null
}

function draw(mtrx){
    for (let r = 0; r < mtrx.length; r++){
        for (let c = 0; c < mtrx[r].length; c++){
            sendInput(r, c, mtrx[7-r][c]['age'])
        }
    }
}

function evolve(mtrx) {
    next = getClearMatrix(mtrx.length, mtrx.length)
    
    for(var r=0; r<mtrx.length; r++){
        for(var c=0; c<mtrx[r].length; c++){
            currentValue = getCellAge(mtrx, r, c)
            aliveNeighbors = countAliveNeighbors(mtrx, r, c)
            // nascita
            if(currentValue == 0 && aliveNeighbors == 3){
                setMatrixValue(next, r, c, 1)
            }
            // sopravvivenza
            else if(currentValue > 0 && (aliveNeighbors == 3 || aliveNeighbors == 2)){
                setMatrixValue(next, r, c, ++currentValue)
            }
            // morte
            else{
                setMatrixValue(next, r, c, 0)
            }
        }
    }
    return next
}

function update(mtrx) {
    console.log('####UPDATE####')
    printMatrix(mtrx)
    draw(mtrx)
    matrix = evolve(mtrx)
}

