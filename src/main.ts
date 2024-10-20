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

// Drawing
let isDrawing = false;

interface Point {
    x: number;
    y: number;
}

class Stroke {
    private points: Point[] = []; // Points of current stroke

    constructor(initX: number, initY: number){ // Starts making line
        this.points.push({x: initX, y: initY}); // Push initial coords to list
    }

    addPoint(x: number, y: number): void{ // Add new point to line
        this.points.push({x, y});
    }

    display(ctx: CanvasRenderingContext2D): void{
        if (this.points.length > 0){
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (const point of this.points){
                ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
        }
    }
}

let currentStroke: Stroke | null = null; // Current stroke being drawn
let strokes: Stroke[] = []; // All strokes

const drawingChanged = new Event("drawing-changed");

if (ctx) {
    // Start drawing
    canvas.addEventListener("mousedown", (event) => {
        isDrawing = true;
        currentStroke = new Stroke(event.offsetX, event.offsetY); // Create new stroke
    });

    // Draw
    canvas.addEventListener("mousemove", (event) => {
        if (!isDrawing) return;
        currentStroke?.addPoint(event.offsetX, event.offsetY);
        canvas.dispatchEvent(drawingChanged);
    });

    // Stop drawing
    canvas.addEventListener("mouseup", () => {
        if (currentStroke) {
            strokes.push(currentStroke);
            currentStroke = null;
        }
        isDrawing = false;
    });

    // Off canvas
    canvas.addEventListener("mouseleave", () => {
        if (currentStroke) {
            strokes.push(currentStroke);
            currentStroke = null;
        }
        isDrawing = false;
    });
}

// Redraw the canvas
function redraw() {
    if (!ctx) return; // Check if ctx is not null
    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear canvas

    // Redraw all complete strokes
    ctx.strokeStyle = "black"; // Set stroke color
    for (const stroke of strokes) {
        stroke.display(ctx); // Display every stroke on the ctx (screen)
    }

    // Draw the current stroke being drawn
    if (currentStroke) {
        currentStroke.display(ctx); // Display currentStroke if exists
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
        redoStack = [];
        currentStroke = null; // Clear current stroke
    }
});
app.appendChild(clearButton);

// Undo button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.addEventListener("click", () => {
    if (isDrawing) { // if the user is drawing, throw it away
        currentStroke = null;
        isDrawing = false;
    } else if (strokes.length > 0) {
        const lastStroke = strokes.pop();
        if (lastStroke) {
            redoStack.push(lastStroke); // Push undo to redo stack
        }
    }
    canvas.dispatchEvent(drawingChanged);
});
app.appendChild(undoButton);

// Redo button
let redoStack: Stroke[] = [];
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.addEventListener("click", () => {
    if (isDrawing) { // if user is drawing, throw it away
        currentStroke = null;
        isDrawing = false;
    } else if (redoStack.length > 0) {
        const lastRedo = redoStack.pop();
        if (lastRedo !== undefined) {
            strokes.push(lastRedo);
        }
    }
    canvas.dispatchEvent(drawingChanged);
});
app.appendChild(redoButton);