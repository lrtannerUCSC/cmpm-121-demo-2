export class RectangleTool {
    private button: HTMLButtonElement;
    private ctx: CanvasRenderingContext2D | null;
    private rectangleCount: number;
    private rectangles: { x: number; y: number; width: number; height: number; color: string }[];
  
    constructor(ctx: CanvasRenderingContext2D | null) {
      this.ctx = ctx;
      this.rectangleCount = 0;
      this.rectangles = []; // Array to store rectangle information
  
      // Create and configure the button
      this.button = document.createElement("button");
      this.button.textContent = `Rectangle: ${this.rectangleCount}`; // Initial count
      this.button.id = "rectangle-button"; // Assign an ID for styling
      this.button.addEventListener("click", this.drawRandomRectangle.bind(this));
      document.body.appendChild(this.button);
    }
  
    private drawRandomRectangle() {
      if (!this.ctx) return;
  
      // Generate random dimensions and position
      const rectWidth = Math.floor(Math.random() * 50) + 20; // Random width (20–70)
      const rectHeight = Math.floor(Math.random() * 50) + 20; // Random height (20–70)
      const x = Math.floor(Math.random() * (256 - rectWidth)); // Ensure within canvas bounds
      const y = Math.floor(Math.random() * (256 - rectHeight)); // Ensure within canvas bounds
      const color = this.getRandomColor(); // Random fill color
  
      // Store rectangle information
      this.rectangles.push({ x, y, width: rectWidth, height: rectHeight, color });
  
      // Draw the rectangle
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, rectWidth, rectHeight);
  
      // Increment rectangle count and update button text
      this.rectangleCount++;
      this.updateButtonText();
    }
  
    public resetRectangleCount() {
      this.rectangleCount = 0;
      this.rectangles = []; // Clear stored rectangles
      this.updateButtonText();
    }
  
    public drawAllRectangles() {
      if (!this.ctx) return;
  
      for (const rect of this.rectangles) {
        this.ctx.fillStyle = rect.color;
        this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      }
    }
  
    private updateButtonText() {
      this.button.textContent = `Rectangle: ${this.rectangleCount}`;
    }
  
    private getRandomColor(): string {
      const randomColor = `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`;
      return randomColor;
    }
  }
  