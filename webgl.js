// WebGL2 - 2D Rectangles
// from https://webgl2fundamentals.org/webgl/webgl-2d-rectangles.html

"use strict";

const floatCastBuffer = new ArrayBuffer(4);
const floatCastView = new DataView(floatCastBuffer);

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;
in vec4 a_color;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

out vec4 v_color;

// all shaders have a main function
void main() {

  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

  // Pass through the color unmodified
  v_color = a_color;
}
`;

var fragmentShaderSource = `#version 300 es

precision mediump float;

in vec4 v_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = v_color;
}
`;

// Returns a random integer from 0 to range - 1.
function randomInt(range) {
return Math.floor(Math.random() * range);
}

class RectangleDrawer {
    constructor() {
        const gl = this.getContext();
        this.program = webglUtils.createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]);
        this.rectangles = [];

        const randomRGB = () => {
            return Math.floor(Math.random() * 255);
        };

        for (let i = 0; i < 100000; ++i){
            const x = randomInt(1000);
            const y = randomInt(1000);
            this.rectangles.push([x, y, 5, 5, randomRGB(), randomRGB(), randomRGB()]);
        }
        const numTrianglesPerRectangle = 2;
        const numVerticesPerTriangle = 3;
        const numFloatsPerVertex = 3; // 2 floats for position + 1 floats for color
        const numFloatsPerTriangle = numFloatsPerVertex * numVerticesPerTriangle;
        const numFloatsPerRectangle = numFloatsPerTriangle * numTrianglesPerRectangle;
        this.arrayBuffer = new Float32Array(numFloatsPerRectangle * this.rectangles.length);
        this.setupBuffer();
    }

    getContext() {
        var canvas = document.getElementById("c");
        var gl = canvas.getContext("webgl2");
        return gl;
    }

    /**
     * Given color components as 8-bit unsigned (0-255), return a packed 32-bit
     * floating point value.
     */
    getFloatColor(r, g, b, a)
    {
        floatCastView.setUint8(0, a);
        floatCastView.setUint8(1, r);
        floatCastView.setUint8(2, g);
        floatCastView.setUint8(3, b);
        return floatCastView.getFloat32(0);
    }

    setupBuffer() {
        const gl = this.getContext();
        if (!gl) {
            return;
        }
        const program = this.program;

        // look up where the vertex data needs to go.
        var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        var colorAttributeLocation = gl.getAttribLocation(program, "a_color");

        // Create a buffer
        this.buffer = gl.createBuffer();
        const buffer = this.buffer;

        // Turn on the attributes
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.enableVertexAttribArray(colorAttributeLocation);

        // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = buffer)
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        // Tell the attribute how to get data out of buffer (ARRAY_BUFFER)
        const numPositionFields = 2;
        const numColorFields = 1;
        const fieldSize = 4;  // because gl.FLOAT
        const numTotalFields = numPositionFields + numColorFields;
        const stride = fieldSize * numTotalFields;
        gl.vertexAttribPointer(
            positionAttributeLocation, numPositionFields, gl.FLOAT, false, stride, 0);
        gl.vertexAttribPointer(
            colorAttributeLocation, 4, gl.UNSIGNED_BYTE, true, stride, numPositionFields * fieldSize);
    }

    fillBuffer() {
        const gl = this.getContext();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        const offsetX = 30 * Math.cos(performance.now() / 1000.0);
        const offsetY = 30 * Math.sin(performance.now() / 1000.0);
        // Reuse the same array buffer each frame
        const arrayBuffer = this.arrayBuffer;
        let curIndex = 0;

        const addRectangle = (x, y, w, h, color) => {
            const x2 = x + w;
            const y2 = y + h;
            arrayBuffer[curIndex] = x;
            arrayBuffer[curIndex+1] = y;
            arrayBuffer[curIndex+2] = color;

            arrayBuffer[curIndex+3] = x2;
            arrayBuffer[curIndex+4] = y;
            arrayBuffer[curIndex+5] = color;

            arrayBuffer[curIndex+6] = x;
            arrayBuffer[curIndex+7] = y2;
            arrayBuffer[curIndex+8] = color;

            arrayBuffer[curIndex+9] = x;
            arrayBuffer[curIndex+10] = y2;
            arrayBuffer[curIndex+11] = color;
            
            arrayBuffer[curIndex+12] = x2;
            arrayBuffer[curIndex+13] = y;
            arrayBuffer[curIndex+14] = color;

            arrayBuffer[curIndex+15] = x2;
            arrayBuffer[curIndex+16] = y2;
            arrayBuffer[curIndex+17] = color;

            curIndex += 18;
        };
        // draw random rectangles in random colors
        for (const rect of this.rectangles) {
            // Put a rectangle in the position buffer
            const [x, y, w, h, r, g, b] = rect;
            const color = this.getFloatColor(r, g, b, 255);
            addRectangle(x + offsetX, y + offsetY, w, h, color);
        }

        // Copy the coordinates into the currently bound buffer.
        gl.bufferData(gl.ARRAY_BUFFER, arrayBuffer, gl.STATIC_DRAW);
    }

    draw() {
        // Get A WebGL context
        const gl = this.getContext();
        const program = this.program;

        // look up uniform locations
        var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Pass in the canvas resolution so we can convert from
        // pixels to clipspace in the shader
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

        this.fillBuffer();

        // Draw the rectangle.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        const numTrianglesPerRectangle = 2;
        const numVerticesPerTriangle = 3;
        const numVerticesPerRectangle = numVerticesPerTriangle * numTrianglesPerRectangle;
        var count = numVerticesPerRectangle * this.rectangles.length;
        gl.drawArrays(primitiveType, offset, count);
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
