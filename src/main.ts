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
let draggingSticker: Stroke | null = null; // Currently dragged sticker

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
            ctx.fillStyle = "black";

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
    private sticker: string | null;
    private position: Point | null;

    constructor(initX: number, initY: number, lineWidth: number, sticker: string | null = null) {
        if (sticker) {
            // If it's a sticker stroke
            this.sticker = sticker;
            this.position = { x: initX, y: initY };
            this.lineWidth = 0;
        } else {
            // If it's a drawing stroke
            this.points.push({ x: initX, y: initY });
            this.lineWidth = lineWidth;
            this.sticker = null;
            this.position = null;
        }
    }

    updatePosition(x: number, y: number) {
        if (this.points.length < 1)
            this.position = { x: x, y: y }
    }

    addPoint(x: number, y: number): void {
        if (!this.sticker) {
            this.points.push({ x, y });
        }
    }

    display(ctx: CanvasRenderingContext2D): void {
        if (this.sticker && this.position) {
            // Draw sticker if this stroke represents a sticker
            ctx.save();
            const fontSize = 30;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "black";
            ctx.fillText(this.sticker, this.position.x, this.position.y);
            ctx.restore();
        } else if (this.points.length > 0) {
            // Draw a normal stroke
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
            const stickerStroke = new Stroke(event.offsetX, event.offsetY, 0, currentSticker);
            strokes.push(stickerStroke);
            currentSticker = null;
            currentStickerPreview = null;
            draggingSticker = stickerStroke; // Start dragging the newly placed sticker
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

// Sticker class that creates and manages its button
class Sticker {
    private stickerImage: string;
    public stickerButton: HTMLButtonElement;

    constructor(stickerImage: string) {
        this.stickerImage = stickerImage;
        this.stickerButton = document.createElement("button");
        this.stickerButton.textContent = this.stickerImage;
        this.stickerButton.addEventListener("click", () => {
            currentSticker = this.stickerImage;
            currentStickerPreview = new StickerPreview(-10, -10, currentSticker);
            currentToolPreview = null;
            canvas.dispatchEvent(new Event("tool-moved"));
        });
    }
}

// Sticker buttons
let currentSticker: string | null = null;
let stickers = ["😁", "😂", "😎"];

// Create a container for sticker buttons
const stickerContainer = document.createElement("div");
app.appendChild(stickerContainer);


function createStickerButtons() {
    stickerContainer.innerHTML = ''; // Clear previous buttons
    stickers.forEach((sticker) => {
        const stickerObj = new Sticker(sticker); // Create new Sticker
        stickerContainer.appendChild(stickerObj.stickerButton); // Append the button from Sticker class
    });
}

// Custom sticker button
const customStickerButton = document.createElement("button");
customStickerButton.textContent = "Add Custom Sticker";
customStickerButton.addEventListener("click", () => {
    const customSticker = prompt("Enter your custom sticker:", "🌟");
    if (customSticker) {
        stickers.push(customSticker);
        createStickerButtons(); // Recreate buttons after adding a new sticker
    }
});
app.appendChild(customStickerButton);

// Initial setup to create the sticker buttons
createStickerButtons();


// Export Button
const exportButton = document.createElement("button");
exportButton.textContent = "Export";
exportButton.addEventListener("click", () => {
    
    // Create a new canvas for export
    const exportCanvas = document.createElement("canvas");
    const exportCanvasWidth = 1024;
    const exportCanvasHeight = 1024;
    const exportCanvasColor = "white";
    exportCanvas.width = exportCanvasWidth;
    exportCanvas.height = exportCanvasHeight;

    const exportCtx = exportCanvas.getContext("2d");
    if (exportCtx) {
        exportCtx.fillStyle = exportCanvasColor; // Fill the new canvas with white background
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        // Scale the context to match the original canvas
        exportCtx.scale(4, 4);

        for (const stroke of strokes) {
            stroke.display(exportCtx); // Use existing display method
        }

        // Create a link element to trigger the download
        const link = document.createElement("a");
        link.download = "drawing.png";
        link.href = exportCanvas.toDataURL("image/png"); // Get the PNG data URL
        link.click(); // Trigger the download
    }
});
app.appendChild(exportButton);
