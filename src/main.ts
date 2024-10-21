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
let currentStickerPreview: StickerPreview | null;
let placedStickers: StickerPreview[] = []; // Store placed stickers
let draggingSticker: StickerPreview | null = null; // Currently dragged sticker

// See size of brush at mouse location
class ToolPreview {
    private lineWidth: number;
    private x: number;
    private y: number;

    constructor(initX: number, initY: number, lineWidth: number) {
        this.x = initX;
        this.y = initY;
        this.lineWidth = lineWidth;
    }

    updatePosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    updateLineWidth(lineWidth: number) {
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

// See sticker selected at mouse location
class StickerPreview {
    private sticker: string | null;
    private x: number;
    private y: number;
    private scale: number; // Scale factor for sticker size

    constructor(initX: number, initY: number, sticker: string, scale: number = 1) {
        this.x = initX;
        this.y = initY;
        this.sticker = sticker;
        this.scale = scale; // Initialize the scale (default 1)
    }

    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.sticker) {
            ctx.save();

            const fontSize = 30 * this.scale;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Draw the sticker at the given position
            ctx.fillText(this.sticker, this.x, this.y);

            ctx.restore();
        }
    }
}


// Drawing
let isDrawing = false;

interface Point {
    x: number;
    y: number;
}

class Stroke {
    private points: Point[] = [];
    private lineWidth: number; // Thickness of brush

    constructor(initX: number, initY: number, lineWidth: number) {
        this.points.push({ x: initX, y: initY });
        this.lineWidth = lineWidth;
    }

    addPoint(x: number, y: number): void {
        this.points.push({ x, y });
    }

