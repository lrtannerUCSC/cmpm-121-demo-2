export class RectangleTool {
  private button: HTMLButtonElement;
  private ctx: CanvasRenderingContext2D | null;
  private rectangleCount: number;

  constructor(ctx: CanvasRenderingContext2D | null) {
    this.ctx = ctx;
    this.rectangleCount = 0;

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

    // Set random fill color
    this.ctx.fillStyle = this.getRandomColor();
    this.ctx.fillRect(x, y, rectWidth, rectHeight);

    // Increment rectangle count and update button text
    this.rectangleCount++;
    this.updateButtonText();
  }

  public resetRectangleCount() {
    this.rectangleCount = 0;
    this.updateButtonText();
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
