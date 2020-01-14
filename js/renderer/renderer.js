const Renderer = function(canvas, clearColor) {
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    const matrixBuffer = new Array(16);
    const matrixProjection = new Matrix();
    const matrixView = new Matrix();
    const matrixAll = new Matrix();
    let width = canvas.width;
    let height = canvas.height;

    const Shader = function(vertex, fragment, uniforms, attributes) {
        const shaderVertex = gl.createShader(gl.VERTEX_SHADER);
        const shaderFragment = gl.createShader(gl.FRAGMENT_SHADER);
        const program = gl.createProgram();

        gl.shaderSource(shaderVertex, vertex);
        gl.compileShader(shaderVertex);

        gl.shaderSource(shaderFragment, fragment);
        gl.compileShader(shaderFragment);

        gl.attachShader(program, shaderVertex);
        gl.attachShader(program, shaderFragment);
        gl.linkProgram(program);
        gl.detachShader(program, shaderVertex);
        gl.detachShader(program, shaderFragment);
        gl.deleteShader(shaderVertex);
        gl.deleteShader(shaderFragment);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            console.log(gl.getProgramInfoLog(program));

        this.use = () => {
            gl.useProgram(program);

            return this;
        };

        for (const uniform of uniforms)
            this["u" + uniform.charAt(0).toUpperCase() + uniform.slice(1)] = gl.getUniformLocation(program, uniform);

        for (const attrib of attributes)
            this["a" + attrib.charAt(0).toUpperCase() + attrib.slice(1)] = gl.getAttribLocation(program, attrib);
    };

    const programLines = new Shader(
        Renderer.SHADER_LINES_VERTEX,
        Renderer.SHADER_LINES_FRAGMENT,
        ["transform", "t", "alpha", "flashStart"],
        ["position"]);
    let programCurrent = null;

    const updateMatrices = () => {
        matrixAll.set(matrixProjection);
        matrixAll.multiply(matrixView);
        matrixAll.toArray(matrixBuffer);
    };

    const sendMatrices = () => {
        if (!programCurrent)
            return;

        gl.uniformMatrix4fv(programCurrent.uTransform, false, matrixBuffer);
    };

    const setProgram = program => {
        if (programCurrent !== program) {
            programCurrent = program.use();

            sendMatrices();
        }
    };

    this.MeshLines = function(trails) {
        const buffer = gl.createBuffer();
        const elements = Fusion.TRAILS * (Trail.STEPS - 1) << 1;
        const data = new Array(elements * 8);

        this.upload = () => {
            for (let trail = 0; trail < trails.length; ++trail) for (let i = 1; i < Trail.STEPS; ++i) {
                const ip = i - 1;
                const index = trail * (Trail.STEPS - 1) * 8 + ip * 8;

                data[index] = trails[trail].points[ip].x;
                data[index + 1] = trails[trail].points[ip].y;
                data[index + 2] = trails[trail].points[ip].z;
                data[index + 3] = ip / Trail.STEPS;
                data[index + 4] = trails[trail].points[i].x;
                data[index + 5] = trails[trail].points[i].y;
                data[index + 6] = trails[trail].points[i].z;
                data[index + 7] = i / Trail.STEPS;
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        };

        this.draw = (progress, alpha, flashStart) => {
            setProgram(programLines);

            gl.uniform1f(programLines.uT, progress);
            gl.uniform1f(programLines.uAlpha, alpha);
            gl.uniform1f(programLines.uFlashStart, flashStart);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(programLines.aPosition);
            gl.vertexAttribPointer(programLines.aPosition, 4, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, 0, elements);
        };
    };

    this.resize = (w, h) => {
        width = w;
        height = h;
        matrixProjection.perspective(Renderer.ANGLE, w / h, Renderer.Z_NEAR, Renderer.Z_FAR);

        gl.viewport(0, 0, width, height);

        updateMatrices();
    };

    this.view = (from, to, up) => {
        matrixView.lookAt(from, to, up);

        updateMatrices();
    };

    this.clear = () => {
        programCurrent = null;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);
};

Renderer.Z_NEAR = 0.1;
Renderer.Z_FAR = 500;
Renderer.ANGLE = Math.PI * 0.5;
Renderer.SHADER_VERSION = "#version 100\n";
Renderer.SHADER_LINES_VERTEX = Renderer.SHADER_VERSION +
    "uniform mat4 transform;" +
    "uniform float t;" +
    "uniform float alpha;" +
    "uniform float flashStart;" +
    "attribute vec4 position;" +
    "varying mediump float transparency;" +
    "void main() {" +
        "if (position.w > t)" +
            "transparency = 0.0;" +
        "else {" +
            "if (t < flashStart) " +
                "transparency = 0.2 * position.w / t;" +
            "else " +
                "transparency = alpha * pow(max(0.0, 1.0 - (t - position.w) * 2.0), 6.0);" +
        "}" +
        "gl_Position = transform * vec4(position.xyz * length(position.xyz) * 0.005 * pow(t, 0.3), 1.0);" +
    "}";
Renderer.SHADER_LINES_FRAGMENT = Renderer.SHADER_VERSION +
    "varying mediump float transparency;" +
    "void main() {" +
        "if (transparency == 0.0) discard;" +
        "gl_FragColor = vec4(1.0, 0.97, 0.9, transparency);" +
    "}";