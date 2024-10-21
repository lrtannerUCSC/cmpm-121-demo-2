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

let currentToolPreview: ToolPreview | null;

// ToolPreview
class ToolPreview {
    private lineWidth: number;
    private x: number;
    private y: number;

    constructor(initX: number, initY: number, lineWidth: number){ // Starts making line
        this.x = initX;
        this.y = initY;
        this.lineWidth = lineWidth;
    }

    updatePosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    updateLineWidth(lineWidth: number){
        this.lineWidth = lineWidth;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.lineWidth / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// Drawing
let isDrawing = false;

interface Point {
    x: number;
    y: number;
}

class Stroke {
    private points: Point[] = []; // Points of current stroke
    private lineWidth: number;

    constructor(initX: number, initY: number, lineWidth: number){ // Starts making line
        this.points.push({x: initX, y: initY}); // Push initial coords to list
        this.lineWidth = lineWidth;
    }

    addPoint(x: number, y: number): void{ // Add new point to line
        this.points.push({x, y});
    }

    display(ctx: CanvasRenderingContext2D): void{
        if (this.points.length > 0){
            ctx.lineWidth = this.lineWidth;
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
        currentStroke = new Stroke(event.offsetX, event.offsetY, currentLineWidth); // Create new stroke
        canvas.dispatchEvent(new Event("drawing-changed"));
    });

    // Draw
    canvas.addEventListener("mousemove", (event) => {
        if (isDrawing) {  // While drawing update stroke with new points
            currentStroke?.addPoint(event.offsetX, event.offsetY);
            redraw();  // Trigger redraw immediately to show the stroke
        } else {  // When not drawing update the tool preview position
            if (!currentToolPreview) {
                currentToolPreview = new ToolPreview(event.offsetX, event.offsetY, currentLineWidth);
            } else {
                currentToolPreview.updatePosition(event.offsetX, event.offsetY);
            }
            canvas.dispatchEvent(new Event("tool-moved"));
        }
    });

    // Stop drawing
    canvas.addEventListener("mouseup", () => {
        if (currentStroke) {
            strokes.push(currentStroke);
            currentStroke = null;
        }
        isDrawing = false;
        canvas.dispatchEvent(new Event("drawing-changed"));
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

    // Draw tool preview if not currently drawing
    if (!isDrawing && currentToolPreview) {
        currentToolPreview.draw(ctx);
    }
}

// Observer
canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

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

let currentLineWidth = 2; // Default thin

// Thin Marker Button
const thinMarkerButton = document.createElement("button");
thinMarkerButton.textContent = "Thin";
thinMarkerButton.addEventListener("click", () => {
    currentLineWidth = 2;
    if (currentToolPreview) { // Update tool preview size
        currentToolPreview.updateLineWidth(currentLineWidth);
    }
});
app.appendChild(thinMarkerButton);

// Thick Marker Button
const thickMarkerButton = document.createElement("button");
thickMarkerButton.textContent = "Thick";
thickMarkerButton.addEventListener("click", () => {
    currentLineWidth = 10;
    if (currentToolPreview) { // Update tool preview size
        currentToolPreview.updateLineWidth(currentLineWidth);
    }
});
app.appendChild(thickMarkerButton);

// Mega Thick Marker Button
const megaThickMarkerButton = document.createElement("button");
megaThickMarkerButton.textContent = "Mega Thick";
megaThickMarkerButton.addEventListener("click", () => {
    currentLineWidth = 50;
    if (currentToolPreview) { // Update tool preview size
        currentToolPreview.updateLineWidth(currentLineWidth);
    }
});
app.appendChild(megaThickMarkerButton);