import "./style.css";

const APP_NAME = "LT Paint";
const app = document.querySelector<HTMLDivElement>("#app")!;

// Canvas
const canvas = document.createElement("canvas");
const canvasWidth = 256;
const canvasHeight = 256;
const canvasColor = "white";
canvas.id = "canvas";
canvas.width = canvasWidth;
canvas.height = canvasHeight;
app.appendChild(canvas);

// 2D context
const ctx = canvas.getContext("2d");
if (ctx) {
    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Title
const titleElement = document.createElement("h1");
titleElement.textContent = APP_NAME;
titleElement.style.marginBottom = "20px";
app.prepend(titleElement); // prepend to keep on top

let isDrawing = false;

interface Point {
    x: number;
    y: number;
}

let currentStroke: Point[] = []; // Current stroke being drawn
let strokes: Point[][] = []; // All strokes

const drawingChanged = new Event("drawing-changed");

// Drawing
if (ctx) {
    // Start drawing
    canvas.addEventListener("mousedown", (event) => {
        isDrawing = true;
        currentStroke = [];
        addPoint(event.offsetX, event.offsetY);
    });

    // Draw
    canvas.addEventListener("mousemove", (event) => {
        if (!isDrawing) return;
        addPoint(event.offsetX, event.offsetY);
        canvas.dispatchEvent(drawingChanged);
    });

    // Stop drawing
    canvas.addEventListener("mouseup", () => {
        if (currentStroke.length > 0) {
            strokes.push(currentStroke);
        }
        isDrawing = false;
        currentStroke = [];
    });

    // Off canvas
    canvas.addEventListener("mouseleave", () => {
        if (currentStroke.length > 0) {
            strokes.push(currentStroke);
        }
        isDrawing = false;
        currentStroke = [];
    });
}

// Function to add a point
function addPoint(x: number, y: number) {
    currentStroke.push({ x, y });
}

// Redraw the canvas
function redraw() {
    if (!ctx) return; // Check if ctx is not null
    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear canvas

    // Redraw all complete strokes
    ctx.strokeStyle = "black"; // Set stroke color
    for (const stroke of strokes) {
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (const point of stroke) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
    }

    // Draw the current stroke being drawn
    if (currentStroke.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
        for (const point of currentStroke) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
    }
}

// Observer
canvas.addEventListener("drawing-changed", redraw);

// Clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.addEventListener("click", () => {
    if (ctx) {
        ctx.fillStyle = canvasColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        strokes = []; // Clear strokes
        currentStroke = []; // Clear current stroke
    }
});
app.appendChild(clearButton);

// Undo button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.addEventListener("click", () => {
    if (isDrawing) { // if the user is drawing, throw it away
        currentStroke = [];
        isDrawing = false;
    } else if (strokes.length > 0) {
        let lastStroke = strokes.pop();
        if (lastStroke !== undefined) {
            redoStack.push(lastStroke); // Push undo to redo stack
        }
    }
    canvas.dispatchEvent(drawingChanged);
});
app.appendChild(undoButton);




// Redo button

let redoStack: Point[][] = [];
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.addEventListener("click", () => {
    if (isDrawing) { // if user is drawing, throw it away
        currentStroke = [];
        isDrawing = false;
    } else if (redoStack.length > 0) {
        let lastRedo = redoStack.pop();
        if (lastRedo !== undefined) {
            strokes.push(lastRedo);
        }
    }
    canvas.dispatchEvent(drawingChanged);
});
app.appendChild(redoButton);