    display(ctx: CanvasRenderingContext2D): void {
        if (this.points.length > 0) {
            ctx.lineWidth = this.lineWidth;
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (const point of this.points) {
                ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
        }
    }
}

let currentStroke: Stroke | null = null;
let strokes: Stroke[] = [];
const drawingChanged = new Event("drawing-changed");

if (ctx) {
    // Start drawing
    canvas.addEventListener("mousedown", (event) => {
        if (currentSticker) {
            // Place a sticker at the current position
            const stickerCmd = new StickerPreview(event.offsetX, event.offsetY, currentSticker);
            placedStickers.push(stickerCmd); // Store the placed sticker
            currentSticker = null;
            currentStickerPreview = null;
            draggingSticker = stickerCmd; // Start dragging the newly placed sticker
        } else {
            isDrawing = true;
            currentStroke = new Stroke(event.offsetX, event.offsetY, currentLineWidth);
        }
        canvas.dispatchEvent(new Event("drawing-changed"));
    });

    
    canvas.addEventListener("mousemove", (event) => {
        if (draggingSticker) { // Drag the sticker
            draggingSticker.updatePosition(event.offsetX, event.offsetY); // Move the sticker with the mouse
            redraw();
        } else if (isDrawing) {
            currentStroke?.addPoint(event.offsetX, event.offsetY);
            redraw();
        } else {
            if (currentSticker) { // If a sticker is selected
                if (!currentStickerPreview) { // Currently no sticker preview
                    currentStickerPreview = new StickerPreview(event.offsetX, event.offsetY, currentSticker);
                } else {
                    currentStickerPreview.updatePosition(event.offsetX, event.offsetY); // If already preview, update position
                }
            } else if (!currentSticker && !currentToolPreview) { // If no sticker selected and no tool preview
                currentToolPreview = new ToolPreview(event.offsetX, event.offsetY, currentLineWidth);
            } else if (currentToolPreview) { // If there is tool preview
                currentToolPreview.updatePosition(event.offsetX, event.offsetY);
            }

            canvas.dispatchEvent(new Event("tool-moved"));
        }
    });

    // Stop dragging or drawing
    canvas.addEventListener("mouseup", () => {
        if (draggingSticker) {
            draggingSticker = null; // Stop dragging the sticker
        }
        if (currentStroke) {
            strokes.push(currentStroke);
            currentStroke = null;
        }
        isDrawing = false;
        canvas.dispatchEvent(new Event("drawing-changed"));
    });

    // Off canvas
    canvas.addEventListener("mouseleave", () => {
        if (draggingSticker) {
            draggingSticker = null; // Stop dragging when leaving canvas
        }
        if (currentStroke) {
            strokes.push(currentStroke);
            currentStroke = null;
        }
        isDrawing = false;
    });
}

// Redraw the canvas
function redraw() {
    if (!ctx) return;
    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "black";
    for (const stroke of strokes) {
        stroke.display(ctx);
    }

    if (currentStroke) {
        currentStroke.display(ctx);
    }

    // Draw all placed stickers
    placedStickers.forEach((sticker) => {
        sticker.draw(ctx);
    });

    if (!isDrawing && currentToolPreview) {
        currentToolPreview.draw(ctx);
    }

    if (!isDrawing && currentStickerPreview) {
        currentStickerPreview.draw(ctx);
    }
}

// Observer
canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

// Buttons
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.addEventListener("click", () => {
    if (ctx) {
        ctx.fillStyle = canvasColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        strokes = [];
        redoStack = [];
        placedStickers = []; // Clear stickers
        currentStroke = null;
    }
});
app.appendChild(clearButton);

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.addEventListener("click", () => {
    if (isDrawing) {
        currentStroke = null;
        isDrawing = false;
    } else if (strokes.length > 0) {
        const lastStroke = strokes.pop();
        if (lastStroke) {
            redoStack.push(lastStroke);
        }
    }
    canvas.dispatchEvent(drawingChanged);
});
app.appendChild(undoButton);

let redoStack: Stroke[] = [];
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.addEventListener("click", () => {
    if (isDrawing) {
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

let currentLineWidth = 2;

// Tool buttons
const thinMarkerButton = document.createElement("button");
thinMarkerButton.textContent = "Thin";
thinMarkerButton.addEventListener("click", () => {
    currentLineWidth = 2;
    currentToolPreview = new ToolPreview(0, 0, currentLineWidth);
    currentSticker = null;
    currentStickerPreview = null;
});
app.appendChild(thinMarkerButton);

const thickMarkerButton = document.createElement("button");
thickMarkerButton.textContent = "Thick";
thickMarkerButton.addEventListener("click", () => {
    currentLineWidth = 10;
    currentToolPreview = new ToolPreview(0, 0, currentLineWidth);
    currentSticker = null;
    currentStickerPreview = null;
});
app.appendChild(thickMarkerButton);

// Sticker buttons
let currentSticker: string | null = null;
const sticker1 = "😁";
const sticker2 = "😂";
const sticker3 = "😎";

const stickerButton1 = document.createElement("button");
stickerButton1.textContent = "sticker1";
stickerButton1.addEventListener("click", () => {
    currentSticker = sticker1;
    currentStickerPreview = new StickerPreview(-10, -10, currentSticker);
    currentToolPreview = null;
    canvas.dispatchEvent(new Event("tool-moved"));
});
app.appendChild(stickerButton1);

const stickerButton2 = document.createElement("button");
stickerButton2.textContent = "sticker2";
stickerButton2.addEventListener("click", () => {
    currentSticker = sticker2;
    currentStickerPreview = new StickerPreview(-10, -10, currentSticker);
    currentToolPreview = null;
    canvas.dispatchEvent(new Event("tool-moved"));
});
app.appendChild(stickerButton2);

const stickerButton3 = document.createElement("button");
stickerButton3.textContent = "sticker3";
stickerButton3.addEventListener("click", () => {
    currentSticker = sticker3;
    currentStickerPreview = new StickerPreview(-10, -10, currentSticker);
    currentToolPreview = null;
    canvas.dispatchEvent(new Event("tool-moved"));
});
app.appendChild(stickerButton3);
