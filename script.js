// WebGL2 - 2D Rectangles
// from https://webgl2fundamentals.org/webgl/webgl-2d-rectangles.html

"use strict";

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
        for (let i = 0; i < 30000; ++i){
            const x = randomInt(1000);
            const y = randomInt(1000);
            this.rectangles.push([x, y, 5, 5, Math.random(), Math.random(), Math.random()]);
        }
        const numTrianglesPerRectangle = 2;
        const numVerticesPerTriangle = 3;
        const numFloatsPerVertex = 6; // 2 floats for position + 4 floats for color (R, G, B, A)
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
     * Given color components as floating point from 0.0 to 1.0, return a packed 32-bit
     * floating point value.
     */
    getFloatColor(r, g, b, a)
    {
        // Get uint8 versions of each component
        const r_8 = Math.floor(r * 255);
        const g_8 = Math.floor(g * 255);
        const b_8 = Math.floor(b * 255);
        const a_8 = Math.floor(a * 255);
        // Use TypedArray casting to pack the 8-bit values into a single 32-bit value
        return new Float32Array((new Uint8Array([r_8, g_8, b_8, a_8])).buffer)[0];
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
        const numColorFields = 4;
        const fieldSize = 4;  // because gl.FLOAT
        const numTotalFields = numPositionFields + numColorFields;
        const stride = fieldSize * numTotalFields;
        gl.vertexAttribPointer(
            positionAttributeLocation, numPositionFields, gl.FLOAT, false, stride, 0);
        gl.vertexAttribPointer(
            colorAttributeLocation, numColorFields, gl.FLOAT, true, stride, numPositionFields * fieldSize);
    }

    draw() {
        // Get A WebGL context
        const gl = this.getContext();
        if (!gl) {
            return;
        }

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

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        // Pass in the canvas resolution so we can convert from
        // pixels to clipspace in the shader
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

        const offsetX = 30 * Math.cos(performance.now() / 1000.0);
        const offsetY = 30 * Math.sin(performance.now() / 1000.0);
        // Reuse the same array buffer each frame
        const arrayBuffer = this.arrayBuffer;
        let curIndex = 0;

        const addVertex = (x, y, r, g, b) => {
            arrayBuffer[curIndex++] = x;
            arrayBuffer[curIndex++] = y;
            arrayBuffer[curIndex++] = r;
            arrayBuffer[curIndex++] = g;
            arrayBuffer[curIndex++] = b;
            arrayBuffer[curIndex++] = 1.0;
        };

        const addRectangle = (x, y, w, h, r, g, b) => {
            const x2 = x + w;
            const y2 = y + h;
            addVertex(x, y, r, g, b);
            addVertex(x2, y, r, g, b);
            addVertex(x, y2, r, g, b);
            addVertex(x, y2, r, g, b);
            addVertex(x2, y, r, g, b);
            addVertex(x2, y2, r, g, b);
        };
        // draw random rectangles in random colors
        for (const rect of this.rectangles) {
            // Put a rectangle in the position buffer
            const [x, y, w, h, r, g, b] = rect;
            addRectangle(x + offsetX, y + offsetY, w, h, r, g, b);
        }

        // Copy the coordinates into the currently bound buffer.
        gl.bufferData(gl.ARRAY_BUFFER, arrayBuffer, gl.STATIC_DRAW);

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
