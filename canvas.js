"use strict";

// Returns a random integer from 0 to range - 1.
function randomInt(range) {
return Math.floor(Math.random() * range);
}

class RectangleDrawer {
    constructor() {
        this.rectangles = [];

        const randomRGB = () => {
            return Math.floor(Math.random() * 255);
        };

        for (let i = 0; i < 100000; ++i){
            const x = randomInt(1000);
            const y = randomInt(1000);
            const [r, g, b] = [randomRGB(), randomRGB(), randomRGB()];
            const fillStyle = `rgba(${r}, ${g}, ${b}, ${255})`;
            this.rectangles.push([x, y, 5, 5, fillStyle]);
        }


        const canvas = document.getElementById('c');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    getContext() {
        var canvas = document.getElementById("c");
        return canvas.getContext("2d");
    }

    draw() {
        const canvas = document.getElementById('c');
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ctx = this.getContext();
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        const offsetX = 30 * Math.cos(performance.now() / 1000.0);
        const offsetY = 30 * Math.sin(performance.now() / 1000.0);

        for (const rect of this.rectangles) {
            // Put a rectangle in the position buffer
            const [x, y, w, h, fillStyle] = rect;
            ctx.fillStyle = fillStyle;
            ctx.fillRect(x + offsetX, y + offsetY, w, h);
        }
    }
}

function step(rd) {
    const t0 = performance.now();
    rd.draw();
    const elapsed = performance.now() - t0;
    console.log(`Took ${elapsed} ms to draw`);
    requestAnimationFrame(() => step(rd));
}

function main() {
    const rd = new RectangleDrawer();
    step(rd);
}

main();
