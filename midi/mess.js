var midi = null;
var midiIn = null;
var midiOut = null;
var time = 2000;

var row = 8
var col = 8
var matrix = voidMatrix(row, col)

console.log("initial value")
printMatrix(matrix)

matrix[5][5] = {'age':1}
setMatrixValue(4, 5, 1)
//setMatrixValue(5, 5, 1)
setMatrixValue(6, 5, 1)

console.log("init state")
printMatrix(matrix)


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

function getMIDIMessage(message) {
    var command = message.data[0];
    var note = message.data[1];
    var velocity = (message.data.length > 2) ? message.data[2] : 0; // a velocity value might not be included with a noteOff command

    console.log("----------------------------")
    console.log("command: " + command);
    console.log("note: " + note);
    console.log("velocity: " + velocity);

    switch (command) {
        case 144: // note on
            if (velocity > 0) {
                noteOn(note);
            } else {
                noteOff(note);
            }
            break;
        case 128: // note off
            noteOffCallback(note);
            break;
        // we could easily expand this switch statement to cover other types of commands such as controllers or sysex
    }
}

function noteOn(note) {
    console.log("porcoddio");
}

function noteOff(note) {
    console.log("porcamadonna");
}

function setTime(t){
    time = t;
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
    setInterval(function(){updateMatrix()}, time);   
}

 //--------------------------------------------------------------------------
// Struttura astratta prima di essere scritta sul  launchpad

function voidMatrix(row, col){
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

function printMatrix(matrix){
    row = ""
    for(var r=0; r<matrix.length; r++){
        for(var c=0; c<matrix[r].length; c++){
            row = row + matrix[r][c]['age'] + " "
        }
        row = row + "\n"
    }
    console.log(row)
}
// data={'age':n=>0}
function setMatrixValue(x, y, age) {
    matrix[x][y] = {'age': age}
}

function getMatrixValue(x, y) {
    return matrix[x][y]
}

// ritorna un array di vicini di una cella
function getNeighborsValues(row, col) {
    // qui c'è da divertirsi con la ricorsione per cambiare le regole di visione dei vicini
    neighbors = []
    for(let x=1; x>-2; x--){
        for(let y=1; y>-2; y--){
            if (x != 0 || y != 0){
                if (row-x>=0 && row-x<=7 && col-y>=0 && col-y<=7){
                    neighbors[neighbors.length] = [row-x, col-y, matrix[row-x][col-y]['age']]
                }
            }        
        }
    }
    // return [[x,y,age],...]
    return neighbors
}

function updateMatrix(){
    console.log("#############################update#################################")
    console.log(matrix)
    draw();
    next();
}

function draw(){
    for (let r = 0; r < row; r++){
        for (let c = 0; c < col; c++){
            sendInput(r, c, matrix[r][c]['age'])       
            //console.log('hola')
        }
    }
}

function sendInput(x, y, colour) {
    if (colour >= 0 || colour <=127) {
        midiOut.send( [144, getNoteValue(x, y), colour] )
    }
}

function getNoteValue(row, col){
    if (row >= 0 && row < 8 && col >= 0 && col < 8){
        return ((row+1)*10)+col+1;
    }
    return null
}


function next(){
    nxt = matrix.slice()
    for (let j = 0; j <8; j++){
        for (let k = 0; k<8; k++){
            if(lives(j, k)){
                age = getMatrixValue(j, k)['age']
                nxt[j][k] = {'age': age++}
            }else{
                nxt[j][k] = {'age': 0}
            }

        }
    }
    matrix = nxt
}

function lives(x, y){
    // get neighbors info
    neighbors = getNeighborsValues(x, y)
    alive = 0
    for (let n=0; n<neighbors.length; n++){
        // for each neighbor take age info
        if(neighbors[n][2] > 0){
            alive++
        }
    }
    if(alive == 3 || alive == 2){
        return true
    }
    return false
}



function reset() {
    for (i = 11; i <= 88; i++) {
        midiOut.send( [144, i, 0] )
    }
}

