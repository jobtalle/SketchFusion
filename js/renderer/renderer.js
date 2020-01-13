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

        this.free = () => {
            gl.deleteProgram(program);
        };

        for (const uniform of uniforms)
            this["u" + uniform.charAt(0).toUpperCase() + uniform.slice(1)] = gl.getUniformLocation(program, uniform);

        for (const attrib of attributes)
            this["a" + attrib.charAt(0).toUpperCase() + attrib.slice(1)] = gl.getAttribLocation(program, attrib);
    };

    const programLines = new Shader(
        Renderer.SHADER_LINES_VERTEX,
        Renderer.SHADER_LINES_FRAGMENT,
        ["transform", "t"],
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

    this.MeshLines = function() {
        const buffer = gl.createBuffer();
        const data = [];
        let elements = 0;
        let updated = false;

        const update = () => {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

            updated = false;
        };

        this.clear = () => {
            elements = 0;
            data.length = 0;
        };

        this.add = (start, fStart, end, fEnd) => {
            data.push(start.x, start.y, start.z, fStart, end.x, end.y, end.z, fEnd);

            ++elements;
            updated = true;
        };

        this.append = end => {
            for (let i = 0; i < 3; ++i)
                data.push(data[data.length - 3]);

            data.push(end.x, end.y, end.z);

            ++elements;
            updated = true;
        };

        this.draw = progress => {
            setProgram(programLines);

            gl.uniform1f(programLines.uT, progress);

            if (updated)
                update();
            else
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

            gl.enableVertexAttribArray(programLines.aPosition);
            gl.vertexAttribPointer(programLines.aPosition, 4, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, 0, elements << 1);
        };

        this.free = () => {
            gl.deleteBuffer(buffer);
        };
    };

    this.resize = (w, h) => {
        width = w;
        height = h;
        matrixProjection.perspective(Math.PI * 0.5, w / h, Renderer.Z_NEAR, Renderer.Z_FAR);

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

    this.free = () => {
        programLines.free();
    };

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);
    gl.getExtension("OES_element_index_uint");
};

Renderer.Z_NEAR = 0.1;
Renderer.Z_FAR = 500;
Renderer.SHADER_VERSION = "#version 100\n";
Renderer.SHADER_LINES_VERTEX = Renderer.SHADER_VERSION +
    "uniform mat4 transform;" +
    "uniform float t;" +
    "attribute vec4 position;" +
    "varying mediump float alpha;" +
    "void main() {" +
        "alpha = pow(0.5 - 0.5 * cos((position.w - t) * 6.28), 4.0);" +
        "gl_Position = transform * vec4(position.xyz, 1.0);" +
    "}";
Renderer.SHADER_LINES_FRAGMENT = Renderer.SHADER_VERSION +
    "varying mediump float alpha;" +
    "void main() {" +
        "gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);" +
    "}";
Renderer.SHADER_TUBES_VERTEX = Renderer.SHADER_VERSION +
    "uniform mat4 transform;" +
    "uniform vec3 shift;" +
    "attribute vec3 center;" +
    "attribute vec3 normal;" +
    "varying mediump vec3 v_normal;" +
    "void main() {" +
        "v_normal = normal;" +
        "gl_Position = transform * vec4(center + shift + normal * 0.1, 1.0);" +
    "}";
Renderer.SHADER_TUBES_FRAGMENT = Renderer.SHADER_VERSION +
    "varying mediump vec3 v_normal;" +
    "void main() {" +
        "mediump vec3 light = normalize(vec3(0, 0.5, -1.0));" +
        "mediump float lightness = max(0.3, dot(normalize(v_normal) * 0.8, light));" +
        "gl_FragColor = vec4(vec3(lightness), 1.0);" +
    "}